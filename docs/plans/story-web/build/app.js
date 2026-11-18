(function () {
'use strict';
const D = EW_DATA, RACE = {}, CAST = {}, ENT = {}, ENTS = [];
/* roster entries: one per race variant (id r:<race> or r:<race>:<gender>) and one per story character (id s:<id>) */
const raceId = (k, g) => { const r = RACE[k]; return r && r.v.length > 1 ? 'r:' + k + ':' + (r.v.some(v => v.g === g) ? g : r.dg) : 'r:' + k; };
D.races.forEach(r => { RACE[r.k] = r; const d = r.v.find(v => v.g === r.dg) || r.v[0]; r.img = d.img; r.v.forEach(v => { const e = { id: raceId(r.k, v.g), kind: 'race', r, v, n: v.n, t: r.t, img: v.img }; ENT[e.id] = e; ENTS.push(e); }); });
(D.cast || []).forEach(c => { CAST[c.id] = c; const e = { id: 's:' + c.id, kind: 'cast', c, n: c.n, t: c.t, img: c.img }; ENT[e.id] = e; ENTS.push(e); });
const GRP_NAME = { cast: 'Story cast', tape: 'Orientation tape squad', boss: 'Bosses' }, GRP_BADGE = { cast: 'STORY', tape: 'TAPE', boss: 'BOSS' };
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = p => p + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const KEY = 'ew-relationship-web-v1';
const R_NODE = 36;

const FACTIONS = [['human', 'Human'], ['divine', 'Divine'], ['unholy', 'Unholy'], ['anomaly', 'Anomaly'], ['tech', 'Tech'], ['alien', 'Alien']];
const FNAME = Object.fromEntries(FACTIONS);
/* fx = what the tie means when the TARGET is attacked (the encounter tie-in):
   defend: actor steps in for target · defendRev: target steps in for actor · maybe / maybeRev: might step in
   attack: actor joins in against target · avoid: actor stays out */
const TYPES = [
  { id: 'defends', n: 'defends', one: '{a} defends {b}', both: '{a} and {b} defend each other', fx: 'defend', dir: 'ab' },
  { id: 'allied', n: 'allied', one: '{a} is allied to {b}', both: '{a} and {b} are allies', fx: 'defend', sym: 1, dir: 'both' },
  { id: 'family', n: 'family', one: '{a} is family to {b}', both: '{a} and {b} are family', fx: 'defend', sym: 1, dir: 'both' },
  { id: 'loves', n: 'loves', one: '{a} loves {b}', both: '{a} and {b} love each other', fx: 'defend', dir: 'ab' },
  { id: 'serves', n: 'serves', one: '{a} serves {b}', both: '{a} and {b} serve each other', fx: 'defend', dash: '11 5', dir: 'ab' },
  { id: 'worships', n: 'worships', one: '{a} worships {b}', both: '{a} and {b} worship each other', fx: 'defend', dash: '11 5', dir: 'ab' },
  { id: 'employs', n: 'employs', one: '{a} employs {b}', both: '{a} and {b} employ each other', fx: 'defendRev', dash: '11 5', dir: 'ab' },
  { id: 'created', n: 'created', one: '{a} created {b}', both: '{a} and {b} made each other', fx: 'maybeRev', dash: '11 5', dir: 'ab' },
  { id: 'owes', n: 'owes', one: '{a} owes {b}', both: '{a} and {b} owe each other', fx: 'maybe', dash: '11 4 2 4', dir: 'ab' },
  { id: 'rivals', n: 'rivals', one: '{a} is a rival of {b}', both: '{a} and {b} are rivals', fx: 'attack', sym: 1, dash: '5 5', dir: 'both' },
  { id: 'hunts', n: 'hunts', one: '{a} hunts {b}', both: '{a} and {b} hunt each other', fx: 'attack', dash: '5 5', dir: 'ab' },
  { id: 'hates', n: 'hates', one: '{a} hates {b}', both: '{a} and {b} hate each other', fx: 'attack', dash: '5 5', dir: 'ab' },
  { id: 'fears', n: 'fears', one: '{a} fears {b}', both: '{a} and {b} fear each other', fx: 'avoid', dash: '1.5 5', dir: 'ab' },
  { id: 'other', n: 'knows', one: '{a} is tied to {b}', both: '{a} and {b} are tied', fx: null, sym: 1, dir: 'both' },
];
const TYPE = Object.fromEntries(TYPES.map(t => [t.id, t]));
/* a group node (Circus, DOOR, a faction): a unit tied to it is in that group; no tie needed between members */
TYPE.member = { id: 'member', n: 'in', one: '{a} is in {b}', both: '{a} and {b} share a group', fx: null, dir: 'ab' };
const GCOL = ['#c6352b', '#d06a12', '#c79a12', '#46962f', '#0e9393', '#3274c4', '#7d4fc4', '#a02d63'];
const isGrp = n => !!n && n.kind === 'custom' && n.shape === 'group';
const gcol = n => GCOL[(n && n.col) || 0] || GCOL[0];
/* the units in a group node, or the groups a unit is in */
const membersOf = (id, board) => Object.values((board || B).links).filter(l => l.type === 'member' && l.b === id).map(l => l.a);
const groupsOf = (id, board) => Object.values((board || B).links).filter(l => l.type === 'member' && l.a === id).map(l => l.b);
const FX_NOTE = { defend: 'the actor steps in when the target is attacked', defendRev: 'the target steps in when the actor is attacked', maybe: 'the actor might step in for the target', maybeRev: 'the target might step in for the actor', attack: 'the actor joins in against the target', avoid: 'the actor stays out of it' };
const TEMPER_TEXT = { flee: 'runs', talk: 'talks', fight: 'fights' };
const STARTS_TEXT = { mug: 'walks up and mugs (pay or fight)', ground: 'gives one warning on its own ground, then fights', sight: 'attacks on sight', defend: 'starts a fight when it sees someone it defends get struck' };

/* ───────── state ───────── */
let S = null, B = null, sel = null, linkMode = false, groupMode = false, multi = new Set(), pendingSrc = null, editing = null;
let hist = [], hi = -1, G = {}, elById = new Map(), fresh = false;
const stage = $('stage'), world = $('world'), edgesEl = $('edges'), tagsEl = $('tags'), nodesEl = $('nodes');

function seed() {
  const N = (k, x, y) => ({ id: 'r:' + k, kind: 'race', race: k, x, y, note: '' });
  const nodes = {};
  [N('police officer', -300, -130), N('chef', -30, -130), N('gangster', 240, -130), N('superhero', -300, 120), N('sidekick', -30, 120), N('bigfoot', 240, 120), N('yeti', 500, 120)]
    .filter(n => RACE[n.race]).forEach(n => { nodes[n.id] = n; });
  nodes.n_sample = { id: 'n_sample', kind: 'note', x: 380, y: -330, color: 'y', text: 'Story idea cards go anywhere on the board.\n\nWhat if the Chef is feeding both of them?' };
  const links = {};
  const Lk = (id, a, b, type, dir, label) => { if (nodes['r:' + a] && nodes['r:' + b]) links[id] = { id, a: 'r:' + a, b: 'r:' + b, type, dir, label, s: 2 }; };
  Lk('l_s1', 'police officer', 'chef', 'defends', 'ab', 'Sample, from the game rules: Guards defend Civilians');
  Lk('l_s2', 'gangster', 'chef', 'hunts', 'ab', 'Sample, made up: the protection money is late');
  Lk('l_s3', 'superhero', 'sidekick', 'allied', 'both', 'Sample, from the game rules: the heroes group');
  Lk('l_s4', 'bigfoot', 'yeti', 'rivals', 'both', 'Sample, made up: tired of being mistaken for each other');
  return {
    v: 1, active: 'example', order: ['example', 'main'], deleted: {}, ui: { group: 'faction', lastType: 'defends', legend: false },
    boards: {
      example: { id: 'example', name: 'Sample board', t: 0, sample: true, nodes, links, view: null },
      main: { id: 'main', name: 'Main board', t: 0, nodes: {}, links: {}, view: null },
    },
  };
}
function num(v, d) { v = +v; return Number.isFinite(v) ? v : d; }
function sanitizeBoard(b) {
  const o = { id: String(b.id || uid('b')).replace(/[^A-Za-z0-9_\-]/g, '_'), name: String(b.name || 'Board').slice(0, 80), t: num(b.t, 0), nodes: {}, links: {}, view: null };
  if (b.sample) o.sample = true;
  if (b.view && Number.isFinite(+b.view.k)) o.view = { x: num(b.view.x, 0), y: num(b.view.y, 0), k: clamp(num(b.view.k, 1), .15, 2.5) };
  const remap = {};
  Object.values(b.nodes || {}).forEach(n => {
    if (!n || !n.id) return;
    const m = { id: String(n.id), kind: n.kind, x: num(n.x, 0), y: num(n.y, 0) };
    if (n.kind === 'cast' && !CAST[n.cast]) { n = Object.assign({}, n, { kind: 'custom', name: n.name || n.cast }); m.kind = 'custom'; }
    if (n.kind === 'note') { m.text = String(n.text || ''); m.color = /^[ybgp]$/.test(n.color) ? n.color : 'y'; }
    else {
      m.note = String(n.note || '');
      if (n.kind === 'race' && RACE[n.race]) {
        /* a board saved before variants existed holds plain race keys: they resolve to the variant whose face they wore */
        m.race = n.race; if (RACE[n.race].v.length > 1) m.g = RACE[n.race].v.some(v => v.g === n.g) ? n.g : RACE[n.race].dg;
        m.id = raceId(m.race, m.g); if (m.id !== String(n.id)) remap[String(n.id)] = m.id; if (o.nodes[m.id] && m.id !== String(n.id)) return;
      }
      else if (n.kind === 'cast') { m.cast = n.cast; m.id = 's:' + n.cast; if (m.id !== String(n.id)) remap[String(n.id)] = m.id; }
      else { m.kind = 'custom'; m.name = String(n.name || n.race || 'Unnamed').slice(0, 60); m.sub = String(n.sub || '').slice(0, 60); m.faction = FNAME[n.faction] ? n.faction : ''; m.shape = /^(character|org|boss|place|group)$/.test(n.shape) ? n.shape : 'character'; if (m.shape === 'group') m.col = clamp(Math.round(num(n.col, 0)), 0, 7); if (RACE[n.race] && n.kind !== 'race') m.race = n.race; }
    }
    o.nodes[m.id] = m;
  });
  Object.values(b.links || {}).forEach(l => {
    if (l && (remap[l.a] || remap[l.b])) l = Object.assign({}, l, { a: remap[l.a] || l.a, b: remap[l.b] || l.b });
    if (!l || !l.id || !o.nodes[l.a] || !o.nodes[l.b] || l.a === l.b || o.nodes[l.a].kind === 'note' || o.nodes[l.b].kind === 'note') return;
    o.links[l.id] = { id: String(l.id), a: l.a, b: l.b, type: TYPE[l.type] ? l.type : 'other', dir: /^(ab|ba|both)$/.test(l.dir) ? l.dir : 'ab', label: String(l.label || '').slice(0, 300), s: clamp(Math.round(num(l.s, 2)), 1, 3), ...(l.secret ? { secret: true } : {}) };
  });
  return o;
}
function sanitizeState(x) {
  const o = { v: 1, active: '', order: [], deleted: {}, ui: Object.assign({ group: 'faction', lastType: 'defends', legend: false }, x.ui || {}), boards: {} };
  Object.values(x.boards || {}).forEach(b => { if (b && typeof b === 'object') { const c = sanitizeBoard(b); o.boards[c.id] = c; } });
  (x.order || []).forEach(id => { if (o.boards[id] && !o.order.includes(id)) o.order.push(id); });
  Object.keys(o.boards).forEach(id => { if (!o.order.includes(id)) o.order.push(id); });
  Object.entries(x.deleted || {}).forEach(([k, v]) => { if (!o.boards[k]) o.deleted[k] = num(v, 0); });
  if (!o.order.length) { const m = { id: 'main', name: 'Main board', t: 0, nodes: {}, links: {}, view: null }; o.boards.main = m; o.order.push('main'); }
  o.active = o.boards[x.active] ? x.active : o.order[0];
  return o;
}
function loadLocal() {
  try { const raw = localStorage.getItem(KEY); if (raw) return sanitizeState(JSON.parse(raw)); } catch (e) {}
  fresh = true; return sanitizeState(seed());
}
let localTimer = 0, localOk = true;
function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); localOk = true; } catch (e) { localOk = false; } setSave(); }
function saveLocalSoon() { clearTimeout(localTimer); localTimer = setTimeout(saveLocal, 350); }

/* ───────── cloud (the artifact's db capability, when the page has it) ───────── */
const cloud = { db: null, state: 'off', dirty: new Set(), dels: new Set(), idx: false, busy: false, timer: 0 };
function setSave() {
  const el = $('saveState'); let cls = 'local', txt = 'Saved on this device', tip = 'Boards are kept in this browser. Use Export, then Save a backup, to keep a copy elsewhere.';
  const pend = cloud.dirty.size || cloud.dels.size || cloud.idx;
  if (cloud.state === 'loading') { cls = 'busy'; txt = 'Loading saved boards'; tip = ''; }
  else if (cloud.state === 'ok') { if (cloud.busy || pend) { cls = 'busy'; txt = 'Saving'; } else { cls = ''; txt = 'Saved'; } tip = 'Saved with this page, and in this browser.'; }
  else if (cloud.state === 'ro') { txt = 'View only: changes stay on this device'; tip = 'You can change this board here, but only the owner can save it to the page.'; }
  else if (cloud.state === 'err') { cls = 'err'; txt = 'Not saved online: kept on this device'; tip = 'Saving to the page failed. Your work is in this browser. Save a backup from Export to be safe.'; }
  if (!localOk && cloud.state !== 'ok') { cls = 'err'; txt = 'Could not save: export a backup'; }
  el.className = cls; el.lastElementChild.textContent = txt; el.title = tip;
}
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), ms))]);
async function cloudInit() {
  if (!(window.claude && typeof window.claude.use === 'function')) return;
  let db = null; try { db = await window.claude.use('db'); } catch (e) {}
  if (!db) return;
  cloud.db = db; cloud.state = 'loading'; setSave();
  try {
    const res = await withTimeout(Promise.all([db.doc('web/index').get(), db.collection('boards').limit(500).get()]), 12000);
    mergeRemote(res[0] && res[0].exists ? res[0].data() : null, (res[1].docs || []).map(d => d.data()).filter(Boolean));
    cloud.state = 'ok';
  } catch (e) { cloud.state = 'err'; }
  setSave(); if (cloud.state === 'ok') flushSoon(50);
}
function mergeRemote(idx, boards) {
  const rdel = (idx && idx.deleted) || {}; let changed = false; cloud.hasIdx = !!idx;
  Object.keys(rdel).forEach(id => { const lb = S.boards[id]; if (lb && (lb.t || 0) <= rdel[id]) { delete S.boards[id]; S.order = S.order.filter(x => x !== id); S.deleted[id] = rdel[id]; changed = true; } });
  const seen = new Set();
  boards.forEach(rb => {
    if (!rb || !rb.id) return; seen.add(rb.id);
    const ld = S.deleted[rb.id]; if (ld && ld >= (rb.t || 0)) { cloud.dels.add(rb.id); return; }
    const lb = S.boards[rb.id];
    if (!lb || (rb.t || 0) > (lb.t || 0)) { const c = sanitizeBoard(rb); if (lb && lb.view) c.view = lb.view; S.boards[c.id] = c; delete S.deleted[c.id]; changed = true; }
    else if ((lb.t || 0) > (rb.t || 0)) cloud.dirty.add(lb.id);
  });
  Object.values(S.boards).forEach(lb => { if (!seen.has(lb.id) && lb.t > 0) { cloud.dirty.add(lb.id); cloud.idx = true; } });
  const order = ((idx && idx.order) || []).filter(id => S.boards[id]);
  S.order.forEach(id => { if (S.boards[id] && !order.includes(id)) order.push(id); });
  Object.keys(S.boards).forEach(id => { if (!order.includes(id)) order.push(id); });
  if (order.join('|') !== S.order.join('|')) { S.order = order; changed = true; }
  if (!S.boards[S.active]) S.active = S.order[0];
  if (fresh && changed) { const own = S.order.find(id => S.boards[id].t > 0); if (own) S.active = own; }
  if (changed) { B = S.boards[S.active]; sel = null; hist = []; hi = -1; pushHist(); saveLocal(); ensureView(); renderAll(); }
}
function flushSoon(ms) { if (!cloud.db || cloud.state === 'ro' || cloud.state === 'loading') return; clearTimeout(cloud.timer); cloud.timer = setTimeout(flush, ms == null ? 1400 : ms); setSave(); }
async function flush() {
  if (!cloud.db || cloud.busy) return; cloud.busy = true; setSave();
  let cur = null;
  try {
    while (cloud.dirty.size || cloud.dels.size || cloud.idx) {
      for (const id of [...cloud.dirty]) { cur = id; cloud.dirty.delete(id); if (S.boards[id]) await cloud.db.doc('boards/' + id).set(JSON.parse(JSON.stringify(S.boards[id]))); }
      cur = null;
      for (const id of [...cloud.dels]) { cloud.dels.delete(id); if (!S.boards[id]) await cloud.db.doc('boards/' + id).delete(); }
      if (cloud.idx) { cloud.idx = false; await cloud.db.doc('web/index').set({ order: S.order.slice(), deleted: Object.assign({}, S.deleted), t: Date.now() }); cloud.hasIdx = true; }
    }
    cloud.state = 'ok';
  } catch (e) {
    if (cur) cloud.dirty.add(cur); cloud.idx = true;
    const code = e && e.code;
    if (code === 'invalid_argument' || code === 'not_granted' || code === 'revoked') cloud.state = 'ro';
    else { cloud.state = 'err'; clearTimeout(cloud.timer); cloud.timer = setTimeout(() => { cloud.state = 'ok'; flush(); }, 15000); }
  }
  cloud.busy = false; setSave();
}

/* ───────── history ───────── */
const snap = () => JSON.stringify({ boards: S.boards, order: S.order, active: S.active });
function pushHist() { hist = hist.slice(0, hi + 1); hist.push(snap()); if (hist.length > 120) hist.shift(); hi = hist.length - 1; }
function touch(id) { const b = S.boards[id || B.id]; if (b) { b.t = Date.now(); cloud.dirty.add(b.id); if (!cloud.hasIdx) cloud.idx = true; } }
function commit(opts) {
  opts = opts || {};
  touch(); if (opts.index) cloud.idx = true;
  pushHist(); saveLocal(); flushSoon();
  if (opts.light) { drawEdges(); updateButtons(); return; }
  renderAll();
}
function restore(i) {
  const before = JSON.parse(hist[hi]), after = JSON.parse(hist[i]); hi = i;
  const now = Date.now();
  Object.keys(before.boards).forEach(id => { if (!after.boards[id]) { S.deleted[id] = now; cloud.dels.add(id); } });
  Object.values(after.boards).forEach(b => { if (JSON.stringify(b) !== JSON.stringify(before.boards[b.id])) { b.t = now; cloud.dirty.add(b.id); delete S.deleted[b.id]; cloud.dels.delete(b.id); } });
  Object.keys(after.boards).forEach(id => { const v = S.boards[id] && S.boards[id].view; if (v) after.boards[id].view = v; });
  S.boards = after.boards; S.order = after.order; S.active = S.boards[after.active] ? after.active : S.order[0];
  B = S.boards[S.active]; cloud.idx = true; sel = null; stopEdit(false); ensureView(); saveLocal(); flushSoon(); renderAll();
}
const undo = () => { if (hi > 0) restore(hi - 1); };
const redo = () => { if (hi < hist.length - 1) restore(hi + 1); };

/* ───────── model helpers ───────── */
const initials = s => String(s || '?').split(/[\s\-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
function info(n) {
  if (n.kind === 'race') { const r = RACE[n.race], v = r.v.find(x => x.g === n.g) || r.v.find(x => x.g === r.dg) || r.v[0]; return { name: v.n, t: r.t, img: v.img, ini: initials(v.n), race: r, v }; }
  if (n.kind === 'cast') { const c = CAST[n.cast]; return { name: c.n, t: c.t, img: c.img, ini: initials(c.n), cast: c, badge: GRP_BADGE[c.grp] }; }
  const r = n.race && RACE[n.race];
  return { name: n.name, sub: n.sub, t: n.faction ? [n.faction] : [], img: r ? r.img : '', ini: initials(n.name), sq: n.shape === 'org' || n.shape === 'place', boss: n.shape === 'boss', custom: true };
}
const nm = id => { const n = B.nodes[id]; return n ? info(n).name : '?'; };
function picHTML(o) {
  const c1 = 'var(--f-' + (o.t[0] || 'none') + ')';
  return '<div class="pic' + (o.sq ? ' sq' : '') + '" style="--c1:' + c1 + (o.t[1] ? ';--c2:var(--f-' + o.t[1] + ')' : '') + (o.img ? ';--img:url(' + o.img + ')' : '') + '">' + (o.img ? '' : esc(o.ini)) + '</div>';
}
function actorTarget(l) { return l.dir === 'ba' ? [l.b, l.a] : [l.a, l.b]; }
function sentence(l, names, plain) {
  const T = TYPE[l.type] || TYPE.other, at = actorTarget(l), f = names || nm;
  let s = (l.dir === 'both' ? T.both : T.one).replace('{a}', f(at[0])).replace('{b}', f(at[1]));
  if (l.secret) s = 'Secretly, ' + s;
  if (plain) return s + (l.label ? ' (' + l.label + ')' : '');
  return esc(s) + (l.label ? ' <em>&mdash; ' + esc(l.label) + '</em>' : '');
}
/* the derived defence view for one node, on one board */
function defence(board, x) {
  const o = { defenders: [], maybe: [], against: [], avoid: [], stepsInFor: [], mightFor: [], goesAfter: [], avoids: [], all: [] };
  Object.values(board.links).forEach(l => {
    if (l.a !== x && l.b !== x) return;
    const y = l.a === x ? l.b : l.a, T = TYPE[l.type] || TYPE.other, at = actorTarget(l);
    const xActs = l.dir === 'both' || at[0] === x, yActs = l.dir === 'both' || at[0] === y, it = { id: y, l };
    o.all.push(it);
    switch (T.fx) {
      case 'defend': if (yActs) o.defenders.push(it); if (xActs) o.stepsInFor.push(it); break;
      case 'defendRev': if (xActs) o.defenders.push(it); if (yActs) o.stepsInFor.push(it); break;
      case 'maybe': if (yActs) o.maybe.push(it); if (xActs) o.mightFor.push(it); break;
      case 'maybeRev': if (xActs) o.maybe.push(it); if (yActs) o.mightFor.push(it); break;
      case 'attack': if (yActs) o.against.push(it); if (xActs) o.goesAfter.push(it); break;
      case 'avoid': if (yActs) o.avoid.push(it); if (xActs) o.avoids.push(it); break;
    }
  });
  Object.keys(o).forEach(k => o[k].sort((a, b) => (b.l.s || 2) - (a.l.s || 2)));
  return o;
}
function hooks(board) {
  const out = [], seen = new Set(), ids = Object.keys(board.nodes).filter(id => board.nodes[id].kind !== 'note'), def = {};
  const f = id => info(board.nodes[id]).name;
  ids.forEach(id => { def[id] = defence(board, id); });
  ids.forEach(x => {
    const d = def[x];
    d.against.forEach(a => d.defenders.forEach(g => { if (a.id !== g.id) out.push({ ids: [a.id, x, g.id], t: 'If ' + f(a.id) + ' goes after ' + f(x) + ', ' + f(g.id) + ' steps in.' }); }));
    for (let i = 0; i < d.stepsInFor.length; i++) for (let j = i + 1; j < d.stepsInFor.length; j++) {
      const p = d.stepsInFor[i].id, q = d.stepsInFor[j].id;
      if (def[p].against.some(z => z.id === q) || def[q].against.some(z => z.id === p)) out.push({ ids: [x, p, q], t: f(x) + ' is caught between ' + f(p) + ' and ' + f(q) + ': bound to both, and they are enemies.' });
    }
    d.stepsInFor.forEach(p => { if (d.goesAfter.some(z => z.id === p.id)) { const k = [x, p.id].sort().join('|'); if (!seen.has(k)) { seen.add(k); out.push({ ids: [x, p.id], t: f(x) + ' both protects and goes after ' + f(p.id) + '.' }); } } });
  });
  return out;
}
function temperText(r) {
  const out = [];
  if (r.tmp && D.tempers[r.tmp]) {
    const t = D.tempers[r.tmp];
    out.push('Temper: ' + r.tmp + '. When struck it ' + t.ladder.map(s => TEMPER_TEXT[s] || s).join(', then ') + '. ' + (t.starts ? 'It ' + STARTS_TEXT[t.starts] + '. ' : 'It never starts a fight. ') + (t.joins ? 'It joins fights for its group.' : 'It does not join other units’ fights.'));
    if (r.tmp === 'guard') out.push('As a Guard it defends ' + D.guardDefends.map(s => s + 's').join(' and ') + ' in its district.');
    if (D.guardDefends.includes(r.tmp)) out.push('Guards in its district defend it.');
  } else out.push('No temper set in the game yet (HQ_NPC_TEMPERS.races).');
  if (r.grp) out.push('Group “' + r.grp + '”: stands up for ' + D.groups[r.grp].filter(k => k !== r.k).map(k => RACE[k] ? RACE[k].n : k).join(', ') + '.');
  return out;
}

/* ───────── view ───────── */
function ensureView() { if (!B.view) { B.view = { x: 0, y: 0, k: 1 }; fit(true); } }
function applyView() {
  const v = B.view;
  world.style.transform = 'translate(' + v.x + 'px,' + v.y + 'px) scale(' + v.k + ')';
  stage.style.backgroundPosition = v.x + 'px ' + v.y + 'px'; stage.style.backgroundSize = 24 * v.k + 'px ' + 24 * v.k + 'px';
  positionPop(); saveLocalSoon();
}
function toWorld(cx, cy) { const r = stage.getBoundingClientRect(), v = B.view; return { x: (cx - r.left - v.x) / v.k, y: (cy - r.top - v.y) / v.k }; }
function viewCentre() { const r = stage.getBoundingClientRect(); return toWorld(r.left + r.width / 2, r.top + r.height / 2); }
function zoomAt(cx, cy, f) {
  const v = B.view, r = stage.getBoundingClientRect(), k = clamp(v.k * f, .15, 2.5), px = cx - r.left, py = cy - r.top;
  v.x = px - (px - v.x) * (k / v.k); v.y = py - (py - v.y) * (k / v.k); v.k = k; applyView();
}
function bbox(ids) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  (ids || Object.keys(B.nodes)).forEach(id => { const n = B.nodes[id]; if (!n) return; if (n.kind === 'note') { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + 190); y1 = Math.max(y1, n.y + 130); } else { x0 = Math.min(x0, n.x - 60); y0 = Math.min(y0, n.y - 50); x1 = Math.max(x1, n.x + 60); y1 = Math.max(y1, n.y + 76); } });
  return x0 === Infinity ? null : { x0, y0, x1, y1 };
}
function fit(silent) {
  const r = stage.getBoundingClientRect(), b = bbox(), v = B.view;
  if (!r.width) return;
  if (!b) { v.x = r.width / 2; v.y = r.height / 2; v.k = 1; }
  else { const pad = 40, k = clamp(Math.min((r.width - pad * 2) / (b.x1 - b.x0), (r.height - pad * 2 - 40) / (b.y1 - b.y0)), .15, 1.15); v.k = k; v.x = r.width / 2 - (b.x0 + b.x1) / 2 * k; v.y = r.height / 2 - (b.y0 + b.y1) / 2 * k; }
  if (!silent) applyView();
}
function centreOn(id) { const n = B.nodes[id]; if (!n) return; const r = stage.getBoundingClientRect(), v = B.view; v.x = r.width / 2 - n.x * v.k; v.y = r.height / 2 - n.y * v.k; applyView(); }

/* ───────── rendering: board ───────── */
function renderNodes() {
  let h = '';
  Object.values(B.nodes).forEach(n => {
    const s = (sel && sel.kind !== 'link' && sel.id === n.id ? ' sel' : '') + (multi.has(n.id) ? ' lasso' : '');
    if (n.kind === 'note') { h += '<div class="note c-' + (n.color || 'y') + s + '" data-id="' + esc(n.id) + '" style="left:' + n.x + 'px;top:' + n.y + 'px"><div class="grip"><span>Idea</span><span>drag</span></div><textarea spellcheck="false" placeholder="Story idea, hook, open question…" aria-label="Story idea">' + esc(n.text) + '</textarea></div>'; return; }
    if (isGrp(n)) { const k = membersOf(n.id).length; h += '<div class="node gnode' + s + (pendingSrc === n.id ? ' src' : '') + '" data-id="' + esc(n.id) + '" style="left:' + n.x + 'px;top:' + n.y + 'px;--gc:' + gcol(n) + '"><div class="pic gp">' + esc(n.name) + '<small>' + k + '</small></div><div class="handle"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6h8M6.5 2.5 10 6l-3.500 3.500"/></svg></div></div>'; return; }
    const o = info(n);
    h += '<div class="node' + s + (pendingSrc === n.id ? ' src' : '') + '" data-id="' + esc(n.id) + '" style="left:' + n.x + 'px;top:' + n.y + 'px">' + picHTML(o) + (o.boss ? '<span class="boss">BOSS</span>' : '') + (o.badge ? '<span class="boss story">' + o.badge + '</span>' : '') +
      '<div class="nm">' + esc(o.name) + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</div>' +
      '<div class="handle" title="Drag to another unit to tie them together"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6h8M6.5 2.5 10 6l-3.500 3.500"/></svg></div></div>';
  });
  nodesEl.innerHTML = h; elById = new Map();
  nodesEl.querySelectorAll('[data-id]').forEach(el => { elById.set(el.dataset.id, el); });
  nodesEl.querySelectorAll('.note textarea').forEach(autosize);
}
function autosize(t) { t.style.height = 'auto'; t.style.height = Math.max(54, t.scrollHeight) + 'px'; }
function geom(l, i, n) {
  const A = B.nodes[l.a], Bn = B.nodes[l.b]; if (!A || !Bn) return null;
  let p = A, q = Bn; if (l.a > l.b) { p = Bn; q = A; }
  const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
  const off = (i - (n - 1) / 2) * 52, mx = (p.x + q.x) / 2 + nx * off, my = (p.y + q.y) / 2 + ny * off;
  const cx = 2 * mx - (p.x + q.x) / 2, cy = 2 * my - (p.y + q.y) / 2;
  const T = TYPE[l.type] || TYPE.other, arrows = !(T.sym && l.dir === 'both') && l.type !== 'member', aA = arrows && (l.dir === 'ba' || l.dir === 'both'), aB = arrows && (l.dir === 'ab' || l.dir === 'both');
  const sw = l.type === 'member' ? 1.6 : [0, 1.7, 2.7, 4.4][l.s || 2], al = 9 + sw * 1.6;
  const end = (N, arrow) => { let ux = cx - N.x, uy = cy - N.y; const m = Math.hypot(ux, uy) || 1; ux /= m; uy /= m; const r0 = R_NODE + 5; return { tx: N.x + ux * r0, ty: N.y + uy * r0, lx: N.x + ux * (r0 + (arrow ? al * .8 : 0)), ly: N.y + uy * (r0 + (arrow ? al * .8 : 0)), ux, uy }; };
  const ea = end(A, aA), eb = end(Bn, aB);
  const path = 'M' + ea.lx.toFixed(1) + ' ' + ea.ly.toFixed(1) + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + eb.lx.toFixed(1) + ' ' + eb.ly.toFixed(1);
  const head = e => { const bx = e.tx + e.ux * al, by = e.ty + e.uy * al, w = al * .48; return 'M' + e.tx.toFixed(1) + ' ' + e.ty.toFixed(1) + 'L' + (bx - e.uy * w).toFixed(1) + ' ' + (by + e.ux * w).toFixed(1) + 'L' + (bx + e.uy * w).toFixed(1) + ' ' + (by - e.ux * w).toFixed(1) + 'Z'; };
  const tw = clamp(Math.hypot(eb.tx - ea.tx, eb.ty - ea.ty) - 36, 96, 230);
  return { tw, path, sw, heads: (aA ? head(ea) : '') + (aB ? head(eb) : ''), m: { x: .25 * ea.lx + .5 * cx + .25 * eb.lx, y: .25 * ea.ly + .5 * cy + .25 * eb.ly }, T };
}
function hull(P) { const p = P.map(q => ({ x: q.x, y: q.y })).sort((a, b) => a.x - b.x || a.y - b.y), cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x), lo = [], up = [];
  p.forEach(q => { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
  p.slice().reverse().forEach(q => { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
  return lo.slice(0, -1).concat(up.slice(0, -1)); }
function drawEdges() {
  const groups = {}; G = {};
  Object.values(B.links).forEach(l => { const k = l.a < l.b ? l.a + '|' + l.b : l.b + '|' + l.a; (groups[k] = groups[k] || []).push(l); });
  let svg = '', tags = '';
  const focus = sel && sel.kind === 'node' ? sel.id : null;
  Object.values(B.nodes).forEach(n => { if (!isGrp(n)) return; const pts = [n].concat(membersOf(n.id).map(id => B.nodes[id]).filter(Boolean)); if (pts.length < 2) return; const hp = hull(pts).map(q => q.x.toFixed(1) + ' ' + q.y.toFixed(1)); svg += '<path class="hull" d="M' + hp.join('L') + 'Z" fill="' + gcol(n) + '" stroke="' + gcol(n) + '"/>'; });
  Object.values(groups).forEach(arr => {
    arr.sort((a, b) => a.id < b.id ? -1 : 1).forEach((l, i) => {
      const g = geom(l, i, arr.length); if (!g) return; G[l.id] = g;
      const mem = l.type === 'member', c = mem ? gcol(B.nodes[l.b]) : 'var(--t-' + g.T.id + ')', isSel = sel && sel.kind === 'link' && sel.id === l.id, dim = focus && l.a !== focus && l.b !== focus;
      svg += '<g class="edge' + (isSel ? ' sel' : '') + (l.secret ? ' secret' : '') + '" data-id="' + esc(l.id) + '"' + (dim ? ' opacity=".22"' : '') + '><path class="hit" d="' + g.path + '"/>' +
        (isSel ? '<path class="halo" d="' + g.path + '" stroke-width="' + (g.sw + 9) + '"/>' : '') +
        '<path class="ln" d="' + g.path + '" stroke="' + c + '" stroke-width="' + g.sw + '"' + (g.T.dash ? ' stroke-dasharray="' + g.T.dash + '"' : '') + '/>' +
        (g.heads ? '<path class="ah" d="' + g.heads + '" fill="' + c + '"/>' : '') + '</g>';
      if (!mem) tags += '<div class="tag' + (isSel ? ' sel' : '') + (dim ? ' dim' : '') + '" data-id="' + esc(l.id) + '" style="left:' + g.m.x.toFixed(1) + 'px;top:' + g.m.y.toFixed(1) + 'px;max-width:' + Math.round(g.tw) + 'px;--c:' + c + (editing === l.id ? ';visibility:hidden' : '') + '"><b>' + (l.secret ? 'secretly ' : '') + g.T.n + '</b>' + (l.label ? ' ' + esc(l.label) : '') + '</div>';
    });
  });
  edgesEl.innerHTML = svg + '<path id="temp" d="" />'; tagsEl.innerHTML = tags;
  if (editing && G[editing]) { const te = $('tagedit'); te.style.left = G[editing].m.x + 'px'; te.style.top = G[editing].m.y + 'px'; }
  positionPop();
}
function renderOverlays() {
  const n = Object.keys(B.nodes).length, hint = $('hint'), ban = $('banner');
  hint.hidden = n > 0;
  if (!n) hint.innerHTML = '<h2>Nothing pinned yet</h2><p>Pick units from the roster to pin them here. Then drag from a unit’s red handle to another unit and type why they are tied.</p><p class="muted">Add named characters and story-idea cards from the bar above.</p>';
  ban.hidden = !B.sample;
  if (B.sample) ban.innerHTML = '<span><b>Sample board.</b> Two ties come from the game’s rules, two are made up to show how it works.</span><button class="btn sm pri" data-act="goMain">Start on a blank board</button>';
  stage.classList.toggle('linkmode', linkMode); stage.classList.toggle('lassomode', groupMode);
  $('btnLink').classList.toggle('on', linkMode);
  $('btnGroup').classList.toggle('on', groupMode);
}
function renderLegend() {
  const cnt = {}; Object.values(B.nodes).forEach(n => { if (n.kind !== 'note') (info(n).t.length ? info(n).t : ['none']).forEach(t => { cnt[t] = (cnt[t] || 0) + 1; }); });
  let h = '<div><div class="lrow">' + FACTIONS.map(f => '<span class="li" style="--c:var(--f-' + f[0] + ')"><i></i>' + f[1] + (cnt[f[0]] ? ' ' + cnt[f[0]] : '') + '</span>').join('') + '</div><div class="muted" style="margin-top:3px">Ring colour is the unit’s type. Two colours: two types.</div></div><div class="lrow">';
  h += TYPES.map(t => '<span class="li"><svg viewBox="0 0 26 8"><path d="M1 4h24" stroke="var(--t-' + t.id + ')" stroke-width="2.4" fill="none"' + (t.dash ? ' stroke-dasharray="' + t.dash + '"' : '') + '/></svg>' + t.n + '</span>').join('') + '</div>';
  $('legendBody').innerHTML = h;
}

/* ───────── rendering: roster ───────── */
const rf = { q: '', fac: new Set(), where: '' };
function rosterMatch(e) {
  if (rf.fac.size && !e.t.some(t => rf.fac.has(t))) return false;
  if (e.kind === 'cast') {
    const c = e.c; if (rf.where) return false;
    if (rf.q) { const hay = (c.n + ' ' + c.id + ' ' + c.title + ' ' + c.dept + ' ' + c.race + ' ' + c.rooms.join(' ') + ' ' + GRP_NAME[c.grp] + ' story cast character').toLowerCase(); if (!rf.q.split(/\s+/).every(w => hay.includes(w))) return false; }
    return true;
  }
  const r = e.r;
  if (rf.where) { const k = rf.where[0], v = rf.where.slice(2); if (k === 'b' && !r.bio.includes(v)) return false; if (k === 'h' && r.home !== v && !r.also.includes(v)) return false; if (k === 'w' && !r.walks.includes(v)) return false; }
  if (rf.q) { const hay = (r.v.map(v => v.n).join(' ') + ' ' + r.n + ' ' + r.k + ' ' + r.fam.join(' ') + ' ' + r.home + ' ' + r.bio.join(' ') + ' ' + r.role + ' ' + r.tmp + ' ' + r.grp + ' ' + r.t.join(' ')).toLowerCase(); if (!rf.q.split(/\s+/).every(w => hay.includes(w))) return false; }
  return true;
}
const pretty = s => String(s).replace(/_/g, ' ');
function rosterGroups() {
  const by = S.ui.group, groups = new Map(), add = (g, e) => { if (!groups.has(g)) groups.set(g, []); groups.get(g).push(e); };
  const hit = ENTS.filter(rosterMatch), out = [];
  ['cast', 'tape', 'boss'].forEach(g => { const list = hit.filter(e => e.kind === 'cast' && e.c.grp === g); if (list.length) out.push({ k: g, name: GRP_NAME[g], col: '', list, story: true }); });
  hit.filter(e => e.kind === 'race').forEach(e => { const r = e.r;
    if (by === 'faction') add(r.t[0] || 'none', e);
    else if (by === 'home') add(r.home || 'No home site', e);
    else if (by === 'biome') (r.bio.length ? r.bio : ['no biome']).forEach(b => add(b, e));
    else if (by === 'role') add(r.role || 'unknown', e);
    else add(r.tmp || 'no temper yet', e);
  });
  let keys = [...groups.keys()];
  if (by === 'faction') keys = FACTIONS.map(f => f[0]).filter(k => groups.has(k)); else keys.sort((a, b) => a.localeCompare(b));
  keys.forEach(k => out.push({ k, name: by === 'faction' ? (FNAME[k] || 'Untyped') : pretty(k), col: by === 'faction' ? 'var(--f-' + k + ')' : '', list: groups.get(k).slice().sort((a, b) => a.r.n.localeCompare(b.r.n) || (a.v.g < b.v.g ? 1 : -1)) }));
  return out;
}
let shown = [];
function tileHTML(e, label) {
  return '<button class="tile' + (B.nodes[e.id] ? ' onb' : '') + (e.kind === 'cast' ? ' story' : '') + '" data-id="' + esc(e.id) + '" title="' + esc(e.n + (e.kind === 'cast' ? (e.c.title ? ' · ' + e.c.title : '') : (e.r.home ? ' · ' + e.r.home : ''))) + '">' + picHTML({ t: e.t, img: e.img, ini: initials(e.n) }) + '<span>' + esc(label || e.n) + '</span></button>';
}
function renderRoster() {
  const gs = rosterGroups(); shown = []; let h = '';
  gs.forEach((g, gi) => {
    const races = g.story ? g.list.length : new Set(g.list.map(e => e.r.k)).size;
    h += '<div class="ghead"><h3>' + (g.col ? '<i style="--c:' + g.col + '"></i>' : '') + esc(g.name) + ' <span>' + g.list.length + '</span></h3><button class="btn sm ghost" data-addgroup="' + gi + '" title="Pin all ' + g.list.length + ' to the board">+ all</button></div><div class="tiles">';
    for (let i = 0; i < g.list.length; i++) {
      const e = g.list[i], nx = g.list[i + 1]; if (!shown.includes(e.id)) shown.push(e.id);
      /* the two variants of one race sit together in one double tile */
      if (e.kind === 'race' && nx && nx.kind === 'race' && nx.r === e.r) { if (!shown.includes(nx.id)) shown.push(nx.id); h += '<div class="pair">' + tileHTML(e) + tileHTML(nx) + '</div>'; i++; }
      else h += tileHTML(e);
    }
    h += '</div>';
  });
  if (!gs.length) h = '<p class="empty">Nothing matches. Clear the search or the filters.</p>';
  $('rlist').innerHTML = h; $('rlist')._groups = gs;
  $('rcount').textContent = shown.length + ' of ' + ENTS.length + ' shown';
  $('addShown').disabled = !shown.some(id => !B.nodes[id]);
  $('fchips').innerHTML = FACTIONS.map(f => '<button class="chip' + (rf.fac.has(f[0]) ? ' on' : '') + '" data-f="' + f[0] + '" style="--c:var(--f-' + f[0] + ')" aria-pressed="' + rf.fac.has(f[0]) + '"><i></i>' + f[1] + '</button>').join('');
}
function initWhere() {
  const bio = [...new Set(D.races.flatMap(r => r.bio))].sort(), home = [...new Set(D.races.map(r => r.home).filter(Boolean))].sort((a, b) => a.localeCompare(b)), walks = [...new Set(D.races.flatMap(r => r.walks))].sort();
  $('whereSel').innerHTML = '<option value="">Anywhere</option><optgroup label="Biome">' + bio.map(b => '<option value="b:' + esc(b) + '">' + esc(pretty(b)) + '</option>').join('') + '</optgroup><optgroup label="Home site">' + home.map(b => '<option value="h:' + esc(b) + '">' + esc(b) + '</option>').join('') + '</optgroup><optgroup label="Walks the encounter table of">' + walks.map(b => '<option value="w:' + esc(b) + '">' + esc(b) + '</option>').join('') + '</optgroup>';
  $('groupSel').value = S.ui.group || 'faction';
}

/* ───────── rendering: inspector ───────── */
function relList(items, cls) { return items.map(it => '<li data-link="' + esc(it.l.id) + '"><i style="--c:var(--t-' + it.l.type + ')"></i><span>' + sentence(it.l) + '</span></li>').join(''); }
function whyLine(it, verb) { const T = TYPE[it.l.type]; return '<li data-link="' + esc(it.l.id) + '"><i style="--c:var(--t-' + it.l.type + ')"></i><span><b>' + esc(nm(it.id)) + '</b> ' + verb + ' <em>(' + (it.l.secret ? 'secretly ' : '') + T.n + ')' + (it.l.label ? ' because: ' + esc(it.l.label) : '. No reason written yet.') + '</em></span></li>'; }
function typeChips(l) { return '<div class="tchips">' + TYPES.map(t => '<button class="tchip' + (l.type === t.id ? ' on' : '') + '" data-ltype="' + t.id + '" style="--c:var(--t-' + t.id + ')" title="' + esc(t.one.replace('{a}', 'A').replace('{b}', 'B') + (t.fx ? '. In a fight: ' + FX_NOTE[t.fx] + '.' : '')) + '">' + t.n + '</button>').join('') + '</div>'; }
function dirSeg(l) { const a = esc(nm(l.a)), b = esc(nm(l.b)); return '<div class="seg" role="group" aria-label="Direction"><button class="' + (l.dir === 'ab' ? 'on' : '') + '" data-ldir="ab" title="' + a + ' to ' + b + '">&rarr;</button><button class="' + (l.dir === 'both' ? 'on' : '') + '" data-ldir="both" title="Both ways">&harr;</button><button class="' + (l.dir === 'ba' ? 'on' : '') + '" data-ldir="ba" title="' + b + ' to ' + a + '">&larr;</button></div>'; }
function strengthSeg(l) { return '<div class="seg" role="group" aria-label="Strength">' + [[1, 'weak'], [2, 'firm'], [3, 'unbreakable']].map(s => '<button class="' + ((l.s || 2) === s[0] ? 'on' : '') + '" data-lstr="' + s[0] + '">' + s[1] + '</button>').join('') + '</div>'; }
function renderInspector() {
  const el = $('inspector'); let h = '<div class="ins"><button class="btn sm closeins" data-act="closeIns" style="align-self:flex-end">Close</button>';
  if (sel && sel.kind === 'link' && B.links[sel.id]) {
    const l = B.links[sel.id];
    h += '<h2>' + sentence(l).replace(/<em>.*$/, '') + '</h2>' +
      '<div><h4>Kind of tie</h4>' + typeChips(l) + '</div>' +
      '<div class="prow">' + dirSeg(l) + '<button class="btn sm" data-act="swapLink">Swap ends</button></div>' +
      '<label class="field"><span>Why? This text sits on the line.</span><textarea class="inp" id="insLabel" maxlength="300" placeholder="He owes him a debt from the Roswell job…">' + esc(l.label) + '</textarea></label>' +
      '<div><h4>How strong</h4>' + strengthSeg(l) + '</div>' +
      '<label class="prow"><input type="checkbox" id="insSecret"' + (l.secret ? ' checked' : '') + '> <span>Secret: the others on the board do not know</span></label>' +
      (TYPE[l.type].fx ? '<p class="muted">In a fight: ' + FX_NOTE[TYPE[l.type].fx] + '.</p>' : '<p class="muted">This kind of tie has no effect on who joins a fight.</p>') +
      '<div class="prow"><button class="btn danger" data-act="delSel">Delete this tie</button></div>';
  } else if (sel && sel.kind === 'node' && B.nodes[sel.id] && B.nodes[sel.id].kind === 'note') {
    const n = B.nodes[sel.id];
    h += '<h2>Story idea card</h2><div><h4>Colour</h4><div class="prow">' + [['y', 'Yellow'], ['b', 'Blue'], ['g', 'Green'], ['p', 'Pink']].map(c => '<button class="btn sm' + (n.color === c[0] ? ' on' : '') + '" data-notecol="' + c[0] + '">' + c[1] + '</button>').join('') + '</div></div><p class="muted">Type straight onto the card. Drag it by its top strip.</p><div class="prow"><button class="btn danger" data-act="delSel">Delete this card</button></div>';
  } else if (sel && sel.kind === 'node' && B.nodes[sel.id]) {
    const n = B.nodes[sel.id], o = info(n), r = o.race, cst = o.cast, d = defence(B, n.id), name = esc(o.name);
    h += '<div class="idh">' + picHTML(o) + '<div class="meta"><h2>' + name + '</h2>' + (r ? '<span class="key">race key: ' + esc(r.k) + (r.v.length > 1 ? ' \u00b7 gender: ' + o.v.g : '') + '</span>' : cst ? '<span class="key">' + (cst.grp === 'cast' ? 'DOOR_CAST.' : cst.grp === 'boss' ? 'BOSS_DEFS: ' : 'tutorial tape: ') + esc(cst.grp === 'tape' ? cst.raw : cst.id) + '</span>' : '<span class="key">custom ' + esc(n.shape || 'character') + '</span>') + '<div class="badges">' + (o.t.length ? o.t.map(t => '<span class="badge" style="--c:var(--f-' + t + ')">' + FNAME[t] + '</span>').join('') : '<span class="badge">no type</span>') + (r && r.role ? '<span class="badge">' + esc(r.role) + '</span>' : '') + (cst ? '<span class="badge">' + GRP_NAME[cst.grp] + '</span>' : '') + '</div>' + (r && r.cs ? '<span class="stamp">' + esc(r.cs) + '</span>' : '') + '</div></div>';
    if (r) {
      h += '<dl class="facts"><dt>Home site</dt><dd>' + esc(r.home || 'none on file') + (r.also.length ? ', also ' + esc(r.also.join(', ')) : '') + '</dd><dt>Biomes</dt><dd>' + (r.bio.length ? esc(r.bio.map(pretty).join(', ')) : 'none on file') + '</dd>' + (r.walks.length ? '<dt>Walks</dt><dd>' + esc(r.walks.join(', ')) + ' (encounter tables)</dd>' : '') + '<dt>Families</dt><dd>' + esc(r.fam.join(', ')) + '</dd>' + (r.fin ? '<dt>Finisher</dt><dd>' + esc(r.fin[0]) + '</dd>' : '') + '</dl>';
      const lore = r.dos || (r.cn ? 'Customs: ' + r.cn + '.' : ''), qs = o.v.q || r.q;
      if (o.v.sp) h += '<p class="muted" style="margin:0">This version\u2019s own spells (RACE_GENDER_SPELLS): ' + esc(o.v.sp.join(', ')) + '</p>';
      if (r.v.length > 1) h += '<p class="muted" style="margin:0">Other version: ' + esc(r.v.filter(x => x !== o.v).map(x => x.n).join(', ')) + (B.nodes[raceId(r.k, r.v.find(x => x !== o.v).g)] ? ' (on this board)' : '') + '</p>';
      if (lore || qs.length || r.fin) h += '<div><h4>On file</h4>' + (lore ? '<p style="margin:0 0 6px">' + esc(lore) + '</p>' : '') + qs.map(q => '<p class="quote">' + esc(q) + '</p>').join('') + (!lore && !qs.length && r.fin ? '<p class="quote">' + esc(r.fin[1]) + '</p>' : '') + '</div>';
    } else if (cst) {
      const base = cst.race && RACE[cst.race];
      h += '<dl class="facts">' + (cst.title ? '<dt>Title</dt><dd>' + esc(cst.title) + '</dd>' : '') + (cst.dept ? '<dt>Department</dt><dd>' + esc(cst.dept) + '</dd>' : '') + (cst.g ? '<dt>Gender</dt><dd>' + esc(cst.g) + '</dd>' : '') + (base ? '<dt>Race</dt><dd>' + esc(base.n) + ' (' + esc(cst.race) + ')</dd>' : cst.tmpl ? '<dt>Unit template</dt><dd>' + esc(cst.tmpl) + ' (the cast default)</dd>' : '') + (cst.rooms.length ? '<dt>Found in</dt><dd>' + esc(cst.rooms.join('; ')) + '</dd>' : '') + (cst.hidden ? '<dt>Appears</dt><dd>Cutscenes only. Never stands in the building.</dd>' : '') + '<dt>Portrait</dt><dd>' + (cst.ik === 'model' ? 'Taken from this character’s own 3D model' : cst.ik === 'race' ? 'Borrowed from the ' + esc(base ? base.n : cst.race) + ' unit, as the game does' : 'None in the game files') + '</dd></dl>';
      if (cst.desc) h += '<div><h4>On file</h4><p style="margin:0">' + esc(cst.desc) + '</p></div>';
      if (cst.doing.length) h += '<div><h4>At their post</h4>' + cst.doing.map(q => '<p class="quote">' + esc(q) + '</p>').join('') + '</div>';
      const ln = cst.lines.concat(cst.says.map(x => '“' + x + '”').filter(x => !cst.lines.includes(x)));
      if (ln.length) h += '<div><h4>Lines in the game</h4>' + ln.slice(0, 12).map(q => '<p class="quote">' + esc(q) + '</p>').join('') + (ln.length > 12 ? '<p class="muted">and ' + (ln.length - 12) + ' more in the cutscenes</p>' : '') + '</div>';
    } else {
      h += '<div class="two"><label class="field"><span>Name</span><input class="inp" id="cName" maxlength="60" value="' + esc(n.name) + '"></label><label class="field"><span>Role or title</span><input class="inp" id="cSub" maxlength="60" value="' + esc(n.sub || '') + '"></label><label class="field"><span>Kind</span><select class="sel" id="cShape">' + [['character', 'Character'], ['boss', 'Boss'], ['org', 'Organisation'], ['place', 'Place']].map(x => '<option value="' + x[0] + '"' + (n.shape === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></label><label class="field"><span>Type</span><select class="sel" id="cFaction"><option value="">None</option>' + FACTIONS.map(f => '<option value="' + f[0] + '"' + (n.faction === f[0] ? ' selected' : '') + '>' + f[1] + '</option>').join('') + '</select></label></div><label class="field"><span>Portrait borrowed from</span><select class="sel" id="cRace"><option value="">Initials only</option>' + D.races.slice().sort((a, b) => a.n.localeCompare(b.n)).map(x => '<option value="' + esc(x.k) + '"' + (n.race === x.k ? ' selected' : '') + '>' + esc(x.n) + '</option>').join('') + '</select></label>';
    }
    h += '<label class="field"><h4 style="margin:0">Wants, fears, motive</h4><textarea class="inp" id="insNote" placeholder="What does ' + name + ' want on this board?">' + esc(n.note || '') + '</textarea></label>';
    h += '<div><h4>Ties on this board</h4>' + (d.all.length ? '<ul class="rel">' + relList(d.all) + '</ul>' : '<p class="muted">None yet. Drag from the red handle on ' + name + ' to another unit.</p>') + '</div>';
    h += '<div><h4>If ' + name + ' is attacked</h4>';
    if (d.defenders.length + d.maybe.length + d.against.length + d.avoid.length === 0) h += '<p class="muted">Nobody on this board has a reason to step in, yet.</p>';
    else h += (d.defenders.length ? '<div class="dgroup"><b>Comes to the defence</b><ul class="rel">' + d.defenders.map(it => whyLine(it, 'steps in')).join('') + '</ul></div>' : '') + (d.maybe.length ? '<div class="dgroup"><b>Might step in</b><ul class="rel">' + d.maybe.map(it => whyLine(it, 'might step in')).join('') + '</ul></div>' : '') + (d.against.length ? '<div class="dgroup"><b>Joins in against</b><ul class="rel">' + d.against.map(it => whyLine(it, 'piles on')).join('') + '</ul></div>' : '') + (d.avoid.length ? '<div class="dgroup"><b>Stays well out of it</b><ul class="rel">' + d.avoid.map(it => whyLine(it, 'keeps away')).join('') + '</ul></div>' : '');
    if (d.stepsInFor.length + d.goesAfter.length + d.mightFor.length + d.avoids.length) h += '<div class="dgroup"><b>' + name + ' in other fights</b><ul class="rel">' + d.stepsInFor.map(it => whyLine(it, 'is who ' + name + ' steps in for')).join('') + d.mightFor.map(it => whyLine(it, 'is who ' + name + ' might step in for')).join('') + d.goesAfter.map(it => whyLine(it, 'is who ' + name + ' goes after')).join('') + d.avoids.map(it => whyLine(it, 'is who ' + name + ' avoids')).join('') + '</ul></div>';
    h += '</div>';
    if (r) h += '<div><h4>Already in the game’s encounter rules</h4><ul class="rel">' + temperText(r).map(t => '<li class="game">' + esc(t) + '</li>').join('') + '</ul></div>';
    else if (cst && cst.grp === 'cast') h += '<div><h4>Already in the game\u2019s encounter rules</h4><ul class="rel"><li class="game">Story cast have no temper: they cannot be struck on the walk (HQ_NPC_TEMPERS).</li></ul></div>';
    h += '<div class="prow"><button class="btn" data-act="tieFrom">Tie to another unit</button><button class="btn danger" data-act="delSel">Take off the board</button></div>';
  } else {
    const ns = Object.values(B.nodes), units = ns.filter(n => n.kind !== 'note'), nl = Object.keys(B.links).length, hk = hooks(B);
    h += '<h2>' + esc(B.name) + '</h2><p class="muted" style="margin:-8px 0 0">' + units.length + ' pinned, ' + nl + (nl === 1 ? ' tie, ' : ' ties, ') + (ns.length - units.length) + ' idea cards</p>';
    h += '<div><h4>Story hooks from these ties</h4>' + (hk.length ? '<ul class="rel">' + hk.slice(0, 14).map(k => '<li data-node="' + esc(k.ids[1]) + '"><span>' + esc(k.t) + '</span></li>').join('') + '</ul>' + (hk.length > 14 ? '<p class="muted">and ' + (hk.length - 14) + ' more</p>' : '') : '<p class="muted">Hooks appear here when ties collide: a hunter and a defender of the same unit, or one unit bound to two enemies.</p>') + '</div>';
    const rows = units.map(n => ({ n, d: defence(B, n.id) })).filter(x => x.d.defenders.length || x.d.against.length);
    h += '<div><h4>Who defends whom</h4>' + (rows.length ? '<ul class="rel">' + rows.map(x => '<li data-node="' + esc(x.n.id) + '"><span><b>' + esc(info(x.n).name) + '</b>' + (x.d.defenders.length ? ' is defended by ' + esc(x.d.defenders.map(i => nm(i.id)).join(', ')) : '') + (x.d.defenders.length && x.d.against.length ? ';' : '') + (x.d.against.length ? ' is targeted by ' + esc(x.d.against.map(i => nm(i.id)).join(', ')) : '') + '.</span></li>').join('') + '</ul>' : '<p class="muted">No defending or hostile ties on this board yet.</p>') + '</div>';
    h += '<div><h4>How to</h4><p class="muted">Click a roster unit to pin it. Drag from a unit’s red handle (or hold Shift and drag) to tie it to another, then type the reason. Click a line to change its kind or direction. Scroll to zoom, drag the board to move.</p></div>';
  }
  el.innerHTML = h + '</div>';
}
const narrow = () => window.matchMedia('(max-width: 860px)').matches;
function renderPop() {
  const pop = $('linkpop');
  if (!(sel && sel.kind === 'link' && B.links[sel.id]) || !(editing || narrow())) { pop.hidden = true; return; }
  const l = B.links[sel.id]; pop.hidden = false;
  pop.innerHTML = '<div style="font-weight:600">' + sentence(l).replace(/<em>.*$/, '') + '</div>' + typeChips(l) + '<div class="prow">' + dirSeg(l) + '<button class="btn sm" data-act="editLabel">Edit text</button><span class="sp"></span><button class="btn sm danger" data-act="delSel">Delete</button></div>';
  positionPop();
}
function positionPop() {
  const pop = $('linkpop'); if (pop.hidden || !sel || !G[sel.id]) return;
  const v = B.view, m = G[sel.id].m, r = stage.getBoundingClientRect(), w = pop.offsetWidth, hh = pop.offsetHeight;
  let x = m.x * v.k + v.x - w / 2, y = m.y * v.k + v.y + 24;
  if (y + hh > r.height - 8) y = m.y * v.k + v.y - hh - 24;
  pop.style.left = clamp(x, 8, Math.max(8, r.width - w - 8)) + 'px'; pop.style.top = clamp(y, 8, Math.max(8, r.height - hh - 8)) + 'px';
}
function renderBoardSel() { $('boardSel').innerHTML = S.order.map(id => '<option value="' + esc(id) + '"' + (id === S.active ? ' selected' : '') + '>' + esc(S.boards[id].name) + '</option>').join(''); }
function updateButtons() { $('btnUndo').disabled = hi <= 0; $('btnRedo').disabled = hi >= hist.length - 1; }

/* panels are not rebuilt while a pointer is down, so a click never loses its target */
let pressing = false, deferred = false;
function renderPanels() { if (pressing) { deferred = true; return; } renderRoster(); renderInspector(); renderPop(); }
document.addEventListener('pointerdown', () => { pressing = true; }, true);
const release = () => { pressing = false; if (deferred) { deferred = false; setTimeout(renderPanels, 0); } };
document.addEventListener('pointerup', release, true); document.addEventListener('pointercancel', release, true);
function renderAll() { renderBoardSel(); renderNodes(); drawEdges(); renderOverlays(); renderLegend(); applyView(); renderPanels(); updateButtons(); }

/* ───────── actions ───────── */
let toastT = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2600); }
function select(s) { sel = s; if (!s || s.kind !== 'link') stopEdit(true); renderNodes(); drawEdges(); renderPanels(); }
let GRID = null;
function freeSpot(c, taken) {
  if (!GRID) { GRID = []; for (let i = -14; i <= 14; i++) for (let j = -14; j <= 14; j++) GRID.push([i * 170, j * 160]); GRID.sort((a, b) => (a[0] * a[0] + a[1] * a[1]) - (b[0] * b[0] + b[1] * b[1])); }
  for (const g of GRID) { const x = Math.round(c.x + g[0]), y = Math.round(c.y + g[1]); if (!taken.some(t => Math.abs(t.x - x) < 150 && Math.abs(t.y - y) < 140)) return { x, y }; }
  return { x: c.x, y: c.y };
}
const takenList = () => Object.values(B.nodes).map(n => n.kind === 'note' ? { x: n.x + 95, y: n.y + 60 } : { x: n.x, y: n.y });
function addEntries(ids, at) {
  ids = ids.filter(id => ENT[id] && !B.nodes[id]); if (!ids.length) return 0;
  const c = at || viewCentre(), taken = takenList();
  ids.forEach((id, i) => { const e = ENT[id], p = at && i === 0 ? { x: Math.round(at.x), y: Math.round(at.y) } : freeSpot(c, taken); taken.push(p);
    B.nodes[id] = e.kind === 'cast' ? { id, kind: 'cast', cast: e.c.id, x: p.x, y: p.y, note: '' } : Object.assign({ id, kind: 'race', race: e.r.k, x: p.x, y: p.y, note: '' }, e.r.v.length > 1 ? { g: e.v.g } : {}); });
  if (ids.length === 1) sel = { kind: 'node', id: ids[0] };
  commit();
  if (ids.length > 1) { toast('Pinned ' + ids.length); fit(); }
  return ids.length;
}
function addNote() { const c = viewCentre(), p = freeSpot({ x: c.x - 95, y: c.y - 60 }, takenList().map(t => ({ x: t.x - 95, y: t.y - 60 }))), id = uid('n'); B.nodes[id] = { id, kind: 'note', x: p.x, y: p.y, color: 'y', text: '' }; sel = { kind: 'node', id }; commit(); const t = elById.get(id); if (t) t.querySelector('textarea').focus(); }
function removeSel() {
  if (!sel) return;
  if (sel.kind === 'link') delete B.links[sel.id];
  else { delete B.nodes[sel.id]; Object.values(B.links).forEach(l => { if (l.a === sel.id || l.b === sel.id) delete B.links[l.id]; }); }
  sel = null; stopEdit(false); commit();
}
function createLink(a, b) {
  if (a === b || !B.nodes[a] || !B.nodes[b]) return;
  if (isGrp(B.nodes[a]) || isGrp(B.nodes[b])) {
    if (isGrp(B.nodes[a]) && !isGrp(B.nodes[b])) { const x = a; a = b; b = x; }
    if (!Object.values(B.links).some(l => l.type === 'member' && l.a === a && l.b === b)) { const id = uid('l'); B.links[id] = { id, a, b, type: 'member', dir: 'ab', label: '', s: 1 }; }
    sel = { kind: 'node', id: b }; pendingSrc = null; $('toast').hidden = true; commit(); return;
  }
  const T = TYPE[S.ui.lastType] || TYPE.defends, id = uid('l');
  B.links[id] = { id, a, b, type: T.id, dir: T.dir || 'ab', label: '', s: 2 };
  sel = { kind: 'link', id }; pendingSrc = null; $('toast').hidden = true; commit(); startEdit(id);
}
function setLink(patch) {
  const l = sel && sel.kind === 'link' && B.links[sel.id]; if (!l) return;
  if (patch.type && patch.type !== l.type) { const T = TYPE[patch.type]; S.ui.lastType = patch.type; if (T.sym) patch.dir = 'both'; else if (TYPE[l.type].sym && l.dir === 'both') patch.dir = T.dir || 'ab'; }
  Object.assign(l, patch); if (!l.secret) delete l.secret;
  commit();
}
function startEdit(id) {
  const l = B.links[id]; if (!l || !G[id]) return;
  editing = id; const te = $('tagedit'), inp = $('tagInput'); te.hidden = false; inp.value = l.label || ''; drawEdges();
  renderPop(); inp.focus(); inp.select();
}
function stopEdit(save) {
  if (!editing) return; const id = editing, l = B.links[id], v = $('tagInput').value.trim(); editing = null; $('tagedit').hidden = true;
  if (save && l && v !== (l.label || '')) { l.label = v; commit(); } else { drawEdges(); if (pressing) deferred = true; else renderPop(); }
}
$('tagInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); stopEdit(true); } else if (e.key === 'Escape') { e.preventDefault(); stopEdit(false); } e.stopPropagation(); });
$('tagInput').addEventListener('blur', () => { stopEdit(true); });
function switchBoard(id) { if (!S.boards[id]) return; stopEdit(true); S.active = id; B = S.boards[id]; sel = null; multi.clear(); pendingSrc = null; ensureView(); saveLocal(); renderAll(); }
function newBoard(name, from) {
  const id = uid('b'), src = from ? JSON.parse(JSON.stringify(from)) : { nodes: {}, links: {}, view: null };
  S.boards[id] = { id, name, t: Date.now(), nodes: src.nodes, links: src.links, view: src.view }; S.order.push(id); S.active = id; B = S.boards[id]; sel = null;
  ensureView(); commit({ index: true });
}
function deleteBoard(id) {
  delete S.boards[id]; S.order = S.order.filter(x => x !== id); S.deleted[id] = Date.now(); cloud.dels.add(id); cloud.dirty.delete(id);
  if (!S.order.length) { S.boards.main = { id: 'main', name: 'Main board', t: Date.now(), nodes: {}, links: {}, view: null }; S.order.push('main'); delete S.deleted.main; cloud.dels.delete('main'); cloud.dirty.add('main'); }
  S.active = S.order[0]; B = S.boards[S.active]; sel = null; ensureView(); cloud.idx = true; pushHist(); saveLocal(); flushSoon(); renderAll();
}
function arrange(mode) {
  const ids = Object.keys(B.nodes).filter(id => B.nodes[id].kind !== 'note'); if (ids.length < 2) return toast('Pin a few units first');
  if (mode === 'ties') {
    const P = ids.map(id => ({ id, x: B.nodes[id].x, y: B.nodes[id].y })), ix = Object.fromEntries(P.map((p, i) => [p.id, i])), E = Object.values(B.links).map(l => [ix[l.a], ix[l.b]]);
    for (let it = 0; it < 260; it++) {
      const f = P.map(() => [0, 0]), cool = 1 - it / 260;
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { let dx = P[i].x - P[j].x, dy = P[i].y - P[j].y; let d2 = dx * dx + dy * dy; if (d2 < 1) { dx = Math.random() - .5; dy = Math.random() - .5; d2 = 1; } const d = Math.sqrt(d2), k = Math.min(60, 26000 / d2); f[i][0] += dx / d * k; f[i][1] += dy / d * k; f[j][0] -= dx / d * k; f[j][1] -= dy / d * k; }
      E.forEach(e => { const a = P[e[0]], b = P[e[1]], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, k = (d - 230) * .06; f[e[0]][0] += dx / d * k; f[e[0]][1] += dy / d * k; f[e[1]][0] -= dx / d * k; f[e[1]][1] -= dy / d * k; });
      P.forEach((p, i) => { p.x += clamp(f[i][0], -40, 40) * cool; p.y += clamp(f[i][1], -40, 40) * cool; });
    }
    P.forEach(p => { B.nodes[p.id].x = Math.round(p.x); B.nodes[p.id].y = Math.round(p.y); });
  } else {
    const groups = {}; ids.forEach(id => { const n = B.nodes[id], o = info(n); const k = mode === 'home' ? ((o.race && o.race.home) || (o.cast && (o.cast.rooms[0] || GRP_NAME[o.cast.grp])) || 'Elsewhere') : (o.t[0] || 'none'); (groups[k] = groups[k] || []).push(id); });
    let keys = Object.keys(groups); if (mode !== 'home') keys = FACTIONS.map(f => f[0]).concat('none').filter(k => groups[k]); else keys.sort();
    const rad = keys.map(k => 62 * Math.sqrt(groups[k].length) + 70), sum = rad.reduce((a, b) => a + b, 0), big = keys.length === 1 ? 0 : Math.max(sum / Math.PI * 1.05, Math.max(...rad) * 1.25);
    let ang = -Math.PI / 2;
    keys.forEach((k, gi) => {
      const span = rad[gi] / sum * Math.PI * 2; ang += span / 2; const cx = Math.cos(ang) * big, cy = Math.sin(ang) * big; ang += span / 2;
      groups[k].sort((a, b) => nm(a).localeCompare(nm(b))).forEach((id, i) => { const r = 66 * Math.sqrt(i + .35), a = i * 2.39996; B.nodes[id].x = Math.round(cx + Math.cos(a) * r); B.nodes[id].y = Math.round(cy + Math.sin(a) * r * 1.12); });
    });
  }
  commit(); fit();
}

/* ───────── pointer handling on the board ───────── */
const ptrs = new Map(); let drag = null, pinch = null, raf = 0;
/* every unit tied to this one, through any chain of ties */
function groupOf(id) { const seen = new Set([id]), q = [id], adj = {}; Object.values(B.links).forEach(l => { if (l.type === 'member') return; (adj[l.a] = adj[l.a] || []).push(l.b); (adj[l.b] = adj[l.b] || []).push(l.a); }); while (q.length) (adj[q.shift()] || []).forEach(o => { if (!seen.has(o) && B.nodes[o]) { seen.add(o); q.push(o); } }); return [...seen]; }
function inPoly(x, y, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i].y > y) !== (P[j].y > y) && x < (P[j].x - P[i].x) * (y - P[i].y) / (P[j].y - P[i].y) + P[i].x) c = !c; return c; }
function setMulti(ids) { multi = new Set(ids.filter(id => B.nodes[id])); renderNodes(); }
function nodeAt(p, not) { let best = null, bd = 46; Object.values(B.nodes).forEach(n => { if (n.kind === 'note' || n.id === not) return; const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = n.id; } }); return best; }
stage.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button > 1) return;
  const t = e.target;
  if (t.closest('.overlay') || t.closest('#tagedit')) return;
  const nodeEl = t.closest('.node'), noteEl = t.closest('.note'), tagEl = t.closest('.tag'), edgeEl = t.closest('.edge'), onHandle = !!t.closest('.handle');
  const nid = nodeEl ? nodeEl.dataset.id : noteEl ? noteEl.dataset.id : null, lid = tagEl ? tagEl.dataset.id : edgeEl ? edgeEl.getAttribute('data-id') : null;
  if (noteEl && t.tagName === 'TEXTAREA') { if (!sel || sel.id !== nid) { sel = { kind: 'node', id: nid }; noteEl.classList.add('sel'); drawEdges(); renderPanels(); } return; }
  closeMenus();
  const ae = document.activeElement; if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) ae.blur();
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  try { stage.setPointerCapture(e.pointerId); } catch (err) {}
  e.preventDefault();
  if (ptrs.size === 2) { const a = [...ptrs.values()]; if (drag && drag.kind === 'node' && drag.moved) commit(); drag = null; clearTemp(); pinch = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1, k: B.view.k, cx: (a[0].x + a[1].x) / 2, cy: (a[0].y + a[1].y) / 2 }; return; }
  if (ptrs.size > 2) return;
  const p = toWorld(e.clientX, e.clientY), base = { pid: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false };
  if (nodeEl && e.button === 0 && (linkMode || e.shiftKey || onHandle)) drag = Object.assign(base, { kind: 'link', from: nid, tap: linkMode && !onHandle });
  else if (nid && e.button === 0) { const n = B.nodes[nid], grp = isGrp(n) ? (e.altKey ? [nid] : [nid].concat(membersOf(nid))) : e.altKey && n.kind !== 'note' ? groupOf(nid) : multi.has(nid) ? [...multi].filter(id => B.nodes[id]) : [nid]; drag = Object.assign(base, { kind: 'node', nid, px: p.x, py: p.y, grp: grp.map(id => ({ id, x: B.nodes[id].x, y: B.nodes[id].y })) }); }
  else if (lid && e.button === 0) drag = Object.assign(base, { kind: 'edge', lid, vx: B.view.x, vy: B.view.y });
  else if (e.button === 0 && (groupMode || e.altKey)) drag = Object.assign(base, { kind: 'lasso', pts: [p] });
  else drag = Object.assign(base, { kind: 'pan', vx: B.view.x, vy: B.view.y });
});
function clearTemp() { const t = $('temp'); if (t) t.setAttribute('d', ''); stage.classList.remove('linking', 'panning'); nodesEl.querySelectorAll('.node.drop, .node.grab').forEach(n => n.classList.remove('drop', 'grab')); }
stage.addEventListener('pointermove', e => {
  const P = ptrs.get(e.pointerId); if (!P) return; P.x = e.clientX; P.y = e.clientY;
  if (pinch) { const a = [...ptrs.values()]; if (a.length < 2) return; const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1, cx = (a[0].x + a[1].x) / 2, cy = (a[0].y + a[1].y) / 2; B.view.x += cx - pinch.cx; B.view.y += cy - pinch.cy; pinch.cx = cx; pinch.cy = cy; zoomAt(cx, cy, (pinch.k * d / pinch.d) / B.view.k); return; }
  if (!drag || drag.pid !== e.pointerId) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (!drag.moved) { if (Math.hypot(dx, dy) < 5) return; drag.moved = true; if (drag.kind === 'link') stage.classList.add('linking'); if (drag.kind === 'pan' || drag.kind === 'edge') stage.classList.add('panning'); }
  const p = toWorld(e.clientX, e.clientY);
  if (drag.kind === 'pan' || drag.kind === 'edge') { B.view.x = drag.vx + dx; B.view.y = drag.vy + dy; applyView(); }
  else if (drag.kind === 'node') {
    const mx = p.x - drag.px, my = p.y - drag.py;
    drag.grp.forEach(g => { const n = B.nodes[g.id]; if (!n) return; n.x = Math.round(g.x + mx); n.y = Math.round(g.y + my); const el = elById.get(n.id); if (el) { el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; if (drag.grp.length > 1) el.classList.add('grab'); } });
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawEdges(); });
  } else if (drag.kind === 'lasso') {
    drag.pts.push(p); $('temp').setAttribute('d', 'M' + drag.pts.map(q => q.x.toFixed(1) + ' ' + q.y.toFixed(1)).join('L') + 'Z');
  } else if (drag.kind === 'link') {
    const a = B.nodes[drag.from], hit = nodeAt(p, drag.from), q = hit ? B.nodes[hit] : p;
    $('temp').setAttribute('d', 'M' + a.x + ' ' + a.y + 'L' + q.x + ' ' + q.y);
    nodesEl.querySelectorAll('.node.drop').forEach(n => n.classList.remove('drop')); if (hit && elById.get(hit)) elById.get(hit).classList.add('drop');
  }
});
let lastTap = { id: null, t: 0 };
function endPtr(e) {
  if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId);
  if (pinch) { if (ptrs.size < 2) pinch = null; drag = null; return; }
  if (!drag || drag.pid !== e.pointerId) return;
  const d = drag; drag = null; clearTemp();
  if (e.type === 'pointercancel') { if (d.kind === 'node' && d.moved) commit(); return; }
  if (d.kind === 'lasso') { if (d.moved && d.pts.length > 2) { setMulti(Object.values(B.nodes).filter(n => inPoly(n.x, n.y, d.pts)).map(n => n.id)); if (sel) select(null); } else if (multi.size) setMulti([]); return; }
  if (d.kind === 'node') { if (d.moved) { sel = { kind: 'node', id: d.nid }; commit(); } else select({ kind: 'node', id: d.nid }); }
  else if (d.kind === 'link') {
    if (d.moved) { const hit = nodeAt(toWorld(e.clientX, e.clientY), d.from); if (hit) createLink(d.from, hit); }
    else if (d.tap) { if (pendingSrc && pendingSrc !== d.from) createLink(pendingSrc, d.from); else { pendingSrc = pendingSrc === d.from ? null : d.from; renderNodes(); if (pendingSrc) toast('Now tap the unit to tie ' + nm(d.from) + ' to'); } }
    else select({ kind: 'node', id: d.from });
  }
  else if (d.kind === 'edge') { if (!d.moved) { const now = Date.now(), dbl = lastTap.id === d.lid && now - lastTap.t < 420; lastTap = { id: d.lid, t: now }; select({ kind: 'link', id: d.lid }); if (dbl) startEdit(d.lid); } }
  else if (!d.moved) { if (pendingSrc) { pendingSrc = null; } multi.clear(); if (sel) select(null); else renderNodes(); }
}
stage.addEventListener('pointerup', endPtr); stage.addEventListener('pointercancel', endPtr);
stage.addEventListener('wheel', e => { if (e.target.closest('.overlay')) return; e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0016))); }, { passive: false });
nodesEl.addEventListener('input', e => { if (e.target.tagName === 'TEXTAREA') { const el = e.target.closest('.note'), n = el && B.nodes[el.dataset.id]; if (n) { n.text = e.target.value; autosize(e.target); saveLocalSoon(); } } });
nodesEl.addEventListener('change', e => { if (e.target.tagName === 'TEXTAREA') { touch(); pushHist(); saveLocal(); flushSoon(); updateButtons(); } });
$('zin').onclick = () => { const r = stage.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.25); };
$('zout').onclick = () => { const r = stage.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, .8); };
$('zfit').onclick = () => fit();

/* ───────── roster events ───────── */
let rdrag = null, swallow = false;
$('rlist').addEventListener('pointerdown', e => { const t = e.target.closest('.tile'); if (!t || e.pointerType === 'touch' || e.button !== 0) return; rdrag = { k: t.dataset.id, sx: e.clientX, sy: e.clientY, on: false }; });
window.addEventListener('pointermove', e => {
  if (!rdrag) return; const g = $('ghost');
  if (!rdrag.on) { if (Math.hypot(e.clientX - rdrag.sx, e.clientY - rdrag.sy) < 7) return; rdrag.on = true; const en = ENT[rdrag.k]; g.innerHTML = picHTML({ t: en.t, img: en.img, ini: initials(en.n) }); g.hidden = false; }
  g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px';
});
window.addEventListener('pointerup', e => {
  if (!rdrag) return; const d = rdrag; rdrag = null; $('ghost').hidden = true; if (!d.on) return;
  swallow = true; setTimeout(() => { swallow = false; }, 0);
  const r = stage.getBoundingClientRect();
  if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) { if (B.nodes[d.k]) { toast(ENT[d.k].n + ' is already on this board'); select({ kind: 'node', id: d.k }); } else addEntries([d.k], toWorld(e.clientX, e.clientY)); }
});
$('rlist').addEventListener('click', e => {
  if (swallow) return;
  const g = e.target.closest('[data-addgroup]'); if (g) { const grp = $('rlist')._groups[+g.dataset.addgroup]; if (!addEntries(grp.list.map(x => x.id))) toast('All of these are already on the board'); return; }
  const t = e.target.closest('.tile'); if (!t) return; const k = t.dataset.id;
  if (B.nodes[k]) { select({ kind: 'node', id: k }); centreOn(k); } else addEntries([k]);
  if (window.matchMedia('(max-width: 860px)').matches && !e.shiftKey) toast(ENT[k].n + ' pinned');
});
$('q').addEventListener('input', e => { rf.q = e.target.value.trim().toLowerCase(); renderRoster(); });
$('fchips').addEventListener('click', e => { const c = e.target.closest('[data-f]'); if (!c) return; const f = c.dataset.f; if (rf.fac.has(f)) rf.fac.delete(f); else rf.fac.add(f); renderRoster(); });
$('whereSel').addEventListener('change', e => { rf.where = e.target.value; renderRoster(); });
$('groupSel').addEventListener('change', e => { S.ui.group = e.target.value; saveLocalSoon(); renderRoster(); });
$('addShown').addEventListener('click', () => { addEntries(shown.slice()); });

/* ───────── inspector + popover events ───────── */
function panelClick(e) {
  const b = e.target.closest('button, li'); if (!b) return;
  if (b.dataset.ltype) return setLink({ type: b.dataset.ltype });
  if (b.dataset.ldir) return setLink({ dir: b.dataset.ldir });
  if (b.dataset.lstr) return setLink({ s: +b.dataset.lstr });
  if (b.dataset.link) { select({ kind: 'link', id: b.dataset.link }); return; }
  if (b.dataset.node) { select({ kind: 'node', id: b.dataset.node }); centreOn(b.dataset.node); return; }
  if (b.dataset.notecol) { B.nodes[sel.id].color = b.dataset.notecol; return commit(); }
  act(b.dataset.act);
}
$('inspector').addEventListener('click', panelClick);
$('linkpop').addEventListener('click', panelClick);
$('linkpop').addEventListener('pointerdown', e => { if (editing) e.preventDefault(); });
$('banner').addEventListener('click', e => { const b = e.target.closest('button'); if (b) act(b.dataset.act); });
$('inspector').addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'insLabel' && sel && B.links[sel.id]) { B.links[sel.id].label = t.value; drawEdges(); }
  else if (t.id === 'insNote' && sel && B.nodes[sel.id]) B.nodes[sel.id].note = t.value;
});
$('inspector').addEventListener('change', e => {
  const t = e.target, n = sel && sel.kind === 'node' && B.nodes[sel.id];
  if (t.id === 'insLabel' && sel && B.links[sel.id]) { B.links[sel.id].label = t.value.trim(); return commit({ light: true }); }
  if (t.id === 'insNote') return commit({ light: true });
  if (t.id === 'insSecret') return setLink({ secret: t.checked });
  if (!n) return;
  if (t.id === 'cName') n.name = t.value.trim() || 'Unnamed'; else if (t.id === 'cSub') n.sub = t.value.trim(); else if (t.id === 'cShape') n.shape = t.value; else if (t.id === 'cFaction') n.faction = t.value; else if (t.id === 'cRace') { if (t.value) n.race = t.value; else delete n.race; } else return;
  commit();
});

/* ───────── menus, modal, bar ───────── */
function closeMenus() { document.querySelectorAll('.menu').forEach(m => { m.hidden = true; }); }
[['btnBoardMenu', 'boardMenu'], ['btnArrange', 'arrangeMenu'], ['btnFile', 'fileMenu']].forEach(p => {
  $(p[0]).addEventListener('click', e => { e.stopPropagation(); const m = $(p[1]), was = m.hidden; closeMenus(); m.hidden = !was; });
  $(p[1]).addEventListener('click', e => { const b = e.target.closest('button'); if (b) { closeMenus(); act(b.dataset.act); } });
});
document.addEventListener('click', e => { if (!e.target.closest('.menuwrap')) closeMenus(); });
function modal(html, mount) { const m = $('modal'); m.innerHTML = '<div class="dlg" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false; if (mount) mount(m.firstElementChild); const f = m.querySelector('[autofocus]'); if (f) f.focus(); }
function closeModal() { $('modal').hidden = true; $('modal').innerHTML = ''; }
$('modal').addEventListener('pointerdown', e => { if (e.target === $('modal')) closeModal(); });
let dlCap; /* undefined = not asked yet, null = unavailable */
async function saveFile(name, text, btn) {
  if (window.claude && typeof window.claude.use === 'function') {
    if (dlCap === undefined) { try { dlCap = await window.claude.use('downloads'); } catch (e) { dlCap = null; } }
    if (!dlCap) return toast('This view cannot save files. Use Copy instead.');
    try { await dlCap.save({ filename: name, data: text }); toast('Saved ' + name); } catch (e) { toast(e && e.code === 'declined' ? 'Save cancelled' : 'Could not save the file. Use Copy instead.'); }
    return;
  }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Saved ' + name); } catch (e) { toast('Could not save the file. Use Copy instead.'); }
}
function copyText(ta) { const done = () => toast('Copied'); const fb = () => { ta.focus(); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Select the text and copy it'); } }; try { navigator.clipboard.writeText(ta.value).then(done, fb); } catch (e) { fb(); } }
const stamp = () => new Date().toISOString().slice(0, 10);
function backupJSON() { return JSON.stringify({ app: 'ew-relationship-web', v: 1, exported: new Date().toISOString(), order: S.order, boards: S.boards }, null, 1); }
/* the export shaped for data.js: race keys exactly as in AVAILABLE_RACES */
function gameExport(all) {
  const boards = all ? S.order.map(id => S.boards[id]).filter(b => !b.sample) : [B];
  /* a reference: race key and gender kept apart; story characters by their own id in the game data */
  const ref = (b, id) => { const n = b.nodes[id];
    if (n.kind === 'race') { const r = RACE[n.race], g = r.v.length > 1 ? n.g : r.v[0].g; return { key: r.v.length > 1 ? n.race + ':' + g : n.race, kind: 'race', race: n.race, gender: g }; }
    if (n.kind === 'cast') { const c = CAST[n.cast]; return { key: 'character:' + c.id, kind: 'character', id: c.id, race: c.race || null, gender: c.g || null }; }
    return { key: 'custom:' + n.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), kind: 'custom', race: null, gender: null }; };
  const out = { _about: 'Entropy Wars relationship web. `race` values match AVAILABLE_RACES and `gender` is separate (male / female). Story characters are listed in `characters` under their own id from the game data (DOOR_CAST, BOSS_DEFS, the tutorial tape) and referenced as character:<id>. Custom characters are custom:<name>, listed in `custom`. `from` is the one who acts, `to` the one acted on.', version: 2, exported: new Date().toISOString(), boards: boards.map(b => b.name),
    types: Object.fromEntries(TYPES.map(t => [t.id, { effect: t.fx || 'none', means: t.fx ? FX_NOTE[t.fx] : 'no effect on who joins a fight' }])), relations: [], defence: {}, groups: {}, boardGroups: {}, motives: {}, characters: {}, custom: {} };
  const D2 = out.defence, adj = {};
  const side = (o, p, r) => { o[p] = r.kind === 'race' ? r.race : r.key; o[p + 'Kind'] = r.kind; o[p + 'Gender'] = r.gender; return o; };
  boards.forEach(b => {
    Object.values(b.nodes).forEach(n => { if (n.kind === 'note') return; const r = ref(b, n.id);
      if (n.kind === 'custom') out.custom[r.key] = { name: n.name, title: n.sub || '', kind: n.shape, type: n.faction || null, portraitRace: n.race || null };
      if (n.kind === 'cast') { const c = CAST[n.cast]; out.characters[c.id] = { name: c.raw, title: c.title || '', source: c.grp === 'cast' ? 'DOOR_CAST' : c.grp === 'boss' ? 'BOSS_DEFS' : 'TUTORIAL_LESSONS', race: c.race || null, gender: c.g || null }; }
      if (n.note) (out.motives[r.key] = out.motives[r.key] || []).push(n.note); });
    Object.values(b.links).forEach(l => {
      const at = actorTarget(l), f = ref(b, at[0]), t = ref(b, at[1]);
      if (l.type === 'member') { const g = out.boardGroups[t.key] = out.boardGroups[t.key] || { name: b.nodes[l.b].name, members: [] }; if (!g.members.includes(f.key)) g.members.push(f.key); return; }
      out.relations.push(Object.assign(side(side({}, 'from', f), 'to', t), { type: l.type, mutual: l.dir === 'both', why: l.label || '', strength: l.s || 2, secret: !!l.secret, board: b.name }));
      if (l.dir === 'both' && (l.type === 'allied' || l.type === 'family') && f.kind === 'race' && t.kind === 'race' && f.race !== t.race) { (adj[f.race] = adj[f.race] || new Set()).add(t.race); (adj[t.race] = adj[t.race] || new Set()).add(f.race); }
    });
    Object.values(b.nodes).forEach(n => {
      if (n.kind === 'note') return; const d = defence(b, n.id), r = ref(b, n.id), row = it => Object.assign(side({}, 'by', ref(b, it.id)), { type: it.l.type, why: it.l.label || '', strength: it.l.s || 2, secret: !!it.l.secret });
      if (d.defenders.length + d.maybe.length + d.against.length + d.avoid.length === 0) return;
      const s = D2[r.key] = D2[r.key] || { kind: r.kind, race: r.race, gender: r.gender, defendedBy: [], mightBeDefendedBy: [], attackedBy: [], avoidedBy: [] };
      d.defenders.forEach(it => s.defendedBy.push(row(it))); d.maybe.forEach(it => s.mightBeDefendedBy.push(row(it))); d.against.forEach(it => s.attackedBy.push(row(it))); d.avoid.forEach(it => s.avoidedBy.push(row(it)));
    });
  });
  /* allied / family components between races, in the shape of HQ_NPC_TEMPERS.groups (race keys, as there) */
  const seen = new Set();
  Object.keys(adj).sort().forEach(k => { if (seen.has(k)) return; const comp = [], st = [k]; while (st.length) { const c = st.pop(); if (seen.has(c)) continue; seen.add(c); comp.push(c); adj[c].forEach(x => st.push(x)); } if (comp.length > 1) out.groups['web_' + comp.sort()[0].replace(/[^a-z0-9]+/g, '_')] = comp; });
  return out;
}
function act(a) {
  switch (a) {
    case 'closeIns': $('inspector').classList.remove('open'); break;
    case 'delSel': removeSel(); break;
    case 'swapLink': { const l = sel && B.links[sel.id]; if (l) { const x = l.a; l.a = l.b; l.b = x; commit(); } break; }
    case 'editLabel': if (sel) startEdit(sel.id); break;
    case 'tieFrom': linkMode = true; groupMode = false; pendingSrc = sel.id; $('inspector').classList.remove('open'); renderNodes(); renderOverlays(); toast('Now tap the unit to tie ' + nm(sel.id) + ' to'); break;
    case 'goMain': switchBoard(S.boards.main ? 'main' : (S.order.find(id => !S.boards[id].sample) || S.order[0])); if (B.sample) newBoard('Main board'); break;
    case 'newBoard': newBoard('Board ' + (S.order.length + 1)); act('renameBoard'); break;
    case 'dupBoard': newBoard(B.name + ' copy', B); break;
    case 'renameBoard': modal('<h2>Name this board</h2><input class="inp" id="mName" maxlength="80" autofocus value="' + esc(B.name) + '"><div class="acts"><button class="btn" data-x="cancel">Cancel</button><button class="btn pri" data-x="ok">Save name</button></div>', d => { const ok = () => { const v = $('mName').value.trim(); if (v && v !== B.name) { B.name = v; delete B.sample; commit(); } closeModal(); }; d.addEventListener('click', e => { const x = e.target.dataset.x; if (x === 'ok') ok(); else if (x === 'cancel') closeModal(); }); $('mName').addEventListener('keydown', e => { if (e.key === 'Enter') ok(); }); $('mName').select(); }); break;
    case 'delBoard': { const n = Object.keys(B.nodes).length; modal('<h2>Delete “' + esc(B.name) + '”?</h2><p>' + (n ? 'Its ' + n + ' pinned items and ' + Object.keys(B.links).length + ' ties go with it. ' : '') + 'Undo brings it back until you close the page.</p><div class="acts"><button class="btn" data-x="cancel" autofocus>Keep it</button><button class="btn pri" data-x="ok">Delete board</button></div>', d => d.addEventListener('click', e => { const x = e.target.dataset.x; if (x === 'ok') { closeModal(); deleteBoard(B.id); } else if (x === 'cancel') closeModal(); })); break; }
    case 'arrFaction': arrange('faction'); break; case 'arrHome': arrange('home'); break; case 'arrTies': arrange('ties'); break;
    case 'backup': modal('<h2>Save a backup</h2><p>Every board, as one JSON file. Keep it anywhere; load it back from Export, Load a backup.</p><textarea class="inp code" id="mText" readonly></textarea><div class="acts"><button class="btn" data-x="cancel">Close</button><button class="btn" data-x="copy">Copy</button><button class="btn pri" data-x="save">Save file</button></div>', d => { $('mText').value = backupJSON(); d.addEventListener('click', e => { const x = e.target.dataset.x; if (x === 'cancel') closeModal(); else if (x === 'copy') copyText($('mText')); else if (x === 'save') saveFile('entropy-wars-relationship-web-' + stamp() + '.json', $('mText').value); }); }); break;
    case 'restore': modal('<h2>Load a backup</h2><p>Choose a backup file, or paste its contents below.</p><div class="prow"><button class="btn" data-x="pick">Choose a file…</button><span class="muted" id="mFile"></span></div><textarea class="inp code" id="mText" placeholder="{ &quot;app&quot;: &quot;ew-relationship-web&quot;, … }" style="min-height:140px"></textarea><p class="muted" id="mErr"></p><div class="acts"><button class="btn" data-x="cancel">Cancel</button><button class="btn" data-x="replace">Replace all my boards</button><button class="btn pri" data-x="merge">Add as extra boards</button></div>', d => { d.addEventListener('click', e => { const x = e.target.dataset.x; if (x === 'cancel') closeModal(); else if (x === 'pick') $('fileIn').click(); else if (x === 'merge' || x === 'replace') { const r = importJSON($('mText').value, x === 'replace'); if (r.err) $('mErr').textContent = r.err; else { closeModal(); toast(r.msg); } } }); }); break;
    case 'exportGame': modal('<h2>Export for the game</h2><p>Race keys are exactly those in AVAILABLE_RACES, with gender as its own field. Story characters sit in <code>characters</code> under their id from the game data. <code>relations</code> is every tie; <code>defence</code> is who steps in for whom and why; <code>groups</code> has the shape of HQ_NPC_TEMPERS.groups.</p><div class="prow"><div class="seg" id="mScope"><button class="on" data-s="one">This board</button><button data-s="all">All boards</button></div><div class="seg" id="mFmt"><button class="on" data-f="json">JSON</button><button data-f="js">data.js const</button></div><span class="muted" id="mSum"></span></div><textarea class="inp code" id="mText" readonly></textarea><div class="acts"><button class="btn" data-x="cancel">Close</button><button class="btn" data-x="copy">Copy</button><button class="btn pri" data-x="save">Save file</button></div>', d => { let all = false, js = false; const fill = () => { const o = gameExport(all), t = JSON.stringify(o, null, 2); $('mText').value = js ? '/* Relationship web, exported ' + stamp() + ' */\nconst EW_RACE_RELATIONS = ' + t + ';\n' : t; $('mSum').textContent = o.relations.length + ' ties, ' + Object.keys(o.defence).length + ' units with a defence entry'; }; fill(); d.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.s) { all = b.dataset.s === 'all'; [...$('mScope').children].forEach(c => c.classList.toggle('on', c === b)); fill(); } else if (b.dataset.f) { js = b.dataset.f === 'js'; [...$('mFmt').children].forEach(c => c.classList.toggle('on', c === b)); fill(); } else if (b.dataset.x === 'cancel') closeModal(); else if (b.dataset.x === 'copy') copyText($('mText')); else if (b.dataset.x === 'save') saveFile('ew-race-relations-' + stamp() + (js ? '.txt' : '.json'), $('mText').value); }); }); break;
  }
}
function importJSON(text, replace) {
  let x; try { x = JSON.parse(text); } catch (e) { return { err: 'That is not valid JSON. Paste the whole backup file.' }; }
  if (!x || typeof x.boards !== 'object' || !x.boards) return { err: 'No boards found in that file. It needs to be a backup saved from this tool.' };
  const inc = Object.values(x.boards).filter(b => b && typeof b === 'object').map(sanitizeBoard); if (!inc.length) return { err: 'That backup has no boards in it.' };
  const now = Date.now();
  if (replace) { Object.keys(S.boards).forEach(id => { S.deleted[id] = now; cloud.dels.add(id); }); S.boards = {}; S.order = []; }
  const order = (x.order || []).filter(id => inc.some(b => b.id === id)); inc.forEach(b => { if (!order.includes(b.id)) order.push(b.id); });
  order.forEach(id => { const b = inc.find(z => z.id === id); if (S.boards[b.id]) { if (JSON.stringify(S.boards[b.id].nodes) === JSON.stringify(b.nodes) && JSON.stringify(S.boards[b.id].links) === JSON.stringify(b.links)) return; b.id = uid('b'); b.name += ' (loaded)'; } b.t = now; delete S.deleted[b.id]; cloud.dels.delete(b.id); S.boards[b.id] = b; S.order.push(b.id); cloud.dirty.add(b.id); });
  if (!S.order.length) return { err: 'Nothing new in that backup.' };
  S.active = S.boards[S.active] ? S.active : S.order[0]; if (replace) S.active = S.order[0]; B = S.boards[S.active]; sel = null; ensureView(); cloud.idx = true; pushHist(); saveLocal(); flushSoon(0); renderAll();
  return { msg: 'Loaded ' + inc.length + (inc.length === 1 ? ' board' : ' boards') };
}
$('fileIn').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const t = $('mText'); if (t) { t.value = String(rd.result); $('mFile').textContent = f.name; } }; rd.readAsText(f); e.target.value = ''; });
$('boardSel').addEventListener('change', e => switchBoard(e.target.value));
$('btnGroup').addEventListener('click', () => { groupMode = !groupMode; if (groupMode) linkMode = false; pendingSrc = null; renderNodes(); renderOverlays(); });
$('btnLink').addEventListener('click', () => { linkMode = !linkMode; if (linkMode) groupMode = false; pendingSrc = null; renderNodes(); renderOverlays(); if (linkMode) toast('Tie mode: drag from one unit to another, or tap one then the other'); });
$('btnNote').addEventListener('click', addNote);
$('btnGroupNode').addEventListener('click', () => {
  modal('<h2>Add a group</h2><label class="field"><span>Name</span><input class="inp" id="mName" maxlength="40" autofocus placeholder="The Circus"></label><div class="gsw" id="mCol">' + GCOL.map((c, i) => '<button data-col="' + i + '"' + (i ? '' : ' class="on"') + ' style="--gc:' + c + '" aria-label="Colour ' + (i + 1) + '"></button>').join('') + '</div><div class="acts"><button class="btn" data-x="cancel">Cancel</button><button class="btn pri" data-x="ok">Pin to board</button></div>', d => {
    let col = Object.values(B.nodes).filter(isGrp).length % GCOL.length; [...$('mCol').children].forEach((c, i) => c.classList.toggle('on', i === col));
    const ok = () => { const name = $('mName').value.trim(); if (!name) { $('mName').focus(); return; } const id = uid('c'), p = freeSpot(viewCentre(), takenList()); B.nodes[id] = { id, kind: 'custom', name, sub: '', shape: 'group', col, faction: '', x: p.x, y: p.y, note: '' }; sel = { kind: 'node', id }; closeModal(); commit(); };
    d.addEventListener('click', e => { const c = e.target.closest('[data-col]'); if (c) { col = +c.dataset.col; [...$('mCol').children].forEach((x, i) => x.classList.toggle('on', i === col)); return; } const x = e.target.dataset.x; if (x === 'ok') ok(); else if (x === 'cancel') closeModal(); }); d.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') ok(); });
  });
});
$('btnCustom').addEventListener('click', () => {
  modal('<h2>Add a character</h2><p>For anyone who is not a roster race: a named boss, an agent, an organisation, a place.</p><div class="two"><label class="field"><span>Name</span><input class="inp" id="mName" maxlength="60" autofocus placeholder="Agent Forrest"></label><label class="field"><span>Role or title</span><input class="inp" id="mSub" maxlength="60" placeholder="Field agent"></label><label class="field"><span>Kind</span><select class="sel" id="mShape"><option value="character">Character</option><option value="boss">Boss</option><option value="org">Organisation</option><option value="place">Place</option></select></label><label class="field"><span>Type</span><select class="sel" id="mFac"><option value="">None</option>' + FACTIONS.map(f => '<option value="' + f[0] + '">' + f[1] + '</option>').join('') + '</select></label></div><label class="field"><span>Portrait borrowed from a race</span><select class="sel" id="mRace"><option value="">Initials only</option>' + D.races.slice().sort((a, b) => a.n.localeCompare(b.n)).map(x => '<option value="' + esc(x.k) + '">' + esc(x.n) + '</option>').join('') + '</select></label><div class="acts"><button class="btn" data-x="cancel">Cancel</button><button class="btn pri" data-x="ok">Pin to board</button></div>', d => {
    const ok = () => { const name = $('mName').value.trim(); if (!name) { $('mName').focus(); return; } const id = uid('c'), p = freeSpot(viewCentre(), takenList()); B.nodes[id] = { id, kind: 'custom', name, sub: $('mSub').value.trim(), shape: $('mShape').value, faction: $('mFac').value, x: p.x, y: p.y, note: '' }; if ($('mRace').value) B.nodes[id].race = $('mRace').value; sel = { kind: 'node', id }; closeModal(); commit(); };
    $('mRace').addEventListener('change', e => { const r = RACE[e.target.value]; if (r && !$('mFac').value) $('mFac').value = r.t[0] || ''; });
    d.addEventListener('click', e => { const x = e.target.dataset.x; if (x === 'ok') ok(); else if (x === 'cancel') closeModal(); }); d.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') ok(); });
  });
});
$('btnUndo').addEventListener('click', undo); $('btnRedo').addEventListener('click', redo);
$('btnRoster').addEventListener('click', () => { $('inspector').classList.remove('open'); $('roster').classList.toggle('open'); });
$('btnIns').addEventListener('click', () => { $('roster').classList.remove('open'); $('inspector').classList.toggle('open'); });
stage.addEventListener('pointerdown', () => { $('roster').classList.remove('open'); $('inspector').classList.remove('open'); }, true);
$('legend').addEventListener('toggle', () => { S.ui.legend = $('legend').open; saveLocalSoon(); });
document.addEventListener('keydown', e => {
  if (!$('modal').hidden) { if (e.key === 'Escape') closeModal(); return; }
  const typing = /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''));
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
  if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return; }
  if (typing || mod || e.altKey) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { if (sel) { e.preventDefault(); removeSel(); } }
  else if (e.key === 'Escape') { closeMenus(); if (multi.size) setMulti([]); else if (linkMode || pendingSrc) { linkMode = false; pendingSrc = null; renderNodes(); renderOverlays(); } else if (sel) select(null); }
  else if (e.key === 'l' || e.key === 'L') $('btnLink').click();
  else if (e.key === 'g' || e.key === 'G') $('btnGroup').click();
  else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); addNote(); }
  else if (e.key === 'f' || e.key === 'F') fit();
  else if (e.key === '/') { e.preventDefault(); $('roster').classList.add('open'); $('q').focus(); }
  else if (e.key === 'Enter' && sel && sel.kind === 'link') { e.preventDefault(); startEdit(sel.id); }
});
window.addEventListener('resize', () => { positionPop(); });
window.addEventListener('pagehide', saveLocal);
document.addEventListener('visibilitychange', () => { if (document.hidden) { saveLocal(); if (cloud.db && (cloud.dirty.size || cloud.idx)) { clearTimeout(cloud.timer); flush(); } } });

/* ───────── boot ───────── */
S = loadLocal(); B = S.boards[S.active];
initWhere();
$('legend').open = S.ui.legend === true && !window.matchMedia('(max-width: 860px)').matches;
ensureView(); fit(true); pushHist(); renderAll(); setSave();
requestAnimationFrame(() => { if (!drag) fit(); });
cloudInit();
window.__ewWeb = { get state() { return S; }, gameExport, defence, hooks, cloud };
})();
