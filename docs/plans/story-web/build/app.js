(function () {
'use strict';
const D = EW_DATA, RACE = {}, CAST = {}, ENT = {}, ENTS = [];
/* roster entries: one per race variant (id r:<race> or r:<race>:<gender>) and one per story character (id s:<id>) */
const raceId = (k, g) => { const r = RACE[k]; return r && r.v.length > 1 ? 'r:' + k + ':' + (r.v.some(v => v.g === g) ? g : r.dg) : 'r:' + k; };
D.races.forEach(r => { RACE[r.k] = r; const d = r.v.find(v => v.g === r.dg) || r.v[0]; r.img = d.img; r.v.forEach(v => { const e = { id: raceId(r.k, v.g), kind: 'race', r, v, n: v.n, t: r.t, img: v.img, ip: v.ip }; ENT[e.id] = e; ENTS.push(e); }); });
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
const GCOL = ['#c6352b', '#d06a12', '#c79a12', '#46962f', '#0e9393', '#3274c4', '#7d4fc4', '#a02d63', '#2d8a5f', '#d4589a', '#8a5a2b', '#5b6670'];
/* two kinds of group: a PLACE (where they are) and a FACTION (who they side with). The board is laid out by one kind at a time
   (B.org); that kind gets the shaded areas and drags its members, the other shows as dots under each unit. Each kind keeps its
   own layout (B.lay), so switching back finds the arrangement as it was left. */
const gkOf = n => n && n.gk === 'faction' ? 'faction' : 'place';
const orgK = () => B.org === 'faction' ? 'faction' : 'place';
const isOrgGrp = n => isGrp(n) && gkOf(n) === orgK();
/* THE OTHER KIND IS NOT ON THE BOARD (2026-11-21, mondo: "whenever I switch to factions, it makes a huge long row at the top of all the
   places ... I have to scroll over all the way"): the groups of the kind the board is not organised by are not drawn, fitted or picked
   on the board (units still wear them as dots; their panels still reach them). Views place what they show themselves. */
const offK = n => !VIEW && isGrp(n) && gkOf(n) !== orgK();
/* a unit's home group of one kind: the first of that kind it joined. Its shaded area holds only its home members; a member
   whose home is elsewhere keeps a dashed line to it instead, so areas never stretch over each other */
function homeMap(kind) { const h = {}; Object.values(B.links).forEach(l => { if (l.type !== 'member' || l.secret || h[l.a]) return; const g = B.nodes[l.b]; if (isGrp(g) && gkOf(g) === kind && !isGrp(B.nodes[l.a])) h[l.a] = l.b; }); return h; }
const isGrp = n => !!n && n.kind === 'custom' && n.shape === 'group';
/* PLACES INSIDE PLACES (2026-11-18): a group can sit inside another group of its kind (`parent`): Disaster City holds Hero Plaza,
   Hero Plaza holds the Superhero Tower. The parent's area takes in its children's, and dragging it moves them too. */
const parentOf = n => { const p = n && n.parent && B.nodes[n.parent]; return isGrp(p) && gkOf(p) === gkOf(n) && p.id !== n.id ? p : null; };
const kidsOf = id => Object.values(B.nodes).filter(n => isGrp(n) && n.parent === id && parentOf(n));
const pathOf = g => { const out = [], seen = new Set(); let q = g; while (q && !seen.has(q.id)) { seen.add(q.id); out.unshift(q.name); q = parentOf(q); } return out.join(' \u203a '); };
function descOf(id) { const out = [], seen = new Set([id]), q = [id]; while (q.length) kidsOf(q.shift()).forEach(k => { if (!seen.has(k.id)) { seen.add(k.id); out.push(k); q.push(k.id); } }); return out; }
/* ONE UNIT, AN ICON IN EVERY PLACE (2026-11-18): a unit in more groups of the board's kind than its home one gets a copy of its
   icon in each of the others (where it spawns, too). A copy is the same unit: its spot is kept on the member tie (cx, cy). */
function copyList() {
  const k = orgK(), HM = homeMap(k), out = [], seen = {};
  Object.values(B.links).forEach(l => { if (l.type !== 'member' || l.secret) return; const g = B.nodes[l.b], u = B.nodes[l.a]; if (!isGrp(g) || gkOf(g) !== k || !u || isGrp(u) || u.kind === 'note' || !HM[l.a] || HM[l.a] === l.b) return;
    const i = seen[l.b] = (seen[l.b] || 0) + 1, a = i * 2.39996, r = 70 * Math.sqrt(i + 1.2);
    out.push({ l, u, g, x: Number.isFinite(l.cx) ? l.cx : Math.round(g.x + Math.cos(a) * r), y: Number.isFinite(l.cy) ? l.cy : Math.round(g.y + Math.sin(a) * r) }); });
  return out;
}
const gcol = n => (n && /^#[0-9a-f]{6}$/i.test(n.hex || '') ? n.hex : GCOL[(n && n.col) || 0] || GCOL[0]);
/* the units in a group node, or the groups a unit is in */
const membersOf = (id, board) => Object.values((board || B).links).filter(l => l.type === 'member' && l.b === id).map(l => l.a);
const groupsOf = (id, board) => Object.values((board || B).links).filter(l => l.type === 'member' && l.a === id).map(l => l.b);
const FX_NOTE = { defend: 'the actor steps in when the target is attacked', defendRev: 'the target steps in when the actor is attacked', maybe: 'the actor might step in for the target', maybeRev: 'the target might step in for the actor', attack: 'the actor joins in against the target', avoid: 'the actor stays out of it' };
const TEMPER_TEXT = { flee: 'runs', talk: 'talks', fight: 'fights' };
const STARTS_TEXT = { mug: 'walks up and mugs (pay or fight)', ground: 'gives one warning on its own ground, then fights', sight: 'attacks on sight', defend: 'starts a fight when it sees someone it defends get struck' };

/* ───────── state ───────── */
let S = null, B = null, sel = null, linkMode = false, groupMode = false, multi = new Set(), pendingSrc = null, editing = null;
let hist = [], hi = -1, G = {}, elById = new Map(), fresh = false, CP = [];
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
  if (b.view && Number.isFinite(+b.view.k)) o.view = { x: num(b.view.x, 0), y: num(b.view.y, 0), k: clamp(num(b.view.k, 1), .02, 2.5) };
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
      else { m.kind = 'custom'; m.name = String(n.name || n.race || 'Unnamed').slice(0, 60); m.sub = String(n.sub || '').slice(0, 60); m.faction = FNAME[n.faction] ? n.faction : ''; m.shape = /^(character|org|boss|place|group)$/.test(n.shape) ? n.shape : 'character'; if (m.shape === 'group') { m.col = clamp(Math.round(num(n.col, 0)), 0, GCOL.length - 1); m.gk = n.gk === 'faction' ? 'faction' : 'place'; if (n.parent) m.parent = String(n.parent); if (/^#[0-9a-f]{6}$/i.test(n.hex || '')) m.hex = n.hex; if (n.src) m.src = String(n.src).slice(0, 80); } if (RACE[n.race] && n.kind !== 'race') m.race = n.race; }
      if ((m.kind === 'race' || m.kind === 'cast') && n.nick && String(n.nick).trim()) m.nick = String(n.nick).trim().slice(0, 60);
    }
    o.nodes[m.id] = m;
  });
  Object.values(o.nodes).forEach(m => { if (m.parent) { m.parent = remap[m.parent] || m.parent; if (!o.nodes[m.parent] || m.parent === m.id) delete m.parent; } });
  o.org = b.org === 'faction' ? 'faction' : 'place';
  if (Number.isFinite(+b.mapK) && +b.mapK > 0 && b.mapK !== null) o.mapK = +b.mapK; if (b.mapHide) o.mapHide = true; if (b.pfix) o.pfix = num(b.pfix, 0);
  if (b.lay && typeof b.lay === 'object') { o.lay = {}; ['place', 'faction'].forEach(k => { const L = b.lay[k]; if (!L || typeof L !== 'object') return; o.lay[k] = {}; Object.keys(L).forEach(id => { const q = L[id], nid = remap[id] || id; if (Array.isArray(q) && o.nodes[nid]) o.lay[k][nid] = [num(q[0], 0), num(q[1], 0)]; }); }); }
  Object.values(b.links || {}).forEach(l => {
    if (l && (remap[l.a] || remap[l.b])) l = Object.assign({}, l, { a: remap[l.a] || l.a, b: remap[l.b] || l.b });
    if (!l || !l.id || !o.nodes[l.a] || !o.nodes[l.b] || l.a === l.b || o.nodes[l.a].kind === 'note' || o.nodes[l.b].kind === 'note') return;
    o.links[l.id] = { id: String(l.id), a: l.a, b: l.b, type: TYPE[l.type] ? l.type : 'other', dir: /^(ab|ba|both)$/.test(l.dir) ? l.dir : 'ab', label: String(l.label || '').slice(0, 300), s: clamp(Math.round(num(l.s, 2)), 1, 3), ...(l.secret ? { secret: true } : {}), ...(l.type === 'member' && Number.isFinite(+l.cx) && Number.isFinite(+l.cy) && l.cx !== null && l.cy !== null ? { cx: Math.round(+l.cx), cy: Math.round(+l.cy) } : {}) };
  });
  if (b.gweb && typeof b.gweb === 'object') { o.gweb = {}; ['place', 'faction'].forEach(k => { const L = b.gweb[k]; if (!L || typeof L !== 'object') return; o.gweb[k] = {}; Object.keys(L).forEach(id => { const q = L[id], nid = remap[id] || id; if (Array.isArray(q) && o.nodes[nid]) o.gweb[k][nid] = [num(q[0], 0), num(q[1], 0)]; }); }); }
  if (b.events && typeof b.events === 'object') { o.events = {}; Object.values(b.events).forEach(ev => { if (!ev || !ev.id) return; const id = String(ev.id).replace(/[^A-Za-z0-9_\-]/g, '_');
    o.events[id] = { id, title: String(ev.title || '').slice(0, 120), when: String(ev.when || '').slice(0, 60), t: num(ev.t, 0), text: String(ev.text || '').slice(0, 4000), refs: [...new Set((Array.isArray(ev.refs) ? ev.refs : []).map(r => remap[r] || String(r)).filter(r => o.nodes[r] && o.nodes[r].kind !== 'note'))], col: clamp(Math.round(num(ev.col, 0)), 0, GCOL.length - 1) }; }); }
  try { repairPlaces(o); } catch (e) {}
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
  o.story = x.story ? sanitizePlan(x.story) : null;   // THE STORY PLANNER's plan (one for every board)
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
const cloud = { db: null, state: 'off', dirty: new Set(), dels: new Set(), idx: false, story: false, busy: false, timer: 0 };
function setSave() {
  const el = $('saveState'); let cls = 'local', txt = 'Saved on this device', tip = 'Boards are kept in this browser. Use Export, then Save a backup, to keep a copy elsewhere.';
  const pend = cloud.dirty.size || cloud.dels.size || cloud.idx || cloud.story;
  if (cloud.state === 'loading') { cls = 'busy'; txt = 'Loading saved boards'; tip = ''; }
  else if (cloud.state === 'ok') { if (cloud.busy || pend) { cls = 'busy'; txt = 'Saving'; } else { cls = ''; txt = 'Saved'; } tip = cloud.db && cloud.db.server ? 'Saved on the game server: every computer that opens it from the game sees it.' : 'Saved with this page, and in this browser.'; }
  else if (cloud.state === 'ro') { txt = 'View only: changes stay on this device'; tip = 'You can change this board here, but only the owner can save it to the page.'; }
  else if (cloud.state === 'err') { cls = 'err'; txt = 'Not saved online: kept on this device'; tip = 'Saving to the page failed. Your work is in this browser. Save a backup from Export to be safe.'; }
  if (!localOk && cloud.state !== 'ok') { cls = 'err'; txt = 'Could not save: export a backup'; }
  el.className = cls; el.lastElementChild.textContent = txt; el.title = tip;
}
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), ms))]);
/* THE GAME'S SERVER (2026-11-18): opened from the game (Settings > Developer > Relationship Web, /dev/relationship-web), the
   boards save on the game server (server.js /api/story-web), so every computer that opens it there sees the same boards. */
/* THE PASSWORD (2026-11-18): the server asks for one; the first open picks it, each computer types it once (kept here) */
const webKey = { get: () => { try { return localStorage.getItem('ewWebKey') || ''; } catch (e) { return ''; } },
  set: k => { try { if (k) localStorage.setItem('ewWebKey', k); else localStorage.removeItem('ewWebKey'); } catch (e) {} } };
async function askWebKey(setup) {
  const k = window.prompt(setup
    ? 'Pick a password for your Relationship Web (6+ characters). Each computer asks for it once.'
    : 'Relationship Web password:');
  if (!k) return false;
  if (setup) {
    const r = await fetch('/api/story-web/key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: k }) });
    if (!r.ok && r.status !== 409) { let m = ''; try { m = (await r.json()).error || ''; } catch (e) {} window.alert(m || 'Could not set the password.'); return false; }
  }
  webKey.set(k); return true;
}
function serverDb() {
  const post = (p, data) => fetch('/api/story-web/doc', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-web-key': webKey.get() }, body: JSON.stringify({ path: p, data }) })
    .then(r => { if (!r.ok) { if (r.status === 401) webKey.set(''); const e = new Error('save ' + r.status); if (r.status === 400) e.code = 'invalid_argument'; throw e; } });
  return { server: true, doc: p => ({ set: d => post(p, d), delete: () => post(p, null) }) };
}
async function serverPull(asked) {
  const r = await withTimeout(fetch('/api/story-web', { cache: 'no-store', headers: { 'x-web-key': webKey.get() } }), 12000);
  if (r.status === 401 && !asked) {
    let setup = false; try { setup = !!(await r.json()).setup; } catch (e) {}
    webKey.set('');
    if (await askWebKey(setup)) return serverPull(true);
  }
  if (!r.ok) throw new Error('load ' + r.status);
  const d = (await r.json()).docs || {};
  return [d['web/index'] || null, Object.keys(d).filter(k => k.startsWith('boards/')).map(k => d[k]), d['story/plan'] || null];
}
async function serverInit() {
  if (!/^https?:$/.test(location.protocol) || !/\/dev\/relationship-web/.test(location.pathname)) return false;
  cloud.db = serverDb(); cloud.state = 'loading'; setSave();
  try { const r = await serverPull(); mergeRemote(r[0], r[1]); mergeStory(r[2]); cloud.state = 'ok'; } catch (e) { cloud.state = 'err'; }
  setSave(); if (cloud.state === 'ok') flushSoon(50);
  /* the other computer's changes: look again every 10 s and when this tab comes back */
  const again = async () => {
    const ae = document.activeElement; if (document.hidden || editing || (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) || cloud.busy || drag || pinch || cloud.dirty.size || cloud.dels.size || cloud.idx || cloud.story || MV.drag) return;
    try { if (!webKey.get()) return; const r = await serverPull(true); if (cloud.busy || drag || pinch || cloud.dirty.size || cloud.story) return; mergeRemote(r[0], r[1]); mergeStory(r[2]); if (cloud.state === 'err') { cloud.state = 'ok'; setSave(); } } catch (e) {}
  };
  setInterval(again, 10000); window.addEventListener('focus', again); document.addEventListener('visibilitychange', again);
  return true;
}
async function cloudInit() {
  if (await serverInit()) return;
  if (!(window.claude && typeof window.claude.use === 'function')) return;
  let db = null; try { db = await window.claude.use('db'); } catch (e) {}
  if (!db) return;
  cloud.db = db; cloud.state = 'loading'; setSave();
  try {
    const res = await withTimeout(Promise.all([db.doc('web/index').get(), db.collection('boards').limit(500).get(), db.doc('story/plan').get().catch(() => null)]), 12000);
    mergeRemote(res[0] && res[0].exists ? res[0].data() : null, (res[1].docs || []).map(d => d.data()).filter(Boolean));
    mergeStory(res[2] && res[2].exists ? res[2].data() : null);
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
    while (cloud.dirty.size || cloud.dels.size || cloud.idx || cloud.story) {
      if (cloud.story) { cur = null; cloud.story = false; if (S.story) { try { await cloud.db.doc('story/plan').set(JSON.parse(JSON.stringify(S.story))); } catch (e) { cloud.story = true; throw e; } } }
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
  if (n.kind === 'race') { const r = RACE[n.race], v = r.v.find(x => x.g === n.g) || r.v.find(x => x.g === r.dg) || r.v[0]; return { name: n.nick || v.n, sub: n.nick ? v.n : '', gname: v.n, t: r.t, img: v.img, ip: v.ip, ini: initials(n.nick || v.n), race: r, v }; }
  if (n.kind === 'cast') { const c = CAST[n.cast]; return { name: n.nick || c.n, sub: n.nick ? c.n : '', gname: c.n, t: c.t, img: c.img, ini: initials(n.nick || c.n), cast: c, badge: GRP_BADGE[c.grp] }; }
  const r = n.race && RACE[n.race];
  return { name: n.name, sub: n.sub, t: n.faction ? [n.faction] : [], img: r ? r.img : '', ini: initials(n.name), sq: n.shape === 'org' || n.shape === 'place', boss: n.shape === 'boss', custom: true };
}
const nm = id => { const n = B.nodes[id]; return n ? info(n).name : '?'; };
function picHTML(o) {
  const c1 = 'var(--f-' + (o.t[0] || 'none') + ')';
  return '<div class="pic' + (o.sq ? ' sq' : '') + '" style="--c1:' + c1 + (o.t[1] ? ';--c2:var(--f-' + o.t[1] + ')' : '') + (o.img ? ';--img:url(' + o.img + ')' + (o.ip ? ';--isz:240%;--ipos:50% 4%' : '') : '') + '">' + (o.img ? '' : esc(o.ini)) + '</div>';
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
  const v = B.view, r = stage.getBoundingClientRect(), k = clamp(v.k * f, .02, 2.5), px = cx - r.left, py = cy - r.top;
  v.x = px - (px - v.x) * (k / v.k); v.y = py - (py - v.y) * (k / v.k); v.k = k; applyView();
}
function bbox(ids) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  (ids || (VIEW ? Object.keys(VIEW.pos) : Object.keys(B.nodes))).forEach(id => { const n0 = B.nodes[id]; if (!n0 || offK(n0)) return; const n = vp(n0); if (n.kind === 'note') { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + 190); y1 = Math.max(y1, n.y + 130); } else { x0 = Math.min(x0, n.x - 60); y0 = Math.min(y0, n.y - 50); x1 = Math.max(x1, n.x + 60); y1 = Math.max(y1, n.y + 76); } });
  return x0 === Infinity ? null : { x0, y0, x1, y1 };
}
function fit(silent) {
  const r0 = stage.getBoundingClientRect(), v = B.view, r = { width: r0.width, height: r0.height - tlH() }; let b = bbox();
  /* the world map behind a places board is part of what fits on screen (11-22) */
  const mc = $('bgMap'), W = PL.world; if (b && mc && !mc.hidden && W && B.mapK > 0) b = { x0: Math.min(b.x0, 0), y0: Math.min(b.y0, 0), x1: Math.max(b.x1, W.w * B.mapK), y1: Math.max(b.y1, W.h * B.mapK) };
  if (!r.width) return;
  if (!b) { v.x = r.width / 2; v.y = r.height / 2; v.k = 1; }
  else { const pad = 40, k = clamp(Math.min((r.width - pad * 2) / (b.x1 - b.x0), (r.height - pad * 2 - 40) / (b.y1 - b.y0)), .02, 1.15); v.k = k; v.x = r.width / 2 - (b.x0 + b.x1) / 2 * k; v.y = r.height / 2 - (b.y0 + b.y1) / 2 * k; }
  if (!silent) applyView();
}
function centreOn(id) { const n0 = B.nodes[id]; if (!n0) return; const n = vp(n0); const r = stage.getBoundingClientRect(), v = B.view; v.x = r.width / 2 - n.x * v.k; v.y = r.height / 2 - n.y * v.k; applyView(); }

/* ───────── rendering: board ───────── */
function renderNodes() {
  let h = '';
  if (VIEW && VIEW.kind === 'gweb') gwebCalc(VIEW);
  const gw = VIEW && VIEW.kind === 'gweb', fg = sel && sel.kind === 'node' && (isGrp(B.nodes[sel.id]) || (gw && VIEW.pos[sel.id])) ? sel.id : null, ev0 = sel && sel.kind === 'event' && B.events && B.events[sel.id];
  const fm = ev0 ? evLight(ev0) : fg ? (gw ? gwebNear(fg) : new Set(membersOf(fg).concat(fg))) : null;
  const dots = {}; Object.values(B.links).forEach(l => { if (l.type !== 'member') return; const g = B.nodes[l.b]; if (isGrp(g) && (!isOrgGrp(g) || l.secret)) (dots[l.a] = dots[l.a] || []).push({ g, sec: !!l.secret }); });
  Object.values(B.nodes).forEach(n0 => {
    if ((VIEW && !VIEW.pos[n0.id]) || offK(n0)) return;
    const n = VIEW ? Object.assign({}, n0, vp(n0)) : n0;
    const s = (sel && sel.kind !== 'link' && sel.id === n.id ? ' sel' : '') + (multi.has(n.id) ? ' lasso' : '') + (fm && n.kind !== 'note' && !fm.has(n.id) ? ' dim' : '');
    if (n.kind === 'note') { h += '<div class="note c-' + (n.color || 'y') + s + '" data-id="' + esc(n.id) + '" style="left:' + n.x + 'px;top:' + n.y + 'px"><div class="grip"><span>Idea</span><span>drag</span></div><textarea spellcheck="false" placeholder="Story idea, hook, open question…" aria-label="Story idea">' + esc(n.text) + '</textarea></div>'; return; }
    if (isGrp(n)) { const k = membersOf(n.id).length; h += '<div class="node gnode' + (gkOf(n) === 'faction' ? ' fac' : '') + s + (pendingSrc === n.id ? ' src' : '') + '" data-id="' + esc(n.id) + '" style="left:' + n.x + 'px;top:' + n.y + 'px;--gc:' + gcol(n) + '"><div class="pic gp">' + esc(n.name) + '<small>' + k + '</small></div><div class="handle"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6h8M6.5 2.5 10 6l-3.500 3.500"/></svg></div></div>'; return; }
    const o = info(n);
    h += '<div class="node' + s + (pendingSrc === n.id ? ' src' : '') + '" data-id="' + esc(n.id) + '" style="left:' + n.x + 'px;top:' + n.y + 'px">' + picHTML(o) + (o.boss ? '<span class="boss">BOSS</span>' : '') + (o.badge ? '<span class="boss story">' + o.badge + '</span>' : '') +
      '<div class="nm">' + esc(o.name) + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + (dots[n.id] ? '<span class="gdots">' + dots[n.id].map(d => '<i' + (d.sec ? ' class="sec"' : '') + ' style="--gc:' + gcol(d.g) + '" title="' + (d.sec ? 'Secretly in ' : '') + esc(d.g.name) + '"></i>').join('') + '</span>' : '') + '</div>' +
      '<div class="handle" title="Drag to another unit to tie them together"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6h8M6.5 2.5 10 6l-3.500 3.500"/></svg></div></div>';
  });
  CP = VIEW ? [] : copyList();
  if (VIEW && VIEW.labels) VIEW.labels.forEach(q => { h += '<div class="vlabel' + (q.fac ? ' fac' : '') + (q.none ? ' none' : '') + '" style="left:' + q.x + 'px;top:' + q.y + 'px;--gc:' + q.col + '">' + esc(q.t) + '</div>'; });
  CP.forEach(c => { const o = info(c.u), sl = (sel && sel.kind === 'node' && sel.id === c.u.id ? ' sel' : '') + (fm && !fm.has(c.u.id) ? ' dim' : '');
    h += '<div class="node copy' + sl + '" data-cid="' + esc(c.l.id) + '" style="left:' + c.x + 'px;top:' + c.y + 'px;--gc:' + gcol(c.g) + '">' + picHTML(o) + '<div class="nm">' + esc(o.name) + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</div></div>'; });
  nodesEl.innerHTML = h; elById = new Map();
  nodesEl.querySelectorAll('[data-id]').forEach(el => { elById.set(el.dataset.id, el); });
  nodesEl.querySelectorAll('[data-cid]').forEach(el => { elById.set('cp:' + el.dataset.cid, el); });
  nodesEl.querySelectorAll('.note textarea').forEach(autosize);
}
function autosize(t) { t.style.height = 'auto'; t.style.height = Math.max(54, t.scrollHeight) + 'px'; }
function geom(l, i, n) {
  const A0 = B.nodes[l.a], B0 = B.nodes[l.b]; if (!A0 || !B0) return null; const A = vp(A0), Bn = vp(B0);
  let p = A, q = Bn; if (l.a > l.b) { p = Bn; q = A; }
  const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
  const off = (i - (n - 1) / 2) * 52, mx = (p.x + q.x) / 2 + nx * off, my = (p.y + q.y) / 2 + ny * off;
  const cx = 2 * mx - (p.x + q.x) / 2, cy = 2 * my - (p.y + q.y) / 2;
  const T = TYPE[l.type] || TYPE.other, arrows = !(T.sym && l.dir === 'both') && l.type !== 'member', aA = arrows && (l.dir === 'ba' || l.dir === 'both'), aB = arrows && (l.dir === 'ab' || l.dir === 'both');
  const sw = l.sw || (l.type === 'member' ? 1.6 : [0, 1.7, 2.7, 4.4][l.s || 2]), al = 9 + Math.min(sw, 5) * 1.6;
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
  const gw = VIEW && VIEW.kind === 'gweb';
  Object.values(B.links).concat(gw ? VIEW.bundles : []).forEach(l => { const k = l.a < l.b ? l.a + '|' + l.b : l.b + '|' + l.a; (groups[k] = groups[k] || []).push(l); });
  let svg = '', tags = '';
  const focus = sel && sel.kind === 'node' ? sel.id : null, ev0 = sel && sel.kind === 'event' && B.events && B.events[sel.id], evS = ev0 ? evLight(ev0) : null;
  const HM = homeMap(orgK());
  const CPS = VIEW ? [] : copyList(), own = g => [g].concat(membersOf(g.id).filter(id => HM[id] === g.id || (isGrp(B.nodes[id]) && !offK(B.nodes[id]))).map(id => B.nodes[id]).filter(Boolean), CPS.filter(c => c.g.id === g.id).map(c => ({ x: c.x, y: c.y })));
  const depth = g => { let d = 0, p = g; while ((p = parentOf(p)) && d < 20) d++; return d; };
  if (gw && !VIEW.fold) Object.keys(VIEW.pos).map(id => B.nodes[id]).filter(n => isGrp(n) && kidsOf(n.id).length).sort((a, b) => depth(a) - depth(b)).forEach(n => { const pts = [n].concat(descOf(n.id)).filter(g => VIEW.pos[g.id]).map(g => VIEW.pos[g.id]); if (pts.length < 2) return; const hp = hull(pts).map(q => q.x.toFixed(1) + ' ' + q.y.toFixed(1)); svg += '<path class="hull gw" d="M' + hp.join('L') + 'Z" fill="' + gcol(n) + '" stroke="' + gcol(n) + '"/>'; });
  else if (VIEW) (VIEW.hulls || []).forEach(q => { if (q.pts.length < 2) return; const hp = hull(q.pts).map(p => p.x.toFixed(1) + ' ' + p.y.toFixed(1)); svg += '<path class="hull' + (q.zone ? ' vz' : '') + '" d="M' + hp.join('L') + 'Z" fill="' + q.col + '" stroke="' + q.col + '"/>'; });
  else Object.values(B.nodes).filter(isOrgGrp).sort((a, b) => depth(a) - depth(b)).forEach(n => { const pts = own(n).concat(...descOf(n.id).filter(isOrgGrp).map(own)); if (pts.length < 2) return; const hp = hull(pts).map(q => q.x.toFixed(1) + ' ' + q.y.toFixed(1)); svg += '<path class="hull" d="M' + hp.join('L') + 'Z" fill="' + gcol(n) + '" stroke="' + gcol(n) + '"/>'; });
  if (focus) CPS.filter(c => c.u.id === focus || c.g.id === focus).forEach(c => { const u = c.u; svg += '<path class="cpline" d="M' + u.x + ' ' + u.y + 'L' + c.x + ' ' + c.y + '" stroke="' + gcol(c.g) + '"/>'; });
  Object.values(groups).forEach(arr => {
    arr.sort((a, b) => a.id < b.id ? -1 : 1).forEach((l, i) => {
      const away = false;
      if (VIEW && (!VIEW.pos[l.a] || !VIEW.pos[l.b] || (!l.bx && (VIEW.links === 'sel' ? focus !== l.a && focus !== l.b : !VIEW.links.has(l.id))))) return;
      if (l.type === 'member' && !VIEW && !away && focus !== l.a && focus !== l.b && !(sel && sel.kind === 'link' && sel.id === l.id)) return;
      if (offK(B.nodes[l.a]) || offK(B.nodes[l.b])) return;
      const g = geom(l, i, arr.length); if (!g) return; G[l.id] = g;
      const mem = l.type === 'member', c = mem ? gcol(B.nodes[l.b]) : 'var(--t-' + g.T.id + ')', isSel = sel && (sel.kind === 'link' || sel.kind === 'bundle') && sel.id === l.id, dim = (focus && l.a !== focus && l.b !== focus) || (evS && !(evS.has(l.a) && evS.has(l.b)));
      if (l.bx) { const nb = l.bx.ties.length; svg += '<g class="edge bundle' + (isSel ? ' sel' : '') + '" data-id="' + esc(l.id) + '"' + (dim ? ' opacity=".18"' : '') + '><path class="hit" d="' + g.path + '" stroke-width="' + (g.sw + 14) + '"/>' + (isSel ? '<path class="halo" d="' + g.path + '" stroke-width="' + (g.sw + 9) + '"/>' : '') + '<path class="ln" d="' + g.path + '" stroke="' + c + '" stroke-width="' + g.sw.toFixed(1) + '"' + (g.T.dash ? ' stroke-dasharray="' + g.T.dash + '"' : '') + '/>' + (g.heads ? '<path class="ah" d="' + g.heads + '" fill="' + c + '"/>' : '') + '</g>';
        if (nb > 1 || isSel || (focus && (l.a === focus || l.b === focus))) tags += '<div class="tag btag' + (isSel ? ' sel' : '') + (dim ? ' dim' : '') + '" data-id="' + esc(l.id) + '" style="left:' + g.m.x.toFixed(1) + 'px;top:' + g.m.y.toFixed(1) + 'px;--c:' + c + '"><b>' + g.T.n + '</b> \u00d7' + nb + '</div>'; return; }
      svg += '<g class="edge' + (isSel ? ' sel' : '') + (l.secret ? ' secret' : '') + '" data-id="' + esc(l.id) + '"' + (dim ? ' opacity=".22"' : '') + '><path class="hit" d="' + g.path + '"/>' +
        (isSel ? '<path class="halo" d="' + g.path + '" stroke-width="' + (g.sw + 9) + '"/>' : '') +
        '<path class="ln" d="' + g.path + '" stroke="' + c + '" stroke-width="' + g.sw + '"' + (l.type === 'member' && l.secret ? ' stroke-dasharray="2 6"' : away ? ' stroke-dasharray="7 6"' : g.T.dash ? ' stroke-dasharray="' + g.T.dash + '"' : '') + '/>' +
        (g.heads ? '<path class="ah" d="' + g.heads + '" fill="' + c + '"/>' : '') + '</g>';
      if (!mem) tags += '<div class="tag' + (gw ? ' gwt' : '') + (isSel ? ' sel' : '') + (dim ? ' dim' : '') + '" data-id="' + esc(l.id) + '" style="left:' + g.m.x.toFixed(1) + 'px;top:' + g.m.y.toFixed(1) + 'px;max-width:' + Math.round(g.tw) + 'px;--c:' + c + (editing === l.id ? ';visibility:hidden' : '') + '"><b>' + (l.secret ? 'secretly ' : '') + g.T.n + '</b>' + (l.label ? ' ' + esc(l.label) : '') + '</div>';
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
  $('btnGweb').classList.toggle('on', !!(VIEW && VIEW.kind === 'gweb')); stage.classList.toggle('gwebmode', !!(VIEW && VIEW.kind === 'gweb'));
  [...$('orgSeg').children].forEach(b => b.classList.toggle('on', b.dataset.org === orgK()));
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
  return '<button class="tile' + (B.nodes[e.id] ? ' onb' : '') + (e.kind === 'cast' ? ' story' : '') + '" data-id="' + esc(e.id) + '" title="' + esc(e.n + (e.kind === 'cast' ? (e.c.title ? ' · ' + e.c.title : '') : (e.r.home ? ' · ' + e.r.home : ''))) + '">' + picHTML({ t: e.t, img: e.img, ip: e.ip, ini: initials(e.n) }) + '<span>' + esc(label || e.n) + '</span></button>';
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
function relList(items, cls) { return items.map(it => '<li data-link="' + esc(it.l.id) + '"><i style="--c:' + (it.l.type === 'member' ? 'var(--ink3)' : 'var(--t-' + it.l.type + ')') + '"></i><span>' + sentence(it.l) + '</span></li>').join(''); }
function whyLine(it, verb) { const T = TYPE[it.l.type]; return '<li data-link="' + esc(it.l.id) + '"><i style="--c:var(--t-' + it.l.type + ')"></i><span><b>' + esc(nm(it.id)) + '</b> ' + verb + ' <em>(' + (it.l.secret ? 'secretly ' : '') + T.n + ')' + (it.l.label ? ' because: ' + esc(it.l.label) : '. No reason written yet.') + '</em></span></li>'; }
function typeChips(l) { const T2 = isGrp(B.nodes[l.a]) || isGrp(B.nodes[l.b]) ? [TYPE.member].concat(TYPES) : TYPES; return '<div class="tchips">' + T2.map(t => '<button class="tchip' + (l.type === t.id ? ' on' : '') + '" data-ltype="' + t.id + '" style="--c:' + (t.id === 'member' ? 'var(--ink3)' : 'var(--t-' + t.id + ')') + '" title="' + esc(t.one.replace('{a}', 'A').replace('{b}', 'B') + (t.fx ? '. In a fight: ' + FX_NOTE[t.fx] + '.' : '')) + '">' + t.n + '</button>').join('') + '</div>'; }
function dirSeg(l) { const a = esc(nm(l.a)), b = esc(nm(l.b)); return '<div class="seg" role="group" aria-label="Direction"><button class="' + (l.dir === 'ab' ? 'on' : '') + '" data-ldir="ab" title="' + a + ' to ' + b + '">&rarr;</button><button class="' + (l.dir === 'both' ? 'on' : '') + '" data-ldir="both" title="Both ways">&harr;</button><button class="' + (l.dir === 'ba' ? 'on' : '') + '" data-ldir="ba" title="' + b + ' to ' + a + '">&larr;</button></div>'; }
function strengthSeg(l) { return '<div class="seg" role="group" aria-label="Strength">' + [[1, 'weak'], [2, 'firm'], [3, 'unbreakable']].map(s => '<button class="' + ((l.s || 2) === s[0] ? 'on' : '') + '" data-lstr="' + s[0] + '">' + s[1] + '</button>').join('') + '</div>'; }
function renderInspector() {
  const el = $('inspector'); let h = '<div class="ins"><button class="btn sm closeins" data-act="closeIns" style="align-self:flex-end">Close</button>';
  const bun = sel && sel.kind === 'bundle' && VIEW && VIEW.bundles && VIEW.bundles.find(q => q.id === sel.id), evS = sel && sel.kind === 'event' && B.events && B.events[sel.id];
  if (bun) {
    const o = bun.bx, T = TYPE[bun.type] || TYPE.other, A = esc(nm(bun.a)), Z = esc(nm(bun.b)), arrow = bun.dir === 'both' ? ' \u2194 ' : bun.dir === 'ab' ? ' \u2192 ' : ' \u2190 ';
    h += '<h2>' + A + arrow + Z + '</h2><p style="margin:-6px 0 0"><span class="badge" style="--c:var(--t-' + T.id + ')">' + T.n + '</span> \u00d7' + o.ties.length + '</p>' +
      '<div class="prow">' + [bun.a, bun.b].map(id => { const g = B.nodes[id]; return isGrp(g) ? '<button class="gchip sm' + (gkOf(g) === 'faction' ? ' fac' : '') + '" data-node="' + esc(id) + '" style="--gc:' + gcol(g) + '">' + esc(g.name) + '</button>' : '<button class="btn sm" data-node="' + esc(id) + '">' + esc(nm(id)) + '</button>'; }).join('') + '</div>' +
      '<div><h4>The ties in it</h4><ul class="rel">' + relList(o.ties.filter(id => B.links[id]).map(id => ({ l: B.links[id] }))) + '</ul></div>';
  } else if (evS) {
    const ev = evS, rf = evRefs(ev), L = evList(), i = L.indexOf(ev);
    h += '<h2>Event</h2><label class="field"><span>Title</span><input class="inp" id="evTitle" maxlength="120" value="' + esc(ev.title) + '"></label>' +
      '<label class="field"><span>When</span><input class="inp" id="evWhen" maxlength="60" value="' + esc(ev.when) + '" placeholder="Year 1999, before the Fall, day 3\u2026"></label>' +
      '<div><h4>Colour</h4><div class="gsw">' + GCOL.map((c, k) => '<button data-evcol="' + k + '"' + ((ev.col || 0) === k ? ' class="on"' : '') + ' style="--gc:' + c + '" aria-label="Colour ' + (k + 1) + '"></button>').join('') + '</div></div>' +
      '<label class="field"><span>What happens</span><textarea class="inp" id="evText" style="min-height:90px">' + esc(ev.text) + '</textarea></label>' +
      '<div><h4>Linked to (' + rf.length + ')</h4>' + (rf.length ? '<div class="prow">' + rf.map(id => { const g = B.nodes[id]; return (isGrp(g) ? '<span class="gchip sm' + (gkOf(g) === 'faction' ? ' fac' : '') + ' evref" style="--gc:' + gcol(g) + '"><button data-node="' + esc(id) + '">' + esc(g.name) + '</button>' : '<span class="evref unit"><button data-node="' + esc(id) + '">' + esc(nm(id)) + '</button>') + '<button class="x" data-evunref="' + esc(id) + '" aria-label="Unlink">\u00d7</button></span>'; }).join('') + '</div>' : '<p class="muted">Nothing yet.</p>') + '</div>' +
      '<label class="field"><span>Link a faction, place, unit or character</span><input class="inp" id="pickEv" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" placeholder="Type a name: Illuminati, Hell, Pope\u2026"></label>' + (evPicks(ev.id), '') + '<div class="pickl" role="listbox" hidden></div>' +
      '<div class="prow"><button class="btn sm" data-act="evEarlier"' + (i <= 0 ? ' disabled' : '') + '>\u2190 Earlier</button><button class="btn sm" data-act="evLater"' + (i >= L.length - 1 ? ' disabled' : '') + '>Later \u2192</button><button class="btn sm" data-act="evShow"' + (rf.length ? '' : ' disabled') + '>Show on the board</button></div>' +
      '<div class="prow"><button class="btn" data-act="evNew">+ Event after this</button><button class="btn danger" data-act="delSel">Delete this event</button></div>';
  } else if (sel && sel.kind === 'link' && B.links[sel.id]) {
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
  } else if (sel && sel.kind === 'node' && isGrp(B.nodes[sel.id])) {
    const n = B.nodes[sel.id], mem = Object.values(B.links).filter(l => l.type === 'member' && l.b === n.id), ties = defence(B, n.id).all.filter(it => it.l.type !== 'member');
    h += '<div class="idh"><div class="gchip' + (gkOf(n) === 'faction' ? ' fac' : '') + '" style="--gc:' + gcol(n) + '">' + esc(n.name) + '</div></div>';
    h += '<label class="field"><span>Name</span><input class="inp" id="cName" maxlength="40" value="' + esc(n.name) + '"></label>';
    h += '<div><h4>Kind</h4><div class="seg">' + [['place', 'Place'], ['faction', 'Faction']].map(k => '<button data-gk="' + k[0] + '"' + (gkOf(n) === k[0] ? ' class="on"' : '') + '>' + k[1] + '</button>').join('') + '</div></div>';
    h += '<div><h4>Colour</h4><div class="gsw">' + GCOL.map((c, i) => '<button data-gcol="' + i + '"' + (!n.hex && (n.col || 0) === i ? ' class="on"' : '') + ' style="--gc:' + c + '" aria-label="Colour ' + (i + 1) + '"></button>').join('') + '</div></div>';
    { const bad = new Set([n.id].concat(descOf(n.id).map(k => k.id))), opts = Object.values(B.nodes).filter(g => isGrp(g) && gkOf(g) === gkOf(n) && !bad.has(g.id)).sort((a, b) => a.name.localeCompare(b.name)), par = parentOf(n), kids = kidsOf(n.id);
      h += '<label class="field"><span>Inside</span><select class="sel" id="gParent"><option value="">Nowhere</option>' + opts.map(g => '<option value="' + esc(g.id) + '"' + (par && par.id === g.id ? ' selected' : '') + '>' + esc(g.name) + '</option>').join('') + '</select></label>';
      if (kids.length) h += '<div><h4>Inside it (' + kids.length + ')</h4><div class="prow">' + kids.sort((a, b) => a.name.localeCompare(b.name)).map(g => '<button class="gchip sm' + (gkOf(g) === 'faction' ? ' fac' : '') + '" data-node="' + esc(g.id) + '" style="--gc:' + gcol(g) + '">' + esc(g.name) + '</button>').join('') + '</div></div>'; }
    h += '<div><h4>Members (' + mem.length + ')</h4>' + (mem.length ? '<ul class="rel gmem">' + mem.map(l => '<li data-node="' + esc(l.a) + '"' + (l.secret ? ' class="sec"' : '') + '><span>' + esc(nm(l.a)) + '</span><button class="gsec' + (l.secret ? ' on' : '') + '" data-gsecret="' + esc(l.id) + '">secret</button><button class="x" data-unlink="' + esc(l.id) + '" aria-label="Take out of the group">×</button></li>').join('') + '</ul>' : '<p class="muted">None yet.</p>') + '</div>';
    h += '<label class="field"><span>Add a unit</span><input class="inp" id="pickUnit" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" placeholder="Type a name: Librarian, Pope\u2026"></label>' + (unitPicks(n.id), '') + '<div class="pickl" role="listbox" hidden></div>';
    if (ties.length) h += '<div><h4>Ties</h4><ul class="rel">' + relList(ties) + '</ul></div>';
    { const es = eventsOf(n.id); h += '<div><h4>Timeline' + (es.length ? ' (' + es.length + ')' : '') + '</h4>' + (es.length ? '<ul class="rel">' + es.map(ev => '<li data-ev="' + esc(ev.id) + '"><i style="--c:' + GCOL[ev.col || 0] + '"></i><span>' + (ev.when ? '<b>' + esc(ev.when) + '</b> ' : '') + esc(ev.title || 'Untitled') + '</span></li>').join('') + '</ul>' : '') + '<button class="btn sm" data-act="evNew">+ Event with ' + esc(isGrp(n) ? n.name : info(n).name) + '</button></div>'; }
    h += '<label class="field"><h4 style="margin:0">Notes</h4><textarea class="inp" id="insNote">' + esc(n.note || '') + '</textarea></label>';
    h += '<div class="prow"><button class="btn danger" data-act="delSel">Take off the board</button></div>';
  } else if (sel && sel.kind === 'node' && B.nodes[sel.id]) {
    const n = B.nodes[sel.id], o = info(n), r = o.race, cst = o.cast, d = defence(B, n.id), name = esc(o.name);
    h += '<div class="idh">' + picHTML(o) + '<div class="meta"><h2>' + name + '</h2>' + (r ? '<span class="key">race key: ' + esc(r.k) + (r.v.length > 1 ? ' \u00b7 gender: ' + o.v.g : '') + '</span>' : cst ? '<span class="key">' + (cst.grp === 'cast' ? 'DOOR_CAST.' : cst.grp === 'boss' ? 'BOSS_DEFS: ' : 'tutorial tape: ') + esc(cst.grp === 'tape' ? cst.raw : cst.id) + '</span>' : '<span class="key">custom ' + esc(n.shape || 'character') + '</span>') + '<div class="badges">' + (o.t.length ? o.t.map(t => '<span class="badge" style="--c:var(--f-' + t + ')">' + FNAME[t] + '</span>').join('') : '<span class="badge">no type</span>') + (r && r.role ? '<span class="badge">' + esc(r.role) + '</span>' : '') + (cst ? '<span class="badge">' + GRP_NAME[cst.grp] + '</span>' : '') + '</div>' + (r && r.cs ? '<span class="stamp">' + esc(r.cs) + '</span>' : '') + '</div></div>';
    if (r || cst) h += '<label class="field"><span>Name</span><input class="inp" id="cNick" maxlength="60" value="' + esc(n.nick || '') + '" placeholder="' + esc(o.gname) + '"></label>';
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
    const gin = Object.values(B.links).filter(l => l.type === 'member' && l.a === n.id && isGrp(B.nodes[l.b])).map(l => B.nodes[l.b]);
    const gsec = new Set(Object.values(B.links).filter(l => l.type === 'member' && l.a === n.id && l.secret).map(l => l.b));
    h += '<label class="field"><span>Add to a place or a faction</span><input class="inp" id="pickGrp" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" placeholder="Type a name: Hell, The Bowl, Illuminati\u2026"></label>' + (grpPicks(n.id), '') + '<div class="pickl" role="listbox" hidden></div>';
    if (gin.length) h += '<div><h4>Groups</h4><div class="prow">' + ['place', 'faction'].map(k => gin.filter(g => gkOf(g) === k).map(g => '<button class="gchip sm' + (k === 'faction' ? ' fac' : '') + (gsec.has(g.id) ? ' sec' : '') + '" data-node="' + esc(g.id) + '" style="--gc:' + gcol(g) + '">' + (gsec.has(g.id) ? '<i>secretly</i> ' : '') + esc(g.name) + '</button>').join('')).join('') + '</div></div>';
    h += '<label class="field"><h4 style="margin:0">Wants, fears, motive</h4><textarea class="inp" id="insNote" placeholder="What does ' + name + ' want on this board?">' + esc(n.note || '') + '</textarea></label>';
    h += '<div><h4>Ties on this board</h4>' + (d.all.some(it => it.l.type !== 'member') ? '<ul class="rel">' + relList(d.all.filter(it => it.l.type !== 'member')) + '</ul>' : '<p class="muted">None yet. Drag from the red handle on ' + name + ' to another unit.</p>') + '</div>';
    h += '<div><h4>If ' + name + ' is attacked</h4>';
    if (d.defenders.length + d.maybe.length + d.against.length + d.avoid.length === 0) h += '<p class="muted">Nobody on this board has a reason to step in, yet.</p>';
    else h += (d.defenders.length ? '<div class="dgroup"><b>Comes to the defence</b><ul class="rel">' + d.defenders.map(it => whyLine(it, 'steps in')).join('') + '</ul></div>' : '') + (d.maybe.length ? '<div class="dgroup"><b>Might step in</b><ul class="rel">' + d.maybe.map(it => whyLine(it, 'might step in')).join('') + '</ul></div>' : '') + (d.against.length ? '<div class="dgroup"><b>Joins in against</b><ul class="rel">' + d.against.map(it => whyLine(it, 'piles on')).join('') + '</ul></div>' : '') + (d.avoid.length ? '<div class="dgroup"><b>Stays well out of it</b><ul class="rel">' + d.avoid.map(it => whyLine(it, 'keeps away')).join('') + '</ul></div>' : '');
    if (d.stepsInFor.length + d.goesAfter.length + d.mightFor.length + d.avoids.length) h += '<div class="dgroup"><b>' + name + ' in other fights</b><ul class="rel">' + d.stepsInFor.map(it => whyLine(it, 'is who ' + name + ' steps in for')).join('') + d.mightFor.map(it => whyLine(it, 'is who ' + name + ' might step in for')).join('') + d.goesAfter.map(it => whyLine(it, 'is who ' + name + ' goes after')).join('') + d.avoids.map(it => whyLine(it, 'is who ' + name + ' avoids')).join('') + '</ul></div>';
    h += '</div>';
    if (r) h += '<div><h4>Already in the game’s encounter rules</h4><ul class="rel">' + temperText(r).map(t => '<li class="game">' + esc(t) + '</li>').join('') + '</ul></div>';
    else if (cst && cst.grp === 'cast') h += '<div><h4>Already in the game\u2019s encounter rules</h4><ul class="rel"><li class="game">Story cast have no temper: they cannot be struck on the walk (HQ_NPC_TEMPERS).</li></ul></div>';
    { const es = eventsOf(n.id); h += '<div><h4>Timeline' + (es.length ? ' (' + es.length + ')' : '') + '</h4>' + (es.length ? '<ul class="rel">' + es.map(ev => '<li data-ev="' + esc(ev.id) + '"><i style="--c:' + GCOL[ev.col || 0] + '"></i><span>' + (ev.when ? '<b>' + esc(ev.when) + '</b> ' : '') + esc(ev.title || 'Untitled') + '</span></li>').join('') + '</ul>' : '') + '<button class="btn sm" data-act="evNew">+ Event with ' + esc(isGrp(n) ? n.name : info(n).name) + '</button></div>'; }
    h += '<div class="prow"><button class="btn" data-act="vFocus">Show connections</button><button class="btn" data-act="vPath">Find the way to…</button></div>';
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
function renderPanels() { if (pressing) { deferred = true; return; } renderRoster(); renderInspector(); renderPop(); renderTimeline(); }
document.addEventListener('pointerdown', () => { pressing = true; }, true);
const release = () => { pressing = false; if (deferred) { deferred = false; setTimeout(renderPanels, 0); } };
document.addEventListener('pointerup', release, true); document.addEventListener('pointercancel', release, true);
function renderAll() { if (VIEW && VIEW.board !== B.id) VIEW = null; renderViewBar(); renderMapBg(); renderBoardSel(); renderNodes(); drawEdges(); renderOverlays(); renderLegend(); applyView(); renderPanels(); updateButtons(); }

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
/* THE PICKERS (2026-11-19, mondo: "it is hard to put a unit in more than 1 spot because I have to go hunting for it in this big web, it
   would be nice if a dropdown menu was there"): type to pick. A unit: any place or faction on the board (with the places it is inside),
   or any place in the game not on the board yet (it is added in its right spot). A group: any unit on the board, or any from the roster. */
let PICK = new Map();
function grpPicks(uid0) {
  PICK = new Map(); const inG = new Set(Object.values(B.links).filter(l => l.type === 'member' && l.a === uid0).map(l => l.b));
  Object.values(B.nodes).filter(g => isGrp(g) && !inG.has(g.id)).map(g => [pathOf(g) + (gkOf(g) === 'faction' ? ' (faction)' : ''), g]).sort((a, b) => a[0].localeCompare(b[0])).forEach(([v, g]) => { if (!PICK.has(v)) PICK.set(v, { g: g.id }); });
  const game = (v, src, name, a) => { if (placeOnBoard(src, name)) return; v += ' (from the game)'; if (!PICK.has(v)) PICK.set(v, { m: a }); };
  PL.zones.forEach(z => { game(z.n, placeSrc(z), z.n, [z.k, null, null]); (z.s || []).forEach(s => game(z.n + ' \u203a ' + s.n, 'map:' + z.k + ':@' + s.k, s.n, [z.k, '@' + s.k, null]));
    z.d.forEach(d => { const s = subOf(z, d), pre = z.n + ' \u203a ' + (s ? s.n + ' \u203a ' : ''); game(pre + d.n, placeSrc(z, d.k), d.n, [z.k, d.k, null]); d.p.forEach(pn => game(pre + d.n + ' \u203a ' + pn, placeSrc(z, d.k, pn), pn, [z.k, d.k, pn])); }); });
  return [...PICK.keys()];
}
function unitPicks(gid) {
  PICK = new Map(); const inG = new Set(Object.values(B.links).filter(l => l.type === 'member' && l.b === gid).map(l => l.a)), seen = {};
  const add = (v, o) => { if (PICK.has(v)) v += ' (' + (o.id || o.e).replace(/^[rs]:/, '') + ')'; if (!PICK.has(v)) PICK.set(v, o); };
  Object.values(B.nodes).filter(n => n.kind !== 'note' && !isGrp(n) && !inG.has(n.id)).map(n => { const o = info(n); return [o.name + (n.nick && o.gname && o.gname !== o.name ? ' (' + o.gname + ')' : ''), n.id]; }).sort((a, b) => a[0].localeCompare(b[0])).forEach(([v, id]) => add(v, { id }));
  ENTS.filter(e => !B.nodes[e.id]).slice().sort((a, b) => a.n.localeCompare(b.n)).forEach(e => add(e.n + ' (from the roster)', { e: e.id }));
  return [...PICK.keys()];
}
function joinGroup(a, b) { if (!B.nodes[a] || !B.nodes[b] || Object.values(B.links).some(l => l.type === 'member' && l.a === a && l.b === b)) return false; const id = uid('l'); B.links[id] = { id, a, b, type: 'member', dir: 'ab', label: '', s: 1 }; return true; }
function pickChosen(t) {
  const p = PICK.get(t.value); if (!p || !sel || !B.nodes[sel.id]) return false; const me = sel.id;
  if (t.id === 'pickGrp') { const g = p.g || addFromMap(p.m[0], p.m[1], p.m[2], false); if (!g) return true; joinGroup(me, g); sel = { kind: 'node', id: me }; commit(); toast(nm(me) + ' is in ' + B.nodes[g].name + ' now'); }
  else { let u = p.id; if (!u) { const e = ENT[p.e], g = B.nodes[me], q = freeSpot({ x: g.x + 120, y: g.y + 90 }, takenList()); u = e.id; B.nodes[u] = e.kind === 'cast' ? { id: u, kind: 'cast', cast: e.c.id, x: q.x, y: q.y, note: '' } : Object.assign({ id: u, kind: 'race', race: e.r.k, x: q.x, y: q.y, note: '' }, e.r.v.length > 1 ? { g: e.v.g } : {}); }
    joinGroup(u, me); sel = { kind: 'node', id: me }; commit(); toast(nm(u) + ' is in ' + B.nodes[me].name + ' now'); }
  setTimeout(() => { const i = $(t.id); if (i) i.focus(); }, 0); return true;
}
function addNote() { const c = viewCentre(), p = freeSpot({ x: c.x - 95, y: c.y - 60 }, takenList().map(t => ({ x: t.x - 95, y: t.y - 60 }))), id = uid('n'); B.nodes[id] = { id, kind: 'note', x: p.x, y: p.y, color: 'y', text: '' }; sel = { kind: 'node', id }; commit(); const t = elById.get(id); if (t) t.querySelector('textarea').focus(); }
function removeSel() {
  if (!sel) return;
  if (sel.kind === 'bundle') return;
  if (sel.kind === 'link') delete B.links[sel.id];
  else if (sel.kind === 'event') { if (B.events) delete B.events[sel.id]; }
  else { delete B.nodes[sel.id]; Object.values(B.links).forEach(l => { if (l.a === sel.id || l.b === sel.id) delete B.links[l.id]; }); Object.values(B.events || {}).forEach(ev => { ev.refs = ev.refs.filter(r => r !== sel.id); }); }
  sel = null; stopEdit(false); commit();
}
function createLink(a, b) {
  if (a === b || !B.nodes[a] || !B.nodes[b]) return;
  if (isGrp(B.nodes[a]) !== isGrp(B.nodes[b])) {
    if (isGrp(B.nodes[a]) && !isGrp(B.nodes[b])) { const x = a; a = b; b = x; }
    if (!Object.values(B.links).some(l => l.type === 'member' && l.a === a && l.b === b)) { const id = uid('l'); B.links[id] = { id, a, b, type: 'member', dir: 'ab', label: '', s: 1 }; }
    sel = { kind: 'node', id: b }; pendingSrc = null; $('toast').hidden = true; commit(); return;
  }
  const T = TYPE[S.ui.lastType] || TYPE.defends, id = uid('l');
  B.links[id] = { id, a, b, type: T.id, dir: T.dir || 'ab', label: '', s: 2 };
  sel = { kind: 'link', id }; pendingSrc = null; $('toast').hidden = true; commit(); startEdit(id);
}
function setLink(patch) {
  if (patch.type === 'member') { const l0 = sel && B.links[sel.id]; if (l0 && isGrp(B.nodes[l0.a]) && !isGrp(B.nodes[l0.b])) { const x = l0.a; l0.a = l0.b; l0.b = x; } patch = Object.assign({ dir: 'ab', label: '' }, patch); }
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
  S.boards[id] = { id, name, t: Date.now(), nodes: src.nodes, links: src.links, view: src.view }; if (src.events) S.boards[id].events = src.events; if (src.gweb) S.boards[id].gweb = src.gweb; S.order.push(id); S.active = id; B = S.boards[id]; sel = null;
  ensureView(); commit({ index: true });
}
/* THE "IN THE GAME NOW" BOARD (2026-11-18): where the game puts every unit today (build/spawns.js reads data.js). Made once as its own
   board; asked again, it is brought up to date: units and places that are still there keep their spots, the rest is laid out. */
function gameBoard() {
  const G0 = D.spawns; if (!G0) return toast('No game data in this build');
  const id = 'game_spawns', old = S.boards[id], N = JSON.parse(JSON.stringify(G0.nodes)), L = JSON.parse(JSON.stringify(G0.links));
  Object.values(N).forEach(n => { const o = old && old.nodes[n.id]; n.x = o ? o.x : 0; n.y = o ? o.y : 0; });
  if (old) { const at = {}; Object.values(old.links).forEach(l => { if (l.type === 'member' && Number.isFinite(l.cx)) at[l.a + '>' + l.b] = [l.cx, l.cy]; }); Object.values(L).forEach(l => { const q = at[l.a + '>' + l.b]; if (q) { l.cx = q[0]; l.cy = q[1]; } }); }
  const fresh = !old || Object.values(N).some(n => !old.nodes[n.id]);
  S.boards[id] = sanitizeBoard({ id, name: old ? old.name : 'In the game now', t: Date.now(), nodes: N, links: L, view: old ? old.view : null, org: 'place' });
  if (!S.order.includes(id)) S.order.push(id); delete S.deleted[id]; cloud.dels.delete(id);
  S.active = id; B = S.boards[id]; sel = null; multi.clear(); ensureView(); cloud.idx = true;
  if (fresh) sortGroups(); else { commit({ index: true }); fit(); }
  toast(old ? 'Brought up to date with the game' : 'Made from the game: every unit where it spawns');
}
function deleteBoard(id) {
  delete S.boards[id]; S.order = S.order.filter(x => x !== id); S.deleted[id] = Date.now(); cloud.dels.add(id); cloud.dirty.delete(id);
  if (!S.order.length) { S.boards.main = { id: 'main', name: 'Main board', t: Date.now(), nodes: {}, links: {}, view: null }; S.order.push('main'); delete S.deleted.main; cloud.dels.delete('main'); cloud.dirty.add('main'); }
  S.active = S.order[0]; B = S.boards[S.active]; sel = null; ensureView(); cloud.idx = true; pushHist(); saveLocal(); flushSoon(); renderAll();
}
function setOrg(k) {
  if (VIEW) closeView();
  if (orgK() === k) return;
  const cur = orgK(); B.lay = B.lay || {}; B.lay[cur] = {}; Object.values(B.nodes).forEach(n => { B.lay[cur][n.id] = [n.x, n.y]; });
  B.org = k; multi.clear();
  const L = B.lay[k];
  if (L && Object.keys(L).length) { Object.values(B.nodes).forEach(n => { if (L[n.id]) { n.x = L[n.id][0]; n.y = L[n.id][1]; } }); commit(); fit(); }
  else sortGroups();
}
/* lay the board out by the groups of the kind it is organised by: one area per group, its pill in the middle, its members
   round it; units in none of them together at the end; the other kind's pills in a row along the top; idea cards to the right */
/* where a place group is on the world map: its map place, else a zone or district of the same name */
function atOf(g) {
  if (!g) return null; const m = /^map:([^:]+)(?::(.+))?$/.exec(g.src || ''), z = m && PL.zones.find(q => q.k === m[1]);
  if (z) { if (!m[2]) return z.at; if (m[2][0] === '@') { const s = (z.s || []).find(q => '@' + q.k === m[2].split(':')[0]); return (s && s.at) || null; } const d = z.d.find(q => m[2] === String(q.k) || m[2].startsWith(q.k + ':')); return (d && d.at) || null; }
  for (const q of PL.zones) { if (psame(q.n, g.name)) return q.at; const s = (q.s || []).find(x => psame(x.n, g.name)); if (s) return s.at || null; const d = q.d.find(x => psame(x.n, g.name)); if (d) return d.at || null; }
  return null;
}
let mapOn = false;
function sortGroups() {
  const k = orgK(), N = Object.values(B.nodes), grps = N.filter(n => isGrp(n) && gkOf(n) === k), other = N.filter(n => isGrp(n) && gkOf(n) !== k);
  const home = homeMap(k), cps = copyList(), byName = (a, b) => nm(a).localeCompare(nm(b));
  /* one cluster a group: its pill, its own units and copies round it, the places inside it in a ring outside those */
  const make = g => { const m = N.filter(n => home[n.id] === g.id).map(n => n.id).sort(byName).map(id => ({ id })).concat(cps.filter(c => c.g.id === g.id).sort((a, b) => byName(a.u.id, b.u.id)).map(c => ({ lid: c.l.id })));
    const kids = kidsOf(g.id).filter(c => gkOf(c) === k).map(make).sort((a, b) => b.r - a.r), inner = m.length ? 70 * Math.sqrt(m.length + 2.2) + 40 : 70;
    let r = inner; if (kids.length) { const ring = inner + Math.max(...kids.map(c => c.r)) + 30, circ = kids.reduce((t, c) => t + 2 * c.r + 30, 0); const R = Math.max(ring, circ / (2 * Math.PI)); r = R + Math.max(...kids.map(c => c.r)); }
    return { g, m, kids, inner, r: r + 20 }; };
  const put = (c, cx, cy) => {
    c.g.x = Math.round(cx); c.g.y = Math.round(cy);
    c.m.forEach((e, i) => { const r = 70 * Math.sqrt(i + 2.2), a = i * 2.39996, x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r); if (e.id) { B.nodes[e.id].x = x; B.nodes[e.id].y = y; } else { B.links[e.lid].cx = x; B.links[e.lid].cy = y; } });
    if (!c.kids.length) return;
    const big = Math.max(...c.kids.map(q => q.r)), circ = c.kids.reduce((t, q) => t + 2 * q.r + 30, 0), R = Math.max(c.inner + big + 30, circ / (2 * Math.PI));
    /* on the map: each place inside sits on the side of its parent where it really is */
    const pa = mapOn && atOf(c.g), dir = q => { const a = pa && atOf(q.g); return a && (a[0] !== pa[0] || a[1] !== pa[1]) ? Math.atan2(a[1] - pa[1], a[0] - pa[0]) : null; };
    const ks = c.kids.map(q => ({ q, a: dir(q) })), known = ks.filter(e => e.a != null).sort((x, y) => x.a - y.a);
    const order = known.length ? known.concat(ks.filter(e => e.a == null)).map(e => e.q) : c.kids;
    let ang = known.length ? known[0].a - (2 * known[0].q.r + 30) / circ * Math.PI : -Math.PI / 2;
    order.forEach(q => { const span = (2 * q.r + 30) / circ * Math.PI * 2; ang += span / 2; put(q, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); ang += span / 2; });
  };
  const cl = grps.filter(g => !parentOf(g)).map(make);
  const loose = N.filter(n => n.kind !== 'note' && !isGrp(n) && !home[n.id]).map(n => n.id).sort(byName);
  if (loose.length) cl.push({ g: null, m: loose.map(id => ({ id })), kids: [], r: 70 * Math.sqrt(loose.length + .35) + 60 });
  if (!cl.length) return toast('Pin a few units first');
  cl.sort((a, b) => (!a.g) - (!b.g) || b.r - a.r);
  /* THE MAP BEHIND (2026-11-19, mondo: "when i sort by location the actual map pulls up on the screen and they are sorted the exact same
     way as now just in the correct spots relative to the map"): each place stands where it is on the world map, pushed apart only
     as far as it takes to not overlap; places that are not on the map (space, the Astral Realm, DOOR HQ, his own) line up beside it */
  const WM = PL.world, onMap = k === 'place' && WM ? cl.filter(c => c.g && atOf(c.g)) : [];
  if (onMap.length >= 3) {
    mapOn = true;
    const K = Math.round(Math.sqrt(onMap.reduce((t, c) => t + 4 * c.r * c.r, 0) * 1.25 / (WM.w * WM.h)) * 10) / 10;
    onMap.forEach(c => { const a = atOf(c.g); c.tx = (a[0] - WM.x0) * K; c.ty = (a[1] - WM.y0) * K; c.x = c.tx; c.y = c.ty; });
    for (let it = 0; it < 400; it++) {
      for (let i = 0; i < onMap.length; i++) for (let j = i + 1; j < onMap.length; j++) { const a = onMap[i], b = onMap[j]; let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); const need = a.r + b.r + 30; if (d >= need) continue; if (d < .01) { dx = (i - j) || 1; dy = .5; d = Math.hypot(dx, dy); } const push = (need - d) / 2, wa = b.r * b.r / (a.r * a.r + b.r * b.r); a.x -= dx / d * push * 2 * wa; a.y -= dy / d * push * 2 * wa; b.x += dx / d * push * 2 * (1 - wa); b.y += dy / d * push * 2 * (1 - wa); }
      const pull = it < 300 ? .04 : 0; onMap.forEach(c => { c.x += (c.tx - c.x) * pull; c.y += (c.ty - c.y) * pull; });
    }
    onMap.forEach(c => put(c, c.x, c.y));
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity; onMap.forEach(c => { x0 = Math.min(x0, c.x - c.r); x1 = Math.max(x1, c.x + c.r); y0 = Math.min(y0, c.y - c.r); });
    x1 = Math.max(x1, WM.w * K); y0 = Math.min(y0, 0);
    const rest = cl.filter(c => !onMap.includes(c)), RW = Math.max(Math.sqrt(rest.reduce((t, c) => t + 4 * c.r * c.r, 0)) * 1.2, 2 * Math.max(0, ...rest.map(c => c.r)));
    let x = 0, y = 0, rowH = 0, maxX = x1;
    rest.forEach(c => { if (x > 0 && x + 2 * c.r > RW) { x = 0; y += rowH + 40; rowH = 0; } const cx = x1 + 160 + x + c.r, cy = y0 + y + c.r; x += 2 * c.r + 40; rowH = Math.max(rowH, 2 * c.r); maxX = Math.max(maxX, cx + c.r);
      if (c.g) put(c, cx, cy); else c.m.forEach((e, i) => { const r = 70 * Math.sqrt(i + .35), a = i * 2.39996; B.nodes[e.id].x = Math.round(cx + Math.cos(a) * r); B.nodes[e.id].y = Math.round(cy + Math.sin(a) * r); }); });
    N.filter(n => n.kind === 'note').forEach((n, i) => { n.x = Math.round(maxX + 60); n.y = Math.round(y0 + i * 180); });
    mapOn = false; B.mapK = K; commit(); fit(); return;
  }
  delete B.mapK;
  const W = Math.max(Math.sqrt(cl.reduce((t, c) => t + 4 * c.r * c.r, 0)) * 1.5, 2 * Math.max(...cl.map(c => c.r)));
  let x = 0, y = 0, rowH = 0, maxX = 0;
  cl.forEach(c => {
    if (x > 0 && x + 2 * c.r > W) { x = 0; y += rowH + 40; rowH = 0; }
    const cx = x + c.r, cy = y + c.r; x += 2 * c.r + 40; rowH = Math.max(rowH, 2 * c.r); maxX = Math.max(maxX, x);
    if (c.g) put(c, cx, cy);
    else c.m.forEach((e, i) => { const r = 70 * Math.sqrt(i + .35), a = i * 2.39996; B.nodes[e.id].x = Math.round(cx + Math.cos(a) * r); B.nodes[e.id].y = Math.round(cy + Math.sin(a) * r); });
  });
  N.filter(n => n.kind === 'note').forEach((n, i) => { n.x = Math.round(maxX + 60); n.y = i * 180; });
  commit(); fit();
}
function arrange(mode) {
  delete B.mapK;
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

/* ───────── THE VIEWS (2026-11-19, mondo: "choosing a person and just seeing who all they are connected to, or grouping by location
   but then grouping by faction in each zone"): a view lays out part of the board for looking at. It keeps its own spots (VIEW.pos);
   nothing on the board moves or saves, and closing it (the bar's Close, or Escape) brings the board back as it was.
   focus: one unit and everyone tied to it, 1-3 steps out, friends on the left, enemies on the right
   path: the shortest chains of ties between two units (through shared groups only when ties alone do not join them)
   zones: every top place, its units sorted into their factions inside it
   command: serves / employs / worships as org charts, the boss on top
   family: created / family as family trees, makers above what they made, family side by side ───────── */
let VIEW = null, pathFrom = null;
const vp = n => (VIEW && VIEW.pos[n.id]) || n;
const FRIEND = new Set(['defend', 'defendRev']), FOE = new Set(['attack', 'avoid']);
const sideOf = l => { const fx = (TYPE[l.type] || TYPE.other).fx; return FRIEND.has(fx) ? 0 : FOE.has(fx) ? 2 : 1; };
function tieAdj(withGroups) {
  const adj = {}, add = (a, b, l) => { (adj[a] = adj[a] || []).push({ o: b, l }); };
  Object.values(B.links).forEach(l => { const A = B.nodes[l.a], Bn = B.nodes[l.b]; if (!A || !Bn || A.kind === 'note' || Bn.kind === 'note') return; if (l.type === 'member' && (!withGroups || l.secret)) return; add(l.a, l.b, l); add(l.b, l.a, l); });
  return adj;
}
function openView(v) {
  if (!Object.keys(v.pos).length) return false;
  if (!VIEW) v.back = Object.assign({}, B.view); else v.back = VIEW.back;
  v.board = B.id; VIEW = v; multi.clear(); linkMode = false; pendingSrc = null; renderAll(); fit(); return true;
}
function closeView() { if (!VIEW) return; const back = VIEW.back; VIEW = null; pathFrom = null; if (back) B.view = back; renderAll(); }
function viewFocus(id, hops) {
  hops = clamp(hops || 1, 1, 3);
  const adj = tieAdj(false), depth = { [id]: 0 }, par = {}, side = {}, q = [id];
  while (q.length) { const x = q.shift(); if (depth[x] >= hops) continue; (adj[x] || []).forEach(e => { if (depth[e.o] == null) { depth[e.o] = depth[x] + 1; par[e.o] = x; side[e.o] = depth[x] ? side[x] : sideOf(e.l); q.push(e.o); } }); }
  const ids = Object.keys(depth); if (ids.length < 2) { toast(nm(id) + ' has no ties yet'); return false; }
  const pos = { [id]: { x: 0, y: 0 } }, ang = { [id]: 0 }; let R = 0;
  for (let k = 1; k <= hops; k++) {
    const ring = ids.filter(x => depth[x] === k); if (!ring.length) break;
    const key = x => k === 1 ? side[x] * 10 : ((-Math.PI / 2 - ang[par[x]]) % (2 * Math.PI) + 4 * Math.PI) % (2 * Math.PI);
    ring.sort((a, b) => key(a) - key(b) || nm(a).localeCompare(nm(b)));
    R = Math.max(R + 230, ring.length * 125 / (2 * Math.PI));
    ring.forEach((x, i) => { const a = -Math.PI / 2 - (i + .5) / ring.length * 2 * Math.PI; ang[x] = a; pos[x] = { x: Math.round(Math.cos(a) * R), y: Math.round(Math.sin(a) * R) }; });
  }
  const shown = new Set(ids), links = new Set(Object.values(B.links).filter(l => l.type !== 'member' && shown.has(l.a) && shown.has(l.b)).map(l => l.id));
  const cnt = [0, 0, 0]; ids.forEach(x => { if (depth[x] === 1) cnt[side[x]]++; });
  return openView({ kind: 'focus', id, hops, pos, links, n: ids.length - 1, cnt });
}
function viewPath(a, b) {
  let via = false, best = null;
  for (const wg of [false, true]) {
    const adj = tieAdj(wg), dist = { [a]: 0 }, q = [a];
    while (q.length) { const x = q.shift(); if (x === b) break; (adj[x] || []).forEach(e => { if (dist[e.o] == null) { dist[e.o] = dist[x] + 1; q.push(e.o); } }); }
    if (dist[b] == null) continue;
    /* every shortest route: walk back from b over steps that go one closer to a */
    const back = {}; Object.keys(dist).forEach(x => (adj[x] || []).forEach(e => { if (dist[e.o] === dist[x] + 1) (back[e.o] = back[e.o] || []).push({ o: x, l: e.l }); }));
    const routes = [], walk = (x, acc) => { if (routes.length >= 6) return; if (x === a) { routes.push(acc); return; } (back[x] || []).forEach(e => walk(e.o, [e].concat(acc))); };
    walk(b, []); best = { routes, d: dist[b] }; via = wg; break;
  }
  if (!best) { toast(nm(a) + ' and ' + nm(b) + ' are not joined by any chain of ties or groups'); return false; }
  const cols = {}, links = new Set(); cols[a] = 0;
  best.routes.forEach(r => { let step = 0; r.forEach(e => { step++; links.add(e.l.id); }); });
  best.routes.forEach(r => { let x = a; r.forEach((e, i) => { const o = e.l.a === x ? e.l.b : e.l.a; cols[o] = i + 1; x = o; }); });
  const pos = {}, byCol = {}; Object.entries(cols).forEach(([id, c]) => (byCol[c] = byCol[c] || []).push(id));
  Object.entries(byCol).forEach(([c, ids]) => ids.sort((p, q) => nm(p).localeCompare(nm(q))).forEach((id, i) => { pos[id] = { x: +c * 300, y: Math.round((i - (ids.length - 1) / 2) * 170) }; }));
  return openView({ kind: 'path', a, b, pos, links, d: best.d, routes: best.routes.length, via });
}
function viewZones() {
  const N = Object.values(B.nodes), units = N.filter(n => n.kind !== 'note' && !isGrp(n)), hp = homeMap('place'), hf = homeMap('faction');
  const top = id => { let g = B.nodes[id], seen = 0; while (g && parentOf(g) && seen++ < 30) g = parentOf(g); return g; };
  const Z = new Map(); units.forEach(u => { const z = hp[u.id] ? top(hp[u.id]) : null, zk = z ? z.id : '', fk = hf[u.id] || '';
    if (!Z.has(zk)) Z.set(zk, { g: z, f: new Map() }); const zz = Z.get(zk); if (!zz.f.has(fk)) zz.f.set(fk, []); zz.f.get(fk).push(u.id); });
  const pos = {}, hulls = [], labels = [], byName = (p, q) => nm(p).localeCompare(nm(q));
  const zones = [...Z.values()].map(z => { const fs = [...z.f.entries()].map(([fk, ids]) => ({ g: fk ? B.nodes[fk] : null, ids: ids.sort(byName), r: 66 * Math.sqrt(ids.length + 1.5) + 34 })).sort((p, q) => (!p.g) - (!q.g) || q.r - p.r);
    /* the factions of a zone in a tight row-packed block */
    const W = Math.max(Math.sqrt(fs.reduce((t, f) => t + 4 * f.r * f.r, 0)) * 1.25, 2 * Math.max(...fs.map(f => f.r)));
    let x = 0, y = 0, rowH = 0, w = 0; fs.forEach(f => { if (x > 0 && x + 2 * f.r > W) { x = 0; y += rowH + 30; rowH = 0; } f.cx = x + f.r; f.cy = y + f.r; x += 2 * f.r + 30; rowH = Math.max(rowH, 2 * f.r); w = Math.max(w, x - 30); });
    return { g: z.g, fs, w, h: y + rowH, n: fs.reduce((t, f) => t + f.ids.length, 0) }; }).sort((p, q) => (!p.g) - (!q.g) || q.n - p.n);
  const W = Math.max(Math.sqrt(zones.reduce((t, z) => t + (z.w + 260) * (z.h + 300), 0)) * 1.35, Math.max(...zones.map(z => z.w + 260)));
  let x = 0, y = 0, rowH = 0;
  zones.forEach(z => { const zw = z.w + 260, zh = z.h + 300; if (x > 0 && x + zw > W) { x = 0; y += rowH + 60; rowH = 0; }
    const ox = x + 130, oy = y + 200, pts = [];
    z.fs.forEach(f => { const cx = ox + f.cx, cy = oy + f.cy, fp = [];
      f.ids.forEach((id, i) => { const r = 66 * Math.sqrt(i + .35), a = i * 2.39996, p = { x: Math.round(cx + Math.cos(a) * r), y: Math.round(cy + Math.sin(a) * r) }; pos[id] = p; fp.push(p); pts.push(p); });
      const top0 = Math.min(...fp.map(p => p.y));
      if (f.g) { hulls.push({ pts: fp.concat([{ x: cx, y: top0 - 70 }]), col: gcol(f.g) }); labels.push({ x: cx, y: top0 - 70, t: f.g.name, col: gcol(f.g), fac: 1, id: f.g.id }); }
      else labels.push({ x: cx, y: top0 - 70, t: 'No faction', col: '#7a807a', fac: 1, none: 1 }); });
    const zt = Math.min(...pts.map(p => p.y)) - 150;
    hulls.unshift({ pts: pts.concat([{ x: ox + z.w / 2, y: zt }]), col: z.g ? gcol(z.g) : '#7a807a', zone: 1 });
    labels.push({ x: ox + z.w / 2, y: zt, t: z.g ? z.g.name : 'In no place yet', col: z.g ? gcol(z.g) : '#7a807a', id: z.g && z.g.id, none: !z.g });
    x += zw + 60; rowH = Math.max(rowH, zh); });
  return openView({ kind: 'zones', pos, hulls, labels, links: 'sel', n: zones.length });
}
/* org charts and family trees: up = [child, parent, link], peer = [a, b, link] on one row */
function viewTree(kind) {
  const up = [], peer = [];
  Object.values(B.links).forEach(l => { const A = B.nodes[l.a], Bn = B.nodes[l.b]; if (!A || !Bn || A.kind === 'note' || Bn.kind === 'note') return; const [x, y] = actorTarget(l);
    if (kind === 'command') { if (l.type === 'serves' || l.type === 'worships') (l.dir === 'both' ? peer.push([l.a, l.b, l]) : up.push([x, y, l])); else if (l.type === 'employs') (l.dir === 'both' ? peer.push([l.a, l.b, l]) : up.push([y, x, l])); }
    else { if (l.type === 'created') (l.dir === 'both' ? peer.push([l.a, l.b, l]) : up.push([y, x, l])); else if (l.type === 'family') peer.push([l.a, l.b, l]); } });
  if (!up.length && !peer.length) { toast(kind === 'command' ? 'No serves, employs or worships ties on this board' : 'No created or family ties on this board'); return false; }
  const L = {}; up.concat(peer).forEach(e => { L[e[0]] = 0; L[e[1]] = 0; });
  for (let it = 0; it < 40; it++) { let ch = false; up.forEach(([c, p]) => { if (L[c] < L[p] + 1 && L[p] < 10) { L[c] = L[p] + 1; ch = true; } }); peer.forEach(([a, b]) => { const m = Math.max(L[a], L[b]); if (L[a] !== m || L[b] !== m) { L[a] = L[b] = m; ch = true; } }); if (!ch) break; }
  /* one tree a joined set */
  const root = {}, find = x => root[x] === x ? x : (root[x] = find(root[x])); Object.keys(L).forEach(x => { root[x] = x; }); up.concat(peer).forEach(e => { root[find(e[0])] = find(e[1]); });
  const comps = {}; Object.keys(L).forEach(x => (comps[find(x)] = comps[find(x)] || []).push(x));
  const pars = {}, peers = {}; up.forEach(([c, p]) => (pars[c] = pars[c] || []).push(p)); peer.forEach(([a, b]) => { (peers[a] = peers[a] || []).push(b); (peers[b] = peers[b] || []).push(a); });
  const trees = Object.values(comps).map(ids => { const rows = {}; ids.forEach(x => (rows[L[x]] = rows[L[x]] || []).push(x)); const ks = Object.keys(rows).map(Number).sort((a, b) => a - b), ix = {};
    ks.forEach(k => { rows[k].sort((a, b) => nm(a).localeCompare(nm(b))); rows[k].forEach((x, i) => { ix[x] = i; }); });
    for (let s = 0; s < 6; s++) ks.forEach(k => { const bc = x => { const ps = (pars[x] || []).filter(p => ix[p] != null), qs = (peers[x] || []).filter(p => ix[p] != null); const all = ps.concat(qs); return all.length ? all.reduce((t, p) => t + ix[p], 0) / all.length : ix[x]; };
      const v = {}; rows[k].forEach(x => { v[x] = bc(x); }); rows[k].sort((a, b) => v[a] - v[b] || nm(a).localeCompare(nm(b))); rows[k].forEach((x, i) => { ix[x] = i; }); });
    const w = Math.max(...ks.map(k => rows[k].length)); return { ids, rows, ks, w, h: ks.length }; }).sort((a, b) => b.ids.length - a.ids.length);
  const pos = {}, labels = [], MAXW = 2600; let x = 0, y = 0, rowH = 0;
  trees.forEach(t => { const tw = t.w * 150; if (x > 0 && x + tw > MAXW) { x = 0; y += rowH + 260; rowH = 0; }
    t.ks.forEach((k, li) => { const r = t.rows[k], off = (t.w - r.length) * 75; r.forEach((id, i) => { pos[id] = { x: x + off + i * 150, y: y + li * 210 }; }); });
    x += tw + 220; rowH = Math.max(rowH, t.h * 210); });
  return openView({ kind, pos, labels, links: new Set(up.concat(peer).map(e => e[2].id)), n: trees.length });
}
function renderViewBar() {
  const bar = $('viewbar'); if (!VIEW) { bar.hidden = true; return; }
  const V = VIEW, b = s => '<b>' + esc(s) + '</b>'; let t = '';
  if (V.kind === 'focus') t = b(nm(V.id)) + ': ' + V.n + ' tied within ' + V.hops + (V.hops === 1 ? ' step' : ' steps') + (V.hops === 1 ? ' <span class="muted">(' + V.cnt[0] + ' friendly, left · ' + V.cnt[2] + ' hostile, right · ' + V.cnt[1] + ' other)</span>' : '') + '<div class="seg">' + [1, 2, 3].map(k => '<button data-hops="' + k + '"' + (V.hops === k ? ' class="on"' : '') + '>' + k + '</button>').join('') + '</div><button class="btn sm" data-vact="pathFrom">Path to…</button>';
  else if (V.kind === 'path') t = b(nm(V.a)) + ' to ' + b(nm(V.b)) + ': ' + V.d + (V.d === 1 ? ' step' : ' steps') + (V.routes > 1 ? ', ' + V.routes + ' routes' : '') + (V.via ? ' <span class="muted">(through shared groups: no chain of ties joins them)</span>' : '');
  else if (V.kind === 'zones') t = b('Places, factions inside') + ' <span class="muted">' + V.n + ' places · each unit in its first place and first faction</span>';
  else if (V.kind === 'command') t = b('Chain of command') + ' <span class="muted">serves, employs, worships · boss on top · ' + V.n + (V.n === 1 ? ' chart' : ' charts') + '</span>';
  else if (V.kind === 'gweb') { gwebCalc(V); const nb = V.bundles.reduce((q, x) => q + x.bx.ties.length, 0) + V.links.size;
    t = b(V.gk === 'faction' ? 'Faction web' : 'Place web') + '<div class="seg">' + [['faction', 'Factions'], ['place', 'Places']].map(k => '<button data-gwk="' + k[0] + '"' + (V.gk === k[0] ? ' class="on"' : '') + '>' + k[1] + '</button>').join('') + '</div>' +
      '<div class="seg">' + [['all', 'All ties'], ['f', 'Friendly'], ['h', 'Hostile']].map(k => '<button data-gws="' + k[0] + '"' + (V.side === k[0] ? ' class="on"' : '') + '>' + k[1] + '</button>').join('') + '</div>' +
      (V.nested ? '<button class="btn sm' + (V.fold ? ' on' : '') + '" data-gwt="fold" title="Count the groups inside a group as that group">Fold inside</button>' : '') +
      '<button class="btn sm' + (V.loners ? ' on' : '') + '" data-gwt="loners" title="Show units in no ' + (V.gk === 'faction' ? 'faction' : 'place') + ' as themselves">Loners</button><button class="btn sm" data-gwt="spread" title="Lay out again: friends together, enemies apart">Spread out</button>' +
      ' <span class="muted">' + V.nG + (V.nG === 1 ? ' group' : ' groups') + ' \u00b7 ' + nb + ' ties' + (V.hidden ? ' \u00b7 ' + V.hidden + ' with a unit in no ' + (V.gk === 'faction' ? 'faction' : 'place') + ' left out' : '') + '</span>'; }
  else if (V.kind === 'family') t = b('Family trees') + ' <span class="muted">made above, what they made below · family side by side · ' + V.n + (V.n === 1 ? ' tree' : ' trees') + '</span>';
  bar.innerHTML = '<span>' + t + '</span><button class="btn sm pri" data-vact="close">Close view</button>'; bar.hidden = false;
}
$('viewbar').addEventListener('click', e => { const h = e.target.closest('[data-hops]'); if (h) return viewFocus(VIEW.id, +h.dataset.hops);
  const gb = e.target.closest('[data-gwk], [data-gws], [data-gwt]'); if (gb && VIEW && VIEW.kind === 'gweb') { const V = VIEW;
    if (gb.dataset.gwt === 'spread') return gwebSpread();
    if (gb.dataset.gwk) V.gk = gb.dataset.gwk; else if (gb.dataset.gws) V.side = gb.dataset.gws; else V[gb.dataset.gwt] = !V[gb.dataset.gwt];
    if (sel && sel.kind === 'bundle') sel = null; renderAll(); if (gb.dataset.gwk || gb.dataset.gwt) fit(); return; }
  const a = e.target.closest('[data-vact]'); if (!a) return;
  if (a.dataset.vact === 'close') closeView(); else if (a.dataset.vact === 'pathFrom') { pathFrom = VIEW.id; toast('Now tap the unit to find the way to'); } });

/* ───────── THE GROUP WEB (2026-11-21, mondo: "see and group the faction relationships without the individual links showing") ─────────
   A view of the places or the factions only: every tie between their members is summed onto one line a kind between the two groups
   (rivals x4), a tie straight between two groups is drawn as itself. Its own spots per board and kind (B.gweb), so a layout stays;
   groups inside a group (the inspector's Inside) sit in its shade and move with it: that is how groups of groups are made. */
function gwebCalc(V) {
  const k = V.gk, grps = Object.values(B.nodes).filter(n => isGrp(n) && gkOf(n) === k);
  const topOf = g => { let p = g, s = 0; while (V.fold && parentOf(p) && s++ < 30) p = parentOf(p); return p; };
  const shown = new Set(grps.filter(g => !V.fold || !parentOf(g)).map(g => g.id)), ug = {};
  Object.values(B.links).forEach(l => { if (l.type !== 'member' || l.secret) return; const g = B.nodes[l.b], u = B.nodes[l.a]; if (!isGrp(g) || gkOf(g) !== k || !u || isGrp(u)) return; (ug[l.a] = ug[l.a] || new Set()).add(topOf(g).id); });
  const ends = id => { const n = B.nodes[id]; if (!n || n.kind === 'note') return []; if (isGrp(n)) return gkOf(n) === k ? [topOf(n).id] : []; if (ug[id]) return [...ug[id]]; return V.loners ? [id] : []; };
  const bm = {}, real = new Set(), lon = new Set(), inner = {}; let hidden = 0;
  Object.values(B.links).forEach(l => {
    if (l.type === 'member' || !B.nodes[l.a] || !B.nodes[l.b]) return;
    const sd = sideOf(l); if ((V.side === 'f' && sd !== 0) || (V.side === 'h' && sd !== 2)) return;
    const A = ends(l.a), Z = ends(l.b); if (!A.length || !Z.length) { hidden++; return; }
    [l.a, l.b].forEach((id, i) => { const e = i ? Z : A; if (e.length === 1 && e[0] === id && !isGrp(B.nodes[id])) lon.add(id); });
    if (A.length === 1 && Z.length === 1 && A[0] === l.a && Z[0] === l.b) { real.add(l.id); return; }
    A.forEach(a => Z.forEach(b => {
      if (a === b) { inner[a] = (inner[a] || 0) + 1; return; }
      const flip = a > b, x = flip ? b : a, y = flip ? a : b, key = 'bx:' + x + '|' + y + '|' + l.type;
      const o = bm[key] = bm[key] || { a: x, b: y, type: l.type, ab: 0, ba: 0, both: 0, ties: [] };
      if (o.ties.includes(l.id)) return; o.ties.push(l.id);
      if (l.dir === 'both') o.both++; else if ((l.dir === 'ab') !== flip) o.ab++; else o.ba++;
    }));
  });
  const bundles = Object.entries(bm).map(([id, o]) => ({ id, a: o.a, b: o.b, type: o.type, dir: o.both || (o.ab && o.ba) ? 'both' : o.ab ? 'ab' : 'ba', s: 2, sw: Math.min(11, 1.3 + 1.6 * Math.sqrt(o.ties.length)), label: '', bx: o }));
  const ids = [...shown].concat(V.loners ? [...lon] : []);
  B.gweb = B.gweb || {}; const st = B.gweb[k] = B.gweb[k] || {}, miss = ids.filter(id => !st[id]);
  if (miss.length) { const fixed = {}; ids.forEach(id => { if (st[id]) fixed[id] = { x: st[id][0], y: st[id][1] }; }); const p = gwebLayout(ids, bundles, real, fixed, V); miss.forEach(id => { st[id] = [p[id].x, p[id].y]; }); }
  V.pos = {}; ids.forEach(id => { V.pos[id] = { x: st[id][0], y: st[id][1] }; });
  V.links = real; V.bundles = bundles; V.hidden = hidden; V.inner = inner; V.nG = shown.size; V.nested = grps.some(g => parentOf(g));
  return V;
}
/* the spread: friends pull together, enemies push apart, a group stays by the group it is inside */
function gwebLayout(ids, bundles, real, fixed, V) {
  const n = ids.length, P = {}, W = {}, key = (a, b) => a < b ? a + '|' + b : b + '|' + a, R0 = Math.max(320, n * 70);
  ids.forEach((id, i) => { const f = fixed[id], a = i / Math.max(1, n) * Math.PI * 2; P[id] = f ? { x: f.x, y: f.y } : { x: Math.round(Math.cos(a) * R0), y: Math.round(Math.sin(a) * R0) }; });
  const fx = Object.keys(fixed); if (fx.length) { const c = fx.reduce((t, id) => ({ x: t.x + fixed[id].x / fx.length, y: t.y + fixed[id].y / fx.length }), { x: 0, y: 0 }); ids.forEach((id, i) => { if (!fixed[id]) { const a = i * 2.39996; P[id] = { x: Math.round(c.x + Math.cos(a) * R0 * 1.3), y: Math.round(c.y + Math.sin(a) * R0 * 1.3) }; } }); }
  const add = (a, b, w) => { if (!P[a] || !P[b]) return; W[key(a, b)] = (W[key(a, b)] || 0) + w; };
  bundles.forEach(q => { const s = sideOf(q); add(q.a, q.b, (s === 0 ? 1 : s === 2 ? -1 : .3) * Math.sqrt(q.bx.ties.length)); });
  real.forEach(id => { const l = B.links[id], s = sideOf(l); add(l.a, l.b, s === 0 ? 1.5 : s === 2 ? -1.5 : .4); });
  if (!V.fold) ids.forEach(id => { const p = B.nodes[id] && parentOf(B.nodes[id]); if (p && P[p.id]) add(id, p.id, 3); });
  /* Fruchterman-Reingold with a pull to the middle: friends attract (d^2 / K), enemies only push within reach */
  const K = 210; let temp = 420;
  for (let it = 0; it < 420; it++) {
    const F = {}; ids.forEach(id => { F[id] = { x: 0, y: 0 }; });
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const a = ids[i], b = ids[j], A = P[a], Bq = P[b]; let dx = Bq.x - A.x, dy = Bq.y - A.y; const d = Math.max(20, Math.hypot(dx, dy)); dx /= d; dy /= d;
      const w = W[key(a, b)] || 0; let f = -K * K / d;
      if (w > 0) f += Math.min(w, 4) * d * d / K * .5; else if (w < 0 && d < K * 3) f += Math.max(w, -4) * K * K / d * .6;
      F[a].x += dx * f; F[a].y += dy * f; F[b].x -= dx * f; F[b].y -= dy * f;
    }
    ids.forEach(id => { if (fixed[id]) return; const f = F[id], p = P[id]; f.x -= p.x * .9; f.y -= p.y * .9; const m = Math.hypot(f.x, f.y) || 1, st = Math.min(m, temp); p.x += f.x / m * st; p.y += f.y / m * st; });
    temp = Math.max(2, temp * .985);
  }
  ids.forEach(id => { P[id].x = Math.round(P[id].x); P[id].y = Math.round(P[id].y); });
  return P;
}
function openGweb() {
  const v = gwebCalc({ kind: 'gweb', gk: orgK(), side: 'all', fold: false, loners: false, pos: {} });
  if (!Object.keys(v.pos).length) { toast('No ' + (v.gk === 'faction' ? 'factions' : 'places') + ' on this board yet: + Group makes one'); return false; }
  return openView(v);
}
function gwebSpread() {
  if (!VIEW || VIEW.kind !== 'gweb') return; const ids = Object.keys(VIEW.pos), p = gwebLayout(ids, VIEW.bundles, VIEW.links, {}, VIEW);
  const st = B.gweb[VIEW.gk]; ids.forEach(id => { st[id] = [p[id].x, p[id].y]; }); commit(); fit();
}
/* who a picked pill or event lights up in the group web */
function gwebNear(id) { const s = new Set([id]); if (!VIEW || VIEW.kind !== 'gweb') return s; VIEW.bundles.forEach(q => { if (q.a === id) s.add(q.b); if (q.b === id) s.add(q.a); }); VIEW.links.forEach(lid => { const l = B.links[lid]; if (l && l.a === id) s.add(l.b); if (l && l.b === id) s.add(l.a); }); return s; }

/* ───────── THE TIMELINE (2026-11-21, mondo: "place events and link them to factions or groups/places or characters") ─────────
   Events per board (B.events: title, when (free text: Year 1999, Before the Fall), what happens, colour, refs = node ids on the board).
   The dock along the bottom shows them in order (t); drag a card sideways to move it in time. Rows: one, or one per faction / place
   (an event sits in the row of every group it names and the home group of every unit it names). Picking an event lights its units
   on the board; picking a unit or group lights its events. */
const tlOpen = () => !!S.ui.tl;
const evList = () => Object.values(B.events || {}).sort((a, b) => a.t - b.t || a.title.localeCompare(b.title));
const evRefs = ev => (ev.refs || []).filter(id => B.nodes[id] && B.nodes[id].kind !== 'note');
const eventsOf = id => evList().filter(ev => evRefs(ev).includes(id));
function evLight(ev) { const s = new Set(); evRefs(ev).forEach(id => { s.add(id); if (isGrp(B.nodes[id])) membersOf(id).forEach(m => s.add(m)); else groupsOf(id).forEach(g => s.add(g)); }); return s; }
function newEvent(refs) {
  B.events = B.events || {}; const L = evList(), after = sel && sel.kind === 'event' && B.events[sel.id], id = uid('e');
  const t = after ? (() => { const i = L.indexOf(after), nx = L[i + 1]; return nx ? (after.t + nx.t) / 2 : after.t + 1; })() : (L.length ? L[L.length - 1].t + 1 : 0);
  const r0 = (refs || []).filter(x => B.nodes[x]), g0 = r0.map(x => B.nodes[x]).find(isGrp);
  B.events[id] = { id, title: 'New event', when: '', t, text: '', refs: r0, col: g0 ? (g0.col || 0) : 5 };
  S.ui.tl = true; sel = { kind: 'event', id }; commit();
  $('roster').classList.remove('open'); if (narrow()) $('inspector').classList.add('open');
  setTimeout(() => { const i = $('evTitle'); if (i) { i.focus(); i.select(); } tlScrollTo(id); }, 0);
}
function selectEvent(id) { if (!B.events || !B.events[id]) return; if (!tlOpen()) { S.ui.tl = true; saveLocalSoon(); } select({ kind: 'event', id }); setTimeout(() => tlScrollTo(id), 0); }
function tlScrollTo(id) { const el = $('tlBody') && $('tlBody').querySelector('[data-ev="' + id + '"]'); if (el) { const b = $('tlBody'), x = el.offsetLeft - b.clientWidth / 2 + el.offsetWidth / 2; b.scrollTo({ left: Math.max(0, x), behavior: 'smooth' }); } }
function evMove(id, d) { const L = evList(), i = L.findIndex(e => e.id === id), j = i + d; if (i < 0 || j < 0 || j >= L.length) return; const x = L[i]; L.splice(i, 1); L.splice(j, 0, x); L.forEach((e, k) => { e.t = k; }); commit(); setTimeout(() => tlScrollTo(id), 0); }
function evFit(ev) { const ids = [...evLight(ev)].filter(id => !VIEW || VIEW.pos[id]); if (!ids.length) return toast('Nothing it names is on this view'); const r = stage.getBoundingClientRect(), b = bbox(ids), v = B.view, h = r.height - tlH(); const k = clamp(Math.min((r.width - 80) / (b.x1 - b.x0), (h - 80) / (b.y1 - b.y0)), .02, 1.15); v.k = k; v.x = r.width / 2 - (b.x0 + b.x1) / 2 * k; v.y = h / 2 - (b.y0 + b.y1) / 2 * k; applyView(); }
const tlH = () => tlOpen() && !$('timeline').hidden ? $('timeline').offsetHeight : 0;
const TL_W = 188, TL_ROW = 96, TL_LAB = 132;
function tlRows(L) {
  const mode = S.ui.tlRows === 'faction' || S.ui.tlRows === 'place' ? S.ui.tlRows : 'one';
  if (mode === 'one') return { mode, rows: [{ id: '', name: '', ev: L }] };
  const HM = homeMap(mode), rows = new Map(), none = { id: '_none', name: mode === 'faction' ? 'No faction' : 'No place', ev: [] };
  L.forEach(ev => { const gs = new Set(); evRefs(ev).forEach(id => { const n = B.nodes[id]; if (isGrp(n)) { if (gkOf(n) === mode) gs.add(id); } else if (HM[id]) gs.add(HM[id]); });
    if (!gs.size) none.ev.push(ev); gs.forEach(g => { if (!rows.has(g)) rows.set(g, { id: g, name: B.nodes[g].name, g: B.nodes[g], ev: [] }); rows.get(g).ev.push(ev); }); });
  const out = [...rows.values()]; if (none.ev.length) out.push(none); return { mode, rows: out };
}
function renderTimeline() {
  const el = $('timeline'); stage.classList.toggle('tlopen', tlOpen()); $('btnTl').classList.toggle('on', tlOpen());
  if (!tlOpen()) { el.hidden = true; return; }
  const L = evList(), R = tlRows(L), col = {}, sl = sel && sel.kind === 'node' ? sel.id : null, mine = sl ? new Set(eventsOf(sl).map(e => e.id)) : null, sb = $('tlBody'), sx = sb ? sb.scrollLeft : 0, sy = sb ? sb.scrollTop : 0;
  L.forEach((e, i) => { col[e.id] = i; });
  let h = '<div class="tlhead"><b>Timeline</b><span class="muted">' + L.length + (L.length === 1 ? ' event' : ' events') + (mine ? ' · ' + mine.size + ' with ' + esc(nm(sl)) : '') + '</span><span class="sp"></span>' +
    '<div class="seg" id="tlRowsSeg" title="Rows">' + [['one', 'One row'], ['faction', 'By faction'], ['place', 'By place']].map(m => '<button data-tlrows="' + m[0] + '"' + (R.mode === m[0] ? ' class="on"' : '') + '>' + m[1] + '</button>').join('') + '</div>' +
    '<button class="btn sm pri" data-tl="new">+ Event</button><button class="btn sm" data-tl="close" aria-label="Close timeline">Close</button></div>';
  const lab = R.mode !== 'one', w = (lab ? TL_LAB : 12) + Math.max(1, L.length) * TL_W + 20, hh = Math.max(1, R.rows.length) * TL_ROW + 8;
  h += '<div id="tlBody"><div class="tlin" style="width:' + w + 'px;height:' + hh + 'px">';
  R.rows.forEach((r, ri) => {
    const y = ri * TL_ROW + 4, xs = r.ev.map(e => (lab ? TL_LAB : 12) + col[e.id] * TL_W);
    if (xs.length) h += '<div class="tlline" style="top:' + (y + 44) + 'px;left:' + (xs[0] + 10) + 'px;width:' + (xs[xs.length - 1] - xs[0]) + 'px"></div>';
    if (lab) h += '<div class="tllab' + (r.g && gkOf(r.g) === 'faction' ? ' fac' : '') + (r.g ? '' : ' none') + '" style="top:' + y + 'px;--gc:' + (r.g ? gcol(r.g) : '#7a807a') + '"' + (r.g ? ' data-node="' + esc(r.id) + '"' : '') + '>' + esc(r.name) + '</div>';
    r.ev.forEach(e => { const rf = evRefs(e), cls = (sel && sel.kind === 'event' && sel.id === e.id ? ' sel' : '') + (mine ? (mine.has(e.id) ? ' hit' : ' dim') : '');
      h += '<div class="ev' + cls + '" data-ev="' + esc(e.id) + '" style="left:' + ((lab ? TL_LAB : 12) + col[e.id] * TL_W) + 'px;top:' + y + 'px;--gc:' + GCOL[e.col || 0] + '">' + (e.when ? '<small>' + esc(e.when) + '</small>' : '') + '<b>' + esc(e.title || 'Untitled') + '</b>' +
        (rf.length ? '<span class="evrefs">' + rf.slice(0, 3).map(id => { const n = B.nodes[id]; return isGrp(n) ? '<i class="g' + (gkOf(n) === 'faction' ? ' fac' : '') + '" style="--gc:' + gcol(n) + '">' + esc(n.name) + '</i>' : '<i>' + esc(nm(id)) + '</i>'; }).join('') + (rf.length > 3 ? '<i>+' + (rf.length - 3) + '</i>' : '') + '</span>' : '') + '</div>'; });
  });
  if (!L.length) h += '<div class="tlempty muted">No events yet.</div>';
  h += '</div></div>';
  el.innerHTML = h; el.hidden = false;
  const nb = $('tlBody'); nb.scrollLeft = sx; nb.scrollTop = sy; tlPin();
}
let tdrag = null;
$('timeline').addEventListener('click', e => {
  const b = e.target.closest('[data-tl], [data-tlrows], .tllab[data-node]'); if (!b) return;
  if (b.dataset.tlrows) { S.ui.tlRows = b.dataset.tlrows; saveLocalSoon(); renderTimeline(); return; }
  if (b.dataset.node) { select({ kind: 'node', id: b.dataset.node }); if ((!VIEW || VIEW.pos[b.dataset.node]) && !offK(B.nodes[b.dataset.node])) centreOn(b.dataset.node); return; }
  if (b.dataset.tl === 'new') newEvent(sel && sel.kind === 'node' && B.nodes[sel.id] && B.nodes[sel.id].kind !== 'note' ? [sel.id] : []);
  else if (b.dataset.tl === 'close') { S.ui.tl = false; saveLocalSoon(); renderTimeline(); }
});
$('timeline').addEventListener('pointerdown', e => {
  const c = e.target.closest('.ev'); if (!c || e.button > 0) return;
  tdrag = { id: c.dataset.ev, el: c, sx: e.clientX, x0: c.offsetLeft, moved: false, pid: e.pointerId }; try { c.setPointerCapture(e.pointerId); } catch (err) {}
});
$('timeline').addEventListener('pointermove', e => {
  if (!tdrag || tdrag.pid !== e.pointerId) return; const dx = e.clientX - tdrag.sx;
  if (!tdrag.moved) { if (Math.abs(dx) < 6) return; tdrag.moved = true; tdrag.el.classList.add('drag'); }
  tdrag.el.style.left = (tdrag.x0 + dx) + 'px';
});
function tlEnd(e) {
  if (!tdrag || tdrag.pid !== e.pointerId) return; const d = tdrag; tdrag = null;
  if (!d.moved) { selectEvent(d.id); return; }
  if (e.type === 'pointercancel') { renderTimeline(); return; }
  const L = evList(), i = L.findIndex(q => q.id === d.id), lab = tlRows(L).mode !== 'one', j = clamp(Math.round((d.el.offsetLeft - (lab ? TL_LAB : 12)) / TL_W), 0, L.length - 1);
  if (i < 0 || i === j) { renderTimeline(); return; }
  const x = L[i]; L.splice(i, 1); L.splice(j, 0, x); L.forEach((q, k) => { q.t = k; }); sel = { kind: 'event', id: d.id }; commit();
}
$('timeline').addEventListener('scroll', e => { if (e.target.id === 'tlBody') tlPin(); }, true);
function tlPin() { const b = $('tlBody'); if (b) b.querySelectorAll('.tllab').forEach(l => { l.style.transform = 'translateX(' + b.scrollLeft + 'px)'; }); }
$('timeline').addEventListener('pointerup', tlEnd); $('timeline').addEventListener('pointercancel', tlEnd);
$('timeline').addEventListener('wheel', e => { const b = e.target.closest('#tlBody'); if (!b) return; if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && b.scrollHeight <= b.clientHeight + 2) { b.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
$('btnTl').addEventListener('click', () => { S.ui.tl = !tlOpen(); saveLocalSoon(); renderTimeline(); });
$('btnGweb').addEventListener('click', () => { if (VIEW && VIEW.kind === 'gweb') closeView(); else openGweb(); });
/* the event picker: anything on the board, any roster unit, any place in the game */
function evPicks(evId) {
  PICK = new Map(); const ev = B.events[evId], have = new Set(ev ? ev.refs : []);
  const add = (v, o) => { if (PICK.has(v)) v += ' (' + (o.id || o.e || '').replace(/^[rs]:/, '') + ')'; if (!PICK.has(v)) PICK.set(v, o); };
  Object.values(B.nodes).filter(g => isGrp(g) && !have.has(g.id)).map(g => [pathOf(g) + (gkOf(g) === 'faction' ? ' (faction)' : ' (place)'), g.id]).sort((a, b) => a[0].localeCompare(b[0])).forEach(([v, id]) => add(v, { id }));
  Object.values(B.nodes).filter(n => n.kind !== 'note' && !isGrp(n) && !have.has(n.id)).map(n => { const o = info(n); return [o.name + (n.nick && o.gname && o.gname !== o.name ? ' (' + o.gname + ')' : ''), n.id]; }).sort((a, b) => a[0].localeCompare(b[0])).forEach(([v, id]) => add(v, { id }));
  ENTS.filter(e => !B.nodes[e.id]).slice().sort((a, b) => a.n.localeCompare(b.n)).forEach(e => add(e.n + ' (from the roster)', { e: e.id }));
  PL.zones.forEach(z => { const game = (v, src, name, a) => { if (placeOnBoard(src, name)) return; add(v + ' (from the game)', { m: a }); };
    game(z.n, placeSrc(z), z.n, [z.k, null, null]); z.d.forEach(d => { const s = subOf(z, d); game(z.n + ' › ' + (s ? s.n + ' › ' : '') + d.n, placeSrc(z, d.k), d.n, [z.k, d.k, null]); }); });
  return [...PICK.keys()];
}
function evPickChosen(t) {
  const p = PICK.get(t.value), ev = sel && sel.kind === 'event' && B.events[sel.id]; if (!p || !ev) return false;
  let id = p.id;
  if (!id && p.e) { const e = ENT[p.e], q = freeSpot(viewCentre(), takenList()); id = e.id; B.nodes[id] = e.kind === 'cast' ? { id, kind: 'cast', cast: e.c.id, x: q.x, y: q.y, note: '' } : Object.assign({ id, kind: 'race', race: e.r.k, x: q.x, y: q.y, note: '' }, e.r.v.length > 1 ? { g: e.v.g } : {}); }
  if (!id && p.m) { id = addFromMap(p.m[0], p.m[1], p.m[2], false); sel = { kind: 'event', id: ev.id }; }
  if (!id) return true;
  if (!ev.refs.includes(id)) ev.refs.push(id); commit(); toast(nm(id) + ' is linked to ' + (ev.title || 'the event'));
  setTimeout(() => { const i = $('pickEv'); if (i) i.focus(); }, 0); return true;
}

/* ───────── pointer handling on the board ───────── */
const ptrs = new Map(); let drag = null, pinch = null, raf = 0;
/* every unit tied to this one, through any chain of ties */
function groupOf(id) { const seen = new Set([id]), q = [id], adj = {}; Object.values(B.links).forEach(l => { if (l.type === 'member') return; (adj[l.a] = adj[l.a] || []).push(l.b); (adj[l.b] = adj[l.b] || []).push(l.a); }); while (q.length) (adj[q.shift()] || []).forEach(o => { if (!seen.has(o) && B.nodes[o]) { seen.add(o); q.push(o); } }); return [...seen]; }
function inPoly(x, y, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i].y > y) !== (P[j].y > y) && x < (P[j].x - P[i].x) * (y - P[i].y) / (P[j].y - P[i].y) + P[i].x) c = !c; return c; }
function setMulti(ids) { multi = new Set(ids.filter(id => B.nodes[id])); renderNodes(); }
function nodeAt(p, not) { let best = null, bd = 46; Object.values(B.nodes).forEach(n0 => { if (n0.kind === 'note' || n0.id === not || (VIEW && !VIEW.pos[n0.id]) || offK(n0)) return; const n = Object.assign({}, n0, vp(n0)); const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = n.id; } }); return best; }
stage.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button > 1) return;
  const t = e.target;
  if (t.closest('.overlay') || t.closest('#tagedit')) return;
  const copyEl = t.closest('.copy');
  if (copyEl && e.button === 0 && !linkMode) { closeMenus(); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { stage.setPointerCapture(e.pointerId); } catch (err) {} e.preventDefault(); const c = CP.find(q => q.l.id === copyEl.dataset.cid); if (!c) return; const p0 = toWorld(e.clientX, e.clientY); drag = { pid: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, kind: 'node', nid: c.u.id, px: p0.x, py: p0.y, grp: [], cps: [{ lid: c.l.id, x: c.x, y: c.y }], copy: true }; return; }
  const nodeEl = t.closest('.node:not(.copy)'), noteEl = t.closest('.note'), tagEl = t.closest('.tag'), edgeEl = t.closest('.edge'), onHandle = !!t.closest('.handle');
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
  if (VIEW && VIEW.kind === 'gweb' && nodeEl && nid && VIEW.pos[nid] && e.button === 0 && (linkMode || e.shiftKey || onHandle)) { drag = Object.assign(base, { kind: 'link', from: nid, tap: linkMode && !onHandle }); return; }
  if (VIEW) { if (nid && e.button === 0 && VIEW.pos[nid]) { const ids = VIEW.kind === 'gweb' && !VIEW.fold && isGrp(B.nodes[nid]) && !e.altKey ? [nid].concat(descOf(nid).map(k => k.id)).filter(id => VIEW.pos[id]) : [nid]; drag = Object.assign(base, { kind: 'vnode', nid, px: p.x, py: p.y, grp: ids.map(id => ({ id, x: VIEW.pos[id].x, y: VIEW.pos[id].y })) }); } else if (lid && e.button === 0) drag = Object.assign(base, { kind: 'edge', lid, vx: B.view.x, vy: B.view.y }); else drag = Object.assign(base, { kind: 'pan', vx: B.view.x, vy: B.view.y }); return; }
  if (nodeEl && e.button === 0 && (linkMode || e.shiftKey || onHandle)) drag = Object.assign(base, { kind: 'link', from: nid, tap: linkMode && !onHandle });
  else if (nid && e.button === 0) { const n = B.nodes[nid], gset = isGrp(n) && isOrgGrp(n) !== e.altKey ? [n].concat(descOf(nid)) : null, HMd = gset ? homeMap(orgK()) : null, grp = gset ? [...new Set(gset.map(g => g.id).concat(...gset.map(g => Object.values(B.links).filter(l => l.type === 'member' && l.b === g.id && !l.secret && (HMd[l.a] === g.id || !isOrgGrp(g) || isGrp(B.nodes[l.a]))).map(l => l.a))))] : isGrp(n) ? [nid] : e.altKey && n.kind !== 'note' ? groupOf(nid) : multi.has(nid) ? [...multi].filter(id => B.nodes[id]) : [nid]; const gids = gset ? new Set(gset.map(g => g.id)) : null; drag = Object.assign(base, { kind: 'node', nid, px: p.x, py: p.y, grp: grp.filter(id => B.nodes[id]).map(id => ({ id, x: B.nodes[id].x, y: B.nodes[id].y })), cps: gids ? CP.filter(c => gids.has(c.g.id)).map(c => ({ lid: c.l.id, x: c.x, y: c.y })) : [] }); }
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
  else if (drag.kind === 'vnode') { if (!VIEW) return; drag.grp.forEach(g => { const q = VIEW.pos[g.id]; if (!q) return; q.x = Math.round(g.x + p.x - drag.px); q.y = Math.round(g.y + p.y - drag.py); if (VIEW.kind === 'gweb' && B.gweb && B.gweb[VIEW.gk]) B.gweb[VIEW.gk][g.id] = [q.x, q.y]; const el = elById.get(g.id); if (el) { el.style.left = q.x + 'px'; el.style.top = q.y + 'px'; } }); if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawEdges(); }); }
  else if (drag.kind === 'node') {
    const mx = p.x - drag.px, my = p.y - drag.py;
    drag.grp.forEach(g => { const n = B.nodes[g.id]; if (!n) return; n.x = Math.round(g.x + mx); n.y = Math.round(g.y + my); const el = elById.get(n.id); if (el) { el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; if (drag.grp.length > 1) el.classList.add('grab'); } });
    (drag.cps || []).forEach(c => { const l = B.links[c.lid]; if (!l) return; l.cx = Math.round(c.x + mx); l.cy = Math.round(c.y + my); const el = elById.get('cp:' + c.lid); if (el) { el.style.left = l.cx + 'px'; el.style.top = l.cy + 'px'; } const q = CP.find(z => z.l.id === c.lid); if (q) { q.x = l.cx; q.y = l.cy; } });
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawEdges(); });
  } else if (drag.kind === 'lasso') {
    drag.pts.push(p); $('temp').setAttribute('d', 'M' + drag.pts.map(q => q.x.toFixed(1) + ' ' + q.y.toFixed(1)).join('L') + 'Z');
  } else if (drag.kind === 'link') {
    const a = vp(B.nodes[drag.from]), hit = nodeAt(p, drag.from), q = hit ? vp(B.nodes[hit]) : p;
    $('temp').setAttribute('d', 'M' + a.x + ' ' + a.y + 'L' + q.x + ' ' + q.y);
    nodesEl.querySelectorAll('.node.drop').forEach(n => n.classList.remove('drop')); if (hit && elById.get(hit)) elById.get(hit).classList.add('drop');
  }
});
let lastTap = { id: null, t: 0 };
function tapNode(id) { if (pathFrom && pathFrom !== id && B.nodes[id] && B.nodes[id].kind !== 'note') { const a = pathFrom; pathFrom = null; viewPath(a, id); return; } select({ kind: 'node', id }); }
function endPtr(e) {
  if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId);
  if (pinch) { if (ptrs.size < 2) pinch = null; drag = null; return; }
  if (!drag || drag.pid !== e.pointerId) return;
  const d = drag; drag = null; clearTemp();
  if (e.type === 'pointercancel') { if (d.kind === 'node' && d.moved) commit(); return; }
  if (d.kind === 'lasso') { if (d.moved && d.pts.length > 2) { setMulti(Object.values(B.nodes).filter(n => !offK(n) && inPoly(n.x, n.y, d.pts)).map(n => n.id)); if (sel) select(null); } else if (multi.size) setMulti([]); return; }
  if (d.kind === 'vnode') { if (!d.moved) tapNode(d.nid); else if (VIEW && VIEW.kind === 'gweb') commit({ light: true }); }
  else if (d.kind === 'node') { if (d.moved) { sel = { kind: 'node', id: d.nid }; commit(); } else tapNode(d.nid); }
  else if (d.kind === 'link') {
    if (d.moved) { const hit = nodeAt(toWorld(e.clientX, e.clientY), d.from); if (hit) createLink(d.from, hit); }
    else if (d.tap) { if (pendingSrc && pendingSrc !== d.from) createLink(pendingSrc, d.from); else { pendingSrc = pendingSrc === d.from ? null : d.from; renderNodes(); if (pendingSrc) toast('Now tap the unit to tie ' + nm(d.from) + ' to'); } }
    else select({ kind: 'node', id: d.from });
  }
  else if (d.kind === 'edge' && /^bx:/.test(d.lid)) { if (!d.moved) select({ kind: 'bundle', id: d.lid }); }
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
  if (!rdrag.on) { if (Math.hypot(e.clientX - rdrag.sx, e.clientY - rdrag.sy) < 7) return; rdrag.on = true; const en = ENT[rdrag.k]; g.innerHTML = picHTML({ t: en.t, img: en.img, ip: en.ip, ini: initials(en.n) }); g.hidden = false; }
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
  if (B.nodes[k] && pathFrom && pathFrom !== k) tapNode(k); else if (B.nodes[k]) { select({ kind: 'node', id: k }); centreOn(k); } else addEntries([k]);
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
  if (e.target.closest('[data-gsecret]')) { const l = B.links[e.target.closest('[data-gsecret]').dataset.gsecret]; if (l) { if (l.secret) delete l.secret; else l.secret = true; } return commit(); }
  if (e.target.closest('[data-unlink]')) { delete B.links[e.target.closest('[data-unlink]').dataset.unlink]; return commit(); }
  if (b.dataset.ltype) return setLink({ type: b.dataset.ltype });
  if (b.dataset.ldir) return setLink({ dir: b.dataset.ldir });
  if (b.dataset.lstr) return setLink({ s: +b.dataset.lstr });
  if (b.dataset.unlink) { e.stopPropagation(); delete B.links[b.dataset.unlink]; return commit(); }
  if (b.dataset.gk) { B.nodes[sel.id].gk = b.dataset.gk; return commit(); }
  if (b.dataset.gcol) { B.nodes[sel.id].col = +b.dataset.gcol; delete B.nodes[sel.id].hex; return commit(); }
  if (b.dataset.link) { select({ kind: 'link', id: b.dataset.link }); return; }
  if (b.dataset.evunref) { const ev = sel && B.events && B.events[sel.id]; if (ev) { ev.refs = ev.refs.filter(r => r !== b.dataset.evunref); commit(); } return; }
  if (b.dataset.evcol) { const ev = sel && B.events && B.events[sel.id]; if (ev) { ev.col = +b.dataset.evcol; commit(); } return; }
  if (b.dataset.ev) { selectEvent(b.dataset.ev); return; }
  if (b.dataset.node) { select({ kind: 'node', id: b.dataset.node }); if ((!VIEW || VIEW.pos[b.dataset.node]) && !offK(B.nodes[b.dataset.node])) centreOn(b.dataset.node); return; }
  if (b.dataset.notecol) { B.nodes[sel.id].color = b.dataset.notecol; return commit(); }
  act(b.dataset.act);
}
$('inspector').addEventListener('click', panelClick);
$('linkpop').addEventListener('click', panelClick);
$('linkpop').addEventListener('pointerdown', e => { if (editing) e.preventDefault(); });
$('banner').addEventListener('click', e => { const b = e.target.closest('button'); if (b) act(b.dataset.act); });
$('inspector').addEventListener('input', e => {
  const t = e.target;
  if (/^pick(Grp|Unit|Ev)$/.test(t.id)) { pickSel = 0; pickList(t); return; }
  { const ev = sel && sel.kind === 'event' && B.events && B.events[sel.id]; if (ev && /^ev(Title|When|Text)$/.test(t.id)) { ev[t.id === 'evTitle' ? 'title' : t.id === 'evWhen' ? 'when' : 'text'] = t.value; if (t.id !== 'evText') renderTimeline(); saveLocalSoon(); return; } }
  if (t.id === 'insLabel' && sel && B.links[sel.id]) { B.links[sel.id].label = t.value; drawEdges(); }
  else if (t.id === 'insNote' && sel && B.nodes[sel.id]) B.nodes[sel.id].note = t.value;
});
$('inspector').addEventListener('change', e => {
  const t = e.target, n = sel && sel.kind === 'node' && B.nodes[sel.id];
  if (/^pick(Grp|Unit|Ev)$/.test(t.id)) return;
  if (/^ev(Title|When|Text)$/.test(t.id)) { const ev = sel && B.events && B.events[sel.id]; if (ev) { ev.title = ev.title.trim(); ev.when = ev.when.trim(); } commit({ light: true }); renderTimeline(); return; }
  if (t.id === 'insLabel' && sel && B.links[sel.id]) { B.links[sel.id].label = t.value.trim(); return commit({ light: true }); }
  if (t.id === 'insNote') return commit({ light: true });
  if (t.id === 'insSecret') return setLink({ secret: t.checked });
  if (!n) return;
  if (t.id === 'gParent') { if (t.value) n.parent = t.value; else delete n.parent; return commit(); }
  if (t.id === 'cNick') { const v = t.value.trim(); if (v && v !== info(Object.assign({}, n, { nick: '' })).gname) n.nick = v; else delete n.nick; } else if (t.id === 'cName') n.name = t.value.trim() || 'Unnamed'; else if (t.id === 'cSub') n.sub = t.value.trim(); else if (t.id === 'cShape') n.shape = t.value; else if (t.id === 'cFaction') n.faction = t.value; else if (t.id === 'cRace') { if (t.value) n.race = t.value; else delete n.race; } else return;
  commit();
});

/* THE PICK LIST (2026-11-21, mondo: "typing the name of a character to add them to a place/group does not seem to be working"):
   the browser's own datalist only matches the start of a word, so a unit with a story name ("Madame Zora (Fortune Teller (F))") never
   came up for "fortune". Our own list: every word typed may sit anywhere in the name, the game name or the race key. */
const pnorm = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function pickText(v) { const p = PICK.get(v) || {}, n = p.id && B.nodes[p.id], e = p.e && ENT[p.e]; let x = v;
  if (n && n.kind !== 'note') { const o = info(n); x += ' ' + (o.gname || '') + ' ' + (n.race || '') + ' ' + (n.cast || ''); }
  if (e) x += ' ' + e.n + ' ' + (e.r ? e.r.k : e.c ? e.c.id : ''); return pnorm(x); }
let pickSel = 0;
function pickList(t) {
  const box = t.closest('label') && t.closest('label').nextElementSibling; if (!box || !box.classList.contains('pickl')) return;
  const q = pnorm(t.value), ws = q ? q.split(' ') : [];
  const hits = [...PICK.keys()].map(v => { const tx = pickText(v), lv = pnorm(v); if (!ws.every(w => tx.includes(w))) return null; return { v, r: !q ? 3 : lv.startsWith(q) ? 0 : ws.every(w => (' ' + tx).includes(' ' + w)) ? 1 : 2 }; }).filter(Boolean)
    .sort((a, b) => a.r - b.r || a.v.localeCompare(b.v)).slice(0, 60);
  pickSel = clamp(pickSel, 0, Math.max(0, hits.length - 1));
  box.innerHTML = hits.length ? hits.map((h, i) => '<div class="po' + (i === pickSel ? ' on' : '') + '" role="option" data-pv="' + esc(h.v) + '">' + esc(h.v) + '</div>').join('') : '<div class="po none">No match</div>';
  const was = box.hidden; box.hidden = false; if (was) box.scrollIntoView({ block: 'nearest' }); const on = box.querySelector('.po.on'); if (on) on.scrollIntoView({ block: 'nearest' });
}
function pickTake(t, v) { t.value = v; const box = t.closest('label').nextElementSibling; if (box) box.hidden = true; if (t.id === 'pickEv') evPickChosen(t); else pickChosen(t); }
$('inspector').addEventListener('focusin', e => { if (/^pick(Grp|Unit|Ev)$/.test(e.target.id)) { pickSel = 0; pickList(e.target); } });
$('inspector').addEventListener('focusout', e => { if (/^pick(Grp|Unit|Ev)$/.test(e.target.id)) { const t = e.target; setTimeout(() => { const box = t.closest('label') && t.closest('label').nextElementSibling; if (box && document.activeElement !== t) box.hidden = true; }, 150); } });
$('inspector').addEventListener('keydown', e => { const t = e.target; if (!/^pick(Grp|Unit|Ev)$/.test(t.id)) return; const box = t.closest('label').nextElementSibling, n = box ? box.querySelectorAll('.po[data-pv]').length : 0;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); pickSel = clamp(pickSel + (e.key === 'ArrowDown' ? 1 : -1), 0, Math.max(0, n - 1)); pickList(t); }
  else if (e.key === 'Enter') { e.preventDefault(); const on = box && box.querySelector('.po.on[data-pv]'); if (on) pickTake(t, on.dataset.pv); }
  else if (e.key === 'Escape') { if (box) box.hidden = true; e.stopPropagation(); } });
$('inspector').addEventListener('mousedown', e => { const o = e.target.closest('.po[data-pv]'); if (!o) return; e.preventDefault(); const box = o.closest('.pickl'), t = box.previousElementSibling.querySelector('input'); pickTake(t, o.dataset.pv); });

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
    if (dlCap) { try { await dlCap.save({ filename: name, data: text }); toast('Saved ' + name); return; } catch (e) { if (e && e.code === 'declined') return toast('Save cancelled'); } }
  }
  /* no downloads capability here (the page opened on its own, outside the viewer): an ordinary browser download */
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Saved ' + name); } catch (e) { toast('Could not save the file. Use Copy instead.'); }
}
function copyText(ta) { const done = () => toast('Copied'); const fb = () => { ta.focus(); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('Select the text and copy it'); } }; try { navigator.clipboard.writeText(ta.value).then(done, fb); } catch (e) { fb(); } }
const stamp = () => new Date().toISOString().slice(0, 10);
function backupJSON() { return JSON.stringify({ app: 'ew-relationship-web', v: 1, exported: new Date().toISOString(), order: S.order, boards: S.boards }); }
/* the export shaped for data.js: race keys exactly as in AVAILABLE_RACES */
function gameExport(all) {
  const boards = all ? S.order.map(id => S.boards[id]).filter(b => !b.sample) : [B];
  /* a reference: race key and gender kept apart; story characters by their own id in the game data */
  const ref = (b, id) => { const n = b.nodes[id];
    if (n.kind === 'race') { const r = RACE[n.race], g = r.v.length > 1 ? n.g : r.v[0].g; return { key: r.v.length > 1 ? n.race + ':' + g : n.race, kind: 'race', race: n.race, gender: g }; }
    if (n.kind === 'cast') { const c = CAST[n.cast]; return { key: 'character:' + c.id, kind: 'character', id: c.id, race: c.race || null, gender: c.g || null }; }
    return { key: 'custom:' + n.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), kind: 'custom', race: null, gender: null }; };
  const out = { _about: 'Entropy Wars relationship web. `race` values match AVAILABLE_RACES and `gender` is separate (male / female). Story characters are listed in `characters` under their own id from the game data (DOOR_CAST, BOSS_DEFS, the tutorial tape) and referenced as character:<id>. Custom characters are custom:<name>, listed in `custom`. `names` holds the story name given to a race or character on the board (key -> name). `from` is the one who acts, `to` the one acted on.', version: 2, exported: new Date().toISOString(), boards: boards.map(b => b.name),
    types: Object.fromEntries(TYPES.map(t => [t.id, { effect: t.fx || 'none', means: t.fx ? FX_NOTE[t.fx] : 'no effect on who joins a fight' }])), relations: [], defence: {}, groups: {}, boardGroups: {}, motives: {}, names: {}, characters: {}, custom: {} };
  const D2 = out.defence, adj = {};
  const side = (o, p, r) => { o[p] = r.kind === 'race' ? r.race : r.key; o[p + 'Kind'] = r.kind; o[p + 'Gender'] = r.gender; return o; };
  boards.forEach(b => {
    Object.values(b.nodes).forEach(n => { if (n.kind === 'note') return; const r = ref(b, n.id);
      if (n.kind === 'custom') out.custom[r.key] = { name: n.name, title: n.sub || '', kind: n.shape, type: n.faction || null, portraitRace: n.race || null };
      if (n.kind === 'cast') { const c = CAST[n.cast]; out.characters[c.id] = { name: c.raw, title: c.title || '', source: c.grp === 'cast' ? 'DOOR_CAST' : c.grp === 'boss' ? 'BOSS_DEFS' : 'TUTORIAL_LESSONS', race: c.race || null, gender: c.g || null }; }
      if (n.nick) out.names[r.key] = n.nick;
      if (n.note) (out.motives[r.key] = out.motives[r.key] || []).push(n.note); });
    Object.values(b.links).forEach(l => {
      const at = actorTarget(l), f = ref(b, at[0]), t = ref(b, at[1]);
      if (l.type === 'member') { const g = out.boardGroups[t.key] = out.boardGroups[t.key] || { name: b.nodes[l.b].name, kind: gkOf(b.nodes[l.b]), members: [], secretMembers: [] }; const ls = l.secret ? g.secretMembers : g.members; if (!ls.includes(f.key)) ls.push(f.key); return; }
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
  out.events = []; boards.forEach(b => Object.values(b.events || {}).sort((x, y) => x.t - y.t).forEach(ev => out.events.push({ title: ev.title, when: ev.when, what: ev.text, board: b.name, links: ev.refs.filter(id => b.nodes[id]).map(id => isGrp(b.nodes[id]) ? (gkOf(b.nodes[id]) === 'faction' ? 'faction:' : 'place:') + b.nodes[id].name : ref(b, id).key) })));
  /* allied / family components between races, in the shape of HQ_NPC_TEMPERS.groups (race keys, as there) */
  const seen = new Set();
  Object.keys(adj).sort().forEach(k => { if (seen.has(k)) return; const comp = [], st = [k]; while (st.length) { const c = st.pop(); if (seen.has(c)) continue; seen.add(c); comp.push(c); adj[c].forEach(x => st.push(x)); } if (comp.length > 1) out.groups['web_' + comp.sort()[0].replace(/[^a-z0-9]+/g, '_')] = comp; });
  return out;
}
function act(a) {
  if (VIEW && /^arr/.test(a)) closeView();
  switch (a) {
    case 'closeIns': $('inspector').classList.remove('open'); break;
    case 'delSel': removeSel(); break;
    case 'swapLink': { const l = sel && B.links[sel.id]; if (l) { const x = l.a; l.a = l.b; l.b = x; commit(); } break; }
    case 'editLabel': if (sel) startEdit(sel.id); break;
    case 'tieFrom': linkMode = true; groupMode = false; pendingSrc = sel.id; $('inspector').classList.remove('open'); renderNodes(); renderOverlays(); toast('Now tap the unit to tie ' + nm(sel.id) + ' to'); break;
    case 'goMain': switchBoard(S.boards.main ? 'main' : (S.order.find(id => !S.boards[id].sample) || S.order[0])); if (B.sample) newBoard('Main board'); break;
    case 'newBoard': newBoard('Board ' + (S.order.length + 1)); act('renameBoard'); break;
    case 'dupBoard': newBoard(B.name + ' copy', B); break;
    case 'gameBoard': gameBoard(); break;
    case 'renameBoard': modal('<h2>Name this board</h2><input class="inp" id="mName" maxlength="80" autofocus value="' + esc(B.name) + '"><div class="acts"><button class="btn" data-x="cancel">Cancel</button><button class="btn pri" data-x="ok">Save name</button></div>', d => { const ok = () => { const v = $('mName').value.trim(); if (v && v !== B.name) { B.name = v; delete B.sample; commit(); } closeModal(); }; d.addEventListener('click', e => { const x = e.target.dataset.x; if (x === 'ok') ok(); else if (x === 'cancel') closeModal(); }); $('mName').addEventListener('keydown', e => { if (e.key === 'Enter') ok(); }); $('mName').select(); }); break;
    case 'delBoard': { const n = Object.keys(B.nodes).length; modal('<h2>Delete “' + esc(B.name) + '”?</h2><p>' + (n ? 'Its ' + n + ' pinned items and ' + Object.keys(B.links).length + ' ties go with it. ' : '') + 'Undo brings it back until you close the page.</p><div class="acts"><button class="btn" data-x="cancel" autofocus>Keep it</button><button class="btn pri" data-x="ok">Delete board</button></div>', d => d.addEventListener('click', e => { const x = e.target.dataset.x; if (x === 'ok') { closeModal(); deleteBoard(B.id); } else if (x === 'cancel') closeModal(); })); break; }
    case 'arrGroups': sortGroups(); break;
    case 'evNew': newEvent(sel && sel.kind === 'node' && B.nodes[sel.id] ? [sel.id] : sel && sel.kind === 'event' && B.events[sel.id] ? B.events[sel.id].refs.slice() : []); break;
    case 'evEarlier': if (sel) evMove(sel.id, -1); break; case 'evLater': if (sel) evMove(sel.id, 1); break;
    case 'evShow': { const ev = sel && B.events && B.events[sel.id]; if (ev) evFit(ev); break; }
    case 'vGweb': openGweb(); break;
    case 'vFocus': if (sel) viewFocus(sel.id, VIEW && VIEW.kind === 'focus' ? VIEW.hops : 1); break;
    case 'vPath': if (sel) { pathFrom = sel.id; $('inspector').classList.remove('open'); toast('Now tap the unit to find the way to'); } break;
    case 'vZones': viewZones(); break; case 'vCommand': viewTree('command'); break; case 'vFamily': viewTree('family'); break;
    case 'arrMap': mapToggle(); break;
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
$('orgSeg').addEventListener('click', e => { const b = e.target.closest('[data-org]'); if (b) setOrg(b.dataset.org); });
/* ───────── THE GAME'S MAP (2026-11-18): every zone, district and Disaster City plot as a ready place group, the world map beside them ───────── */
const PL = D.places || { zones: [], world: null };
const TERR = { coast: '#9cc9e0', snow: '#f1f4f6', mountain: '#a39b8f', grass: '#a9c98c', forest: '#5d8d59', scrub: '#c3b585', mesa: '#c38c5e', desert: '#e2cf98' };
function hueCol(hex) { const v = parseInt(hex.slice(1), 16), r = (v >> 16) / 255, g = (v >> 8 & 255) / 255, b = (v & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const hue = c => { if (c.mx === c.mn) return -1; let h = c.mx === c.r ? (c.g - c.b) / (c.mx - c.mn) : c.mx === c.g ? 2 + (c.b - c.r) / (c.mx - c.mn) : 4 + (c.r - c.g) / (c.mx - c.mn); return (h * 60 + 360) % 360; };
  const me = { r, g, b, mx, mn }; if (mx - mn < .12) return 11; const h = hue(me); let best = 0, bd = 999;
  GCOL.forEach((c, i) => { if (i === 11) return; const w = parseInt(c.slice(1), 16), q = { r: (w >> 16) / 255, g: (w >> 8 & 255) / 255, b: (w & 255) / 255 }; q.mx = Math.max(q.r, q.g, q.b); q.mn = Math.min(q.r, q.g, q.b); const d = Math.min(Math.abs(hue(q) - h), 360 - Math.abs(hue(q) - h)); if (d < bd) { bd = d; best = i; } }); return best; }
const placeSrc = (z, dk, pn) => 'map:' + z.k + (dk != null ? ':' + dk : '') + (pn != null ? ':' + pn : '');
/* a place already on the board: the same map place, or a place group of his with the same name ("Sewers" = "The Sewers", "Came A Lot" = "Came A Lot Kingdom") */
const pwords = t => String(t).toLowerCase().replace(/^the\s+/, '').split(/\s+/).map(w => w.replace(/[^a-z0-9+]+/g, '')).filter(Boolean);
const psame = (x, y) => { const a = pwords(x), b = pwords(y), [s1, l1] = a.length <= b.length ? [a, b] : [b, a]; return s1.length > 0 && s1.every((w, i) => w === l1[i]) && l1.length - s1.length <= 1 && !l1.slice(s1.length).includes('+') && s1.join('').length >= 4; };
const subOf = (z, d) => d && d.s && z.s ? z.s.find(s => s.k === d.s) : null;
/* THE ZONES' OWN PARTS (2026-11-19, mondo: "how am i supposed to know if thats in heaven or hell or the vatican? They should just already
   be in their correct area"): a district from the map that sits right in its zone, in a zone with parts (Heaven + Hell + Vatican, Outer
   Space), moves into its part: his own Heaven / Hell / Vatican group when there is one, else a new one. Once a board (pfix). Nothing is deleted. */
function repairPlaces(b) {
  if (b.pfix >= 1 || !PL.zones.length) return false;
  const G = Object.values(b.nodes).filter(n => n.kind === 'custom' && n.shape === 'group'), bySrc = src => G.find(n => n.src === src); let ch = false;
  PL.zones.forEach(z => { if (!z.s) return; const zg = bySrc('map:' + z.k);
    z.s.forEach(s => {
      const ds = s.d.map(k => bySrc('map:' + z.k + ':' + k)).filter(g => g && (!g.parent || (zg && g.parent === zg.id))); if (!ds.length) return;
      let sg = bySrc('map:' + z.k + ':@' + s.k) || G.find(n => !n.src && n.gk !== 'faction' && psame(n.name, s.n));
      if (!sg) { sg = { id: 'pz_' + z.k + '_' + s.k, kind: 'custom', name: s.n, sub: '', shape: 'group', col: hueCol(z.c), gk: 'place', faction: '', x: Math.round(ds.reduce((t, g) => t + g.x, 0) / ds.length), y: Math.round(ds.reduce((t, g) => t + g.y, 0) / ds.length) - 60, note: '' }; b.nodes[sg.id] = sg; G.push(sg); }
      sg.src = 'map:' + z.k + ':@' + s.k; if (!sg.parent && zg && zg.id !== sg.id) sg.parent = zg.id;
      ds.forEach(g => { if (g.id !== sg.id) { g.parent = sg.id; ch = true; } });
    }); });
  b.pfix = 1; return ch;
}
function placeOnBoard(src, name) { return Object.values(B.nodes).find(n => isGrp(n) && n.src === src) || Object.values(B.nodes).find(n => isGrp(n) && !n.src && gkOf(n) === 'place' && psame(n.name, name)); }
function addPlace(src, name, hex, parentId) {
  let g = placeOnBoard(src, name);
  if (g) { g.src = src; if (parentId && !parentOf(g) && parentId !== g.id) g.parent = parentId; return g.id; }
  const par = parentId && B.nodes[parentId], p = freeSpot(par ? { x: par.x + 160, y: par.y + 120 } : viewCentre(), takenList()), id = uid('c');
  B.nodes[id] = { id, kind: 'custom', name: String(name).slice(0, 40), sub: '', shape: 'group', col: hueCol(hex), gk: 'place', faction: '', x: p.x, y: p.y, note: '', src };
  if (parentId) B.nodes[id].parent = parentId; return id;
}
function addFromMap(zk, dk, pn, withKids) {
  const z = PL.zones.find(q => q.k === zk); if (!z) return;
  const zid = addPlace(placeSrc(z), z.n, z.c, null); let last = zid;
  const addS = s => addPlace('map:' + z.k + ':@' + s.k, s.n, z.c, zid);
  const addD = d => { const s = subOf(z, d), did = addPlace(placeSrc(z, d.k), d.n, d.c, s ? addS(s) : zid); last = did; return did; };
  if (dk == null) { if (withKids) z.d.forEach(addD); }
  else if (dk[0] === '@') { const s = (z.s || []).find(q => '@' + q.k === dk); if (!s) return; last = addS(s); if (withKids) { z.d.filter(d => d.s === s.k).forEach(addD); last = addS(s); } }
  else { const d = z.d.find(q => q.k === dk); if (!d) return; const did = addD(d); if (pn != null) last = addPlace(placeSrc(z, d.k, pn), pn, d.c, did); else if (withKids) d.p.forEach(n => addPlace(placeSrc(z, d.k, n), n, d.c, did)); }
  commit(); return last;
}
function mapHTML() {
  const on = (src, n) => !!placeOnBoard(src, n), btn = (on2, a) => on2 ? '<span class="pon">on board</span>' : '<button class="btn sm" ' + a + '>Add</button>';
  return PL.zones.map(z => '<div class="pz" data-z="' + esc(z.k) + '"><div class="pzh"><i style="--gc:' + z.c + '"></i><button class="pzn" data-zopen="' + esc(z.k) + '">' + esc(z.n) + '</button>' + btn(on(placeSrc(z), z.n), 'data-padd="' + esc(z.k) + '"') + (z.d.length ? '<button class="btn sm" data-paddall="' + esc(z.k) + '">Add with ' + z.d.length + ' districts</button>' : '') + '</div>' +
    '<div class="pzd"' + (mapOpen === z.k ? '' : ' hidden') + '>' + (z.s || []).concat([null]).map(s => { const ds = z.d.filter(d => s ? d.s === s.k : !(z.s || []).some(q => q.k === d.s)); return (s ? '<div class="pd psub"><div class="pdh"><span><b>' + esc(s.n) + '</b></span>' + btn(on('map:' + z.k + ':@' + s.k, s.n), 'data-padd="' + esc(z.k) + '" data-pd="@' + esc(s.k) + '"') + '<button class="btn sm" data-paddall="' + esc(z.k) + '" data-pd="@' + esc(s.k) + '">Add with ' + ds.length + ' districts</button></div></div>' : '') + ds.map(d => '<div class="pd' + (s ? ' pin' : '') + '"><div class="pdh"><span>' + esc(d.n) + '</span>' + btn(on(placeSrc(z, d.k), d.n), 'data-padd="' + esc(z.k) + '" data-pd="' + esc(d.k) + '"') + (d.p.length ? '<button class="btn sm" data-paddall="' + esc(z.k) + '" data-pd="' + esc(d.k) + '">Add with ' + d.p.length + ' places</button>' : '') + '</div>' +
      (d.p.length ? '<div class="pps">' + d.p.map(n => on(placeSrc(z, d.k, n), n) ? '<span class="pp on">' + esc(n) + '</span>' : '<button class="pp" data-padd="' + esc(z.k) + '" data-pd="' + esc(d.k) + '" data-pp="' + esc(n) + '">' + esc(n) + '</button>').join('') + '</div>' : '') + '</div>').join(''); }).join('') + '</div></div>').join('');
}
let mapOpen = null;
/* the Places-from-the-game map: 7 canvas pixels a square (was 5, drawn 465 px wide: "the map is really small", 11-22) */
const MAP_S = 7;
function drawWorld(cv) {
  const W = PL.world; if (!W || !cv) return; const S = MAP_S, x = cv.getContext('2d'); cv.width = W.w * S; cv.height = W.h * S;
  x.fillStyle = '#dfe4de'; x.fillRect(0, 0, cv.width, cv.height);
  W.g.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const t = W.key[row[i]]; x.fillStyle = TERR[t] || '#dfe4de'; x.fillRect(i * S, j * S, S, S); } });
  x.font = '600 13px system-ui, sans-serif'; x.textAlign = 'center';
  const placed = [], hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  PL.zones.forEach(z => { if (!z.at) return; const px = (z.at[0] - W.x0) * S, py = (z.at[1] - W.y0) * S; x.beginPath(); x.arc(px, py, mapOpen === z.k ? 9 : 6, 0, Math.PI * 2); x.fillStyle = z.c; x.fill(); x.lineWidth = 2; x.strokeStyle = '#1b2421'; x.stroke(); placed.push({ x: px - 7, y: py - 7, w: 14, h: 14 }); });
  PL.zones.forEach(z => { if (!z.at) return; const px = (z.at[0] - W.x0) * S, py = (z.at[1] - W.y0) * S, tw = x.measureText(z.n).width + 8;
    const tries = [[-tw / 2, 10], [-tw / 2, -27], [11, -8], [-tw - 11, -8], [-tw / 2, 29], [-tw / 2, -46], [11, 11], [-tw - 11, 11], [11, -27], [-tw - 11, -27]].map(o => ({ x: px + o[0], y: py + o[1], w: tw, h: 17 }));
    const r = tries.find(t => !placed.some(q => hit(t, q))) || tries[0]; placed.push(r);
    x.fillStyle = mapOpen === z.k ? '#1b2421' : 'rgba(255,255,255,.88)'; x.fillRect(r.x, r.y, r.w, r.h); x.fillStyle = mapOpen === z.k ? '#fff' : '#1b2421'; x.fillText(z.n, r.x + r.w / 2, r.y + 13); });
}
function openMap() {
  const off = PL.zones.filter(z => !z.at);
  modal('<h2>Places from the game</h2><div class="mapwrap"><div class="mapside"><canvas id="worldMap"></canvas>' + (off.length ? '<div class="prow offmap">' + off.map(z => '<button class="gchip sm" style="--gc:' + z.c + ';color:#1b2421" data-zopen="' + esc(z.k) + '">' + esc(z.n) + '</button>').join('') + '</div>' : '') + '</div><div class="maplist" id="mapList">' + mapHTML() + '</div></div><div class="acts"><button class="btn pri" data-x="cancel">Done</button></div>', d => {
    d.classList.add('wide'); drawWorld($('worldMap'));
    const redraw = () => { const sc = $('mapList').scrollTop; $('mapList').innerHTML = mapHTML(); $('mapList').scrollTop = sc; drawWorld($('worldMap')); };
    const show = k => { mapOpen = mapOpen === k ? null : k; redraw(); const row = d.querySelector('.pz[data-z="' + k + '"]'); if (row && mapOpen) row.scrollIntoView({ block: 'nearest' }); };
    $('worldMap').addEventListener('click', e => { const W = PL.world, r = e.target.getBoundingClientRect(), sx = e.target.width / r.width, mx = (e.clientX - r.left) * sx, my = (e.clientY - r.top) * sx; let best = null, bd = 40; PL.zones.forEach(z => { if (!z.at) return; const dd = Math.hypot((z.at[0] - W.x0) * MAP_S - mx, (z.at[1] - W.y0) * MAP_S - my); if (dd < bd) { bd = dd; best = z.k; } }); if (best) show(best); });
    d.addEventListener('click', e => {
      const o = e.target.closest('[data-zopen]'); if (o) return show(o.dataset.zopen);
      const a = e.target.closest('[data-padd],[data-paddall]'); if (!a) { if (e.target.closest('[data-x]')) closeModal(); return; }
      const all = a.hasAttribute('data-paddall'), zk = a.dataset.padd || a.dataset.paddall, id = addFromMap(zk, a.dataset.pd != null ? a.dataset.pd : null, a.dataset.pp != null ? a.dataset.pp : null, all);
      if (id) { const n = B.nodes[id]; toast(n.name + ' is on the board'); } redraw();
    });
  });
}
$('btnMap').addEventListener('click', openMap);
/* Show or hide the world map (11-22): hiding hides it; showing brings up whatever it needs: the Places layout, out of the group web,
   and a sort into groups by places when the board was never laid on the map */
function mapToggle() {
  if (!PL.world) return toast('No world map in this build');
  if (!$('bgMap').hidden) { B.mapHide = true; commit(); return; }
  delete B.mapHide;
  if (VIEW && VIEW.kind === 'gweb') closeView();
  if (orgK() !== 'place') setOrg('place');
  if (!(B.mapK > 0)) { sortGroups(); if (!(B.mapK > 0)) return toast('Put at least three places from the map on the board'); return; }
  commit(); fit();
}
/* the world map under a board sorted by places (B.mapK = board pixels a map square) */
let bgDrawn = false;
function renderMapBg() {
  /* 11-22 fix (mondo: "show/hide the world map isn't working; the map is really small"): `k` used to end in the view test, so it was
     `true`, not the scale, and the map drew 1 board pixel a square (93 px under a 5,000 px board), too small to see shown or hidden */
  const cv = $('bgMap'), W = PL.world, on = W && orgK() === 'place' && !B.mapHide && B.mapK > 0 && !(VIEW && VIEW.kind === 'gweb'), k = on ? +B.mapK : 0; if (!cv) return;
  cv.hidden = !on; if (!on) return;
  if (!bgDrawn) { const S = 4, x = cv.getContext('2d'); cv.width = W.w * S; cv.height = W.h * S; x.fillStyle = '#dfe4de'; x.fillRect(0, 0, cv.width, cv.height);
    W.g.forEach((row, j) => { for (let i = 0; i < row.length; i++) { x.fillStyle = TERR[W.key[row[i]]] || '#dfe4de'; x.fillRect(i * S, j * S, S, S); } }); bgDrawn = true; }
  cv.style.width = W.w * k + 'px'; cv.style.height = W.h * k + 'px';
}
$('btnGroupNode').addEventListener('click', () => {
  modal('<h2>Add a group</h2><label class="field"><span>Name</span><input class="inp" id="mName" maxlength="40" autofocus placeholder="The Circus"></label><div class="seg" id="mGk"><button data-gk="place"' + (orgK() === 'place' ? ' class="on"' : '') + '>Place</button><button data-gk="faction"' + (orgK() === 'faction' ? ' class="on"' : '') + '>Faction</button></div><div class="gsw" id="mCol">' + GCOL.map((c, i) => '<button data-col="' + i + '"' + (i ? '' : ' class="on"') + ' style="--gc:' + c + '" aria-label="Colour ' + (i + 1) + '"></button>').join('') + '</div><div class="acts"><button class="btn" data-x="cancel">Cancel</button><button class="btn pri" data-x="ok">Pin to board</button></div>', d => {
    let col = Object.values(B.nodes).filter(isGrp).length % GCOL.length, gk = orgK(); [...$('mCol').children].forEach((c, i) => c.classList.toggle('on', i === col));
    const ok = () => { const name = $('mName').value.trim(); if (!name) { $('mName').focus(); return; } const id = uid('c'), p = freeSpot(viewCentre(), takenList()); B.nodes[id] = { id, kind: 'custom', name, sub: '', shape: 'group', col, gk, faction: '', x: p.x, y: p.y, note: '' }; sel = { kind: 'node', id }; closeModal(); commit(); };
    d.addEventListener('click', e => { const k = e.target.closest('[data-gk]'); if (k) { gk = k.dataset.gk; [...$('mGk').children].forEach(x => x.classList.toggle('on', x === k)); return; } const c = e.target.closest('[data-col]'); if (c) { col = +c.dataset.col; [...$('mCol').children].forEach((x, i) => x.classList.toggle('on', i === col)); return; } const x = e.target.dataset.x; if (x === 'ok') ok(); else if (x === 'cancel') closeModal(); }); d.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') ok(); });
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
  if (ST.open) return;   // THE STORY PLANNER has its own keys
  const typing = /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''));
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
  if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return; }
  if (typing || mod || e.altKey) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { if (sel) { e.preventDefault(); removeSel(); } }
  else if (e.key === 'Escape') { closeMenus(); if (multi.size) setMulti([]); else if (linkMode || pendingSrc) { linkMode = false; pendingSrc = null; renderNodes(); renderOverlays(); } else if (pathFrom) { pathFrom = null; toast('Path search off'); } else if (sel) select(null); else if (VIEW) closeView(); }
  else if (e.key === 'l' || e.key === 'L') $('btnLink').click();
  else if (e.key === 'g' || e.key === 'G') $('btnGroup').click();
  else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); addNote(); }
  else if (e.key === 't' || e.key === 'T') $('btnTl').click();
  else if (e.key === 'w' || e.key === 'W') $('btnGweb').click();
  else if (e.key === 'f' || e.key === 'F') fit();
  else if (e.key === '/') { e.preventDefault(); $('roster').classList.add('open'); $('q').focus(); }
  else if (e.key === 'Enter' && sel && sel.kind === 'link') { e.preventDefault(); startEdit(sel.id); }
});
window.addEventListener('resize', () => { positionPop(); });
window.addEventListener('pagehide', saveLocal);
document.addEventListener('visibilitychange', () => { if (document.hidden) { saveLocal(); if (cloud.db && (cloud.dirty.size || cloud.idx || cloud.story)) { clearTimeout(cloud.timer); flush(); } } });

/* ═════════ THE STORY PLANNER (2026-11-22) ═════════
   mondo: "add a Chapter/Quest planner, where I can add chapters with multiple quests, and the game map on the screen so I can plan
   the route the player is meant to take and how the story will play out", then "make the planner easy for me to plan the quests"
   from the chapter-by-chapter plan (Rogers' Level Up!: the spine, the beat chart, enemies, mechanics, cutscenes).
   One plan for every board, saved as doc `story/plan` beside the boards (server /api/story-web, the same password).
   Three tabs: MAP (chapters + quests, the world painted from the game's own ground pictures, the route), BEAT CHART (the plan's
   table, built from the chapters, with what it notices + the mechanics' intro / repeat / combine grid + the seven questions),
   SPINE (the one-sheet, the six bands, every chapter's questions). Units are roster ids (r:<race>, s:<cast>), places are map refs
   ('hq', 'z:<zone>', 'd:<zone>:<district>'), so a plan does not hang on any one board. Nothing in the game reads it yet. */
const SD = D.story || { rooms: [], quests: [] };
const ST = { open: false, tab: 'map', sel: null, pick: null, at: 0, mapLayer: 'surface' };
const STEPS9 = ['1 · The hero wants something', '2 · Something disrupts their life', '3 · The hero tries to fix it', '4 · The attempt fails', '5 · A reversal makes it worse', '6 · A bigger problem', '7 · The final problem, the most at risk', '8 · The hero faces it and wins', '9 · The hero gets what they wanted'];
const GOALS = [['escape', 'Escape'], ['explore', 'Explore'], ['learn', 'Learn'], ['choice', 'Choice']];
const BANDS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
const MECHS = ['Board fight', 'Tapes', 'Doors', 'Door gun', 'Capture door', 'One-way door', 'Fire + water', 'Liquid flows downhill', 'Skating', 'Driving', 'Flying the ship', 'Moving platforms'];
const CHCOL = ['#ffd66b', '#ff8a5c', '#7fd98c', '#9fc2ff', '#ff7fbf', '#c8a2ff', '#5fe0d0', '#ffb84d', '#b9f27c', '#f0f0f0', '#ff5a5a', '#8fb0c4'];
/* the plan's questions (the chapter-by-chapter guide, word for word); `first` = the seven to answer first */
const SPINE_Q = [
  { h: 'The one-sheet (Chapter 4)', q: [['os1', 'In one sentence, what is Entropy Wars?', 1], ['os2', 'What are the three or four things a player should tell a friend about it?'], ['os3', 'How long should the full story be: rough hours, or number of chapters? DOOR_STORY plans six bands of two or three chapters each (12 to 18 chapters). Is that still right?'], ['os4', 'Is the public demo PvP only, or PvP plus the first quest?']] },
  { h: 'The story spine (Chapter 3)', q: [['sp1', 'Who sent the anonymous referral that got you hired, and why? The cast offers Locke, Glass, the Janitor and Dorian as candidates.', 1], ['sp2', 'What does DOOR collect entropy for? One reading of your notes is a thermostat (keep it level, as the Doorman wants). Yes, no, or something else?', 1], ['sp3', 'What is the final choice? Does the player choose open or closed at the end, and does that change the ending?', 1], ['sp4', "Who filed the false reports on your parents' deaths, and did the Doorman sign them?"], ['sp5', 'How do the newer ideas fit the cast-sheet story: August Tomorrow and the Chronocult, Dorian stealing the door gun from the future, the Black Cube and its overload, the Galactic Federation stepping in? Is the Black Cube overload the endgame threat?', 1], ['sp6', "The cast sheet says Elle Vator's faction is Money; project notes later list her as an Opener. Which is right?"], ['sp7', 'Which secrets should the player know before the characters do (suspense), and which should land as surprises?'], ['sp8', "Is Kit the catgirl race's story skin once you meet her, or her own locked unit?"]] },
  { h: 'The beat chart and the world (Chapter 9)', q: [['lv1', 'After the first quest, which zone is the first real mission? Which zones belong to bands L2 to L4, and which are late game?', 1], ['lv2', 'Are zones locked by rank (story order), or can the player walk anywhere and the story just points the way?'], ['lv3', 'Should the world map show locked zones greyed out, or hide them until they open?'], ['lv4', 'What is the weenie of each zone (the landmark you see from far away)?'], ['lv5', 'Are side quests in scope for the slice, or main line only for now?']] },
  { h: 'Enemies and bosses (Chapter 11)', q: [['en1', 'Who is the boss of each band? Dorian is surely the last. Who comes before him?'], ['en2', 'Do bosses keep the one-statline rule with no exception?'], ['en3', 'Should zone enemies come straight from the Relationship Web (who lives where), with the factions as squads?'], ['en4', 'Can some fights be won without a kill (talk a unit down, capture it, survive N rounds)?']] },
  { h: 'Mechanics, hazards, calm spots (Chapter 12)', q: [['me1', 'Which mechanic does each early chapter teach first? For example, is capture taught in chapter 2?'], ['me2', 'Should the skating, driving and ship flying be required by the story somewhere, or stay optional?'], ['me3', 'Which zone hazards matter in battle (ice, fire, deep water, the void), and which are scenery only?']] },
  { h: 'Cutscenes and the script (Chapter 16)', q: [['cs1', 'How long should a cutscene be at most? Scenes A to F are short. Is that the target?'], ['cs2', 'Should every cutscene be skippable, including the first time?'], ['cs3', 'Is voice acting ever planned, or subtitles only for good?'], ['cs4', 'Will you write every line yourself in the Cutscene Editor, or should I draft scenes (marked as drafts) for you to rewrite?', 1]] },
];
const SPINE_BY = {}; SPINE_Q.forEach(g => g.q.forEach(q => { SPINE_BY[q[0]] = q; }));
const BAND_F = [['trust', 'What DOOR trusts you with'], ['zone', 'Which zone opens'], ['lie', 'The lie you believe'], ['clue', 'The clue about your parents']];

/* ── the plan ── */
const sStr = (v, n) => String(v == null ? '' : v).slice(0, n);
const sIds = a => [...new Set((Array.isArray(a) ? a : []).map(x => String(x)).filter(x => ENT[x]))].slice(0, 60);
const sPt = p => p && Number.isFinite(+p.x) && Number.isFinite(+p.y) ? { x: +(+p.x).toFixed(2), y: +(+p.y).toFixed(2) } : null;
const sRef = r => typeof r === 'string' && /^(hq|z:[\w-]+|d:[\w-]+:[\w-]+)$/.test(r) ? r : '';
function sanitizePlan(p) {
  if (!p || typeof p !== 'object') return null;
  const o = { v: 1, t: num(p.t, 0), chapters: [], clues: [], ans: {}, bands: {} };
  (Array.isArray(p.chapters) ? p.chapters : []).slice(0, 60).forEach(c => {
    if (!c || !c.id) return;
    const ch = { id: sStr(c.id, 40), name: sStr(c.name, 80), col: clamp(Math.round(num(c.col, 0)), 0, CHCOL.length - 1), band: BANDS.includes(c.band) ? c.band : '', step: clamp(Math.round(num(c.step, 0)), 0, 9),
      goal: GOALS.some(g => g[0] === c.goal) ? c.goal : '', zone: sRef(c.zone), enemies: sIds(c.enemies), mech: [...new Set((Array.isArray(c.mech) ? c.mech : []).map(m => sStr(m, 40)).filter(Boolean))].slice(0, 20),
      boss: ENT[c.boss] ? c.boss : '', bossText: sStr(c.bossText, 120), reward: sStr(c.reward, 160), lie: sStr(c.lie, 300), trust: sStr(c.trust, 300), notes: sStr(c.notes, 4000), quests: [] };
    (Array.isArray(c.quests) ? c.quests : []).slice(0, 60).forEach(q => {
      if (!q || !q.id) return;
      ch.quests.push({ id: sStr(q.id, 40), name: sStr(q.name, 100), kind: q.kind === 'side' ? 'side' : 'main', where: sRef(q.where), at: sPt(q.at), ug: !!q.ug, summary: sStr(q.summary, 2000), game: sStr(q.game, 60),
        steps: (Array.isArray(q.steps) ? q.steps : []).slice(0, 40).map(s => ({ id: sStr(s && s.id || uid('s'), 40), text: sStr(s && s.text, 300), at: sPt(s && s.at) })),
        cast: sIds(q.cast), scenes: (Array.isArray(q.scenes) ? q.scenes : []).slice(0, 30).map(s => ({ n: sStr(s && s.n, 100), how: s && s.how === 'played' ? 'played' : 'cut' })), reward: sStr(q.reward, 160), notes: sStr(q.notes, 4000) });
    });
    o.chapters.push(ch);
  });
  const chIds = new Set(o.chapters.map(c => c.id));
  (Array.isArray(p.clues) ? p.clues : []).slice(0, 200).forEach(c => { if (c && c.id) o.clues.push({ id: sStr(c.id, 40), text: sStr(c.text, 300), plant: chIds.has(c.plant) ? c.plant : '', pay: chIds.has(c.pay) ? c.pay : '' }); });
  Object.keys(p.ans || {}).forEach(k => { if (SPINE_BY[k] && p.ans[k]) o.ans[k] = sStr(p.ans[k], 4000); });
  BANDS.forEach(b => { const x = p.bands && p.bands[b]; if (!x) return; const y = {}; BAND_F.forEach(f => { if (x[f[0]]) y[f[0]] = sStr(x[f[0]], 400); }); if (Object.keys(y).length) o.bands[b] = y; });
  return o;
}
/* the first plan: Chapter 1 = the ORIENTATION quest that is in the game (its facts only; everything else is his to fill) */
function seedPlan() {
  const p = { v: 1, t: 0, chapters: [], clues: [], ans: {}, bands: {} };
  SD.quests.forEach((q, i) => {
    const cast = ['s:player'].concat(q.reward && q.reward.unit === 'catgirl' && ENT['s:kit'] ? ['s:kit'] : [], ENT['s:rhonda'] ? ['s:rhonda'] : [], ENT['r:shadow entity'] ? ['r:shadow entity'] : []);
    p.chapters.push({ id: 'ch_' + q.id, name: q.title, col: i % CHCOL.length, band: i === 0 ? 'L1' : '', step: 0, goal: '', zone: q.start === 'hq' ? 'hq' : '', enemies: i === 0 && ENT['r:shadow entity'] ? ['r:shadow entity'] : [], mech: i === 0 ? ['Tapes', 'Board fight'] : [], boss: '', bossText: '',
      reward: q.reward && q.reward.unit === 'catgirl' ? 'Kit (the Catgirl) joins the party' : '', lie: '', trust: '', notes: '',
      quests: [{ id: 'q_' + q.id, name: q.title, kind: 'main', where: q.start === 'hq' ? 'hq' : '', at: null, ug: false, summary: q.summary, game: q.id, steps: q.steps.map((s, j) => ({ id: 's' + j, text: s, at: null })), cast, scenes: q.scenes.map(s => ({ n: s.n, how: 'cut' })), reward: q.reward && q.reward.unit === 'catgirl' ? 'Kit (the Catgirl) joins the party' : '', notes: '' }] });
  });
  return sanitizePlan(p);
}
const plan = () => { if (!S.story) S.story = seedPlan(); return S.story; };
function storySave(light) { const P = plan(); P.t = Date.now(); cloud.story = true; saveLocalSoon(); flushSoon(); if (!light) storyRender(); else storyLight(); }
function mergeStory(rp) { if (!rp) { if (S.story && S.story.t > 0) cloud.story = true; return; } const L = S.story; if (!L || (num(rp.t, 0) > (L.t || 0))) { S.story = sanitizePlan(rp); saveLocal(); if (ST.open) storyRender(); } else if ((L.t || 0) > num(rp.t, 0)) cloud.story = true; }

/* ── places ── */
const ZK = Object.fromEntries((PL.zones || []).map(z => [z.k, z]));
const UG_HUBS = new Set(); { const by = {}; SD.rooms.forEach(r => { (by[r.hub] = by[r.hub] || []).push(r.layer); }); Object.entries(by).forEach(([h, ls]) => { if (ls.every(l => l === 'under')) UG_HUBS.add(h); }); }
function placeOf(ref) {
  if (!ref) return null; if (ref === 'hq') return { ref, n: 'DOOR HQ', zk: 'hq', at: null, c: '#ffd66b' };
  const m = ref.split(':'), z = ZK[m[1]]; if (!z) return null;
  if (m[0] === 'z') return { ref, n: z.n, zk: z.k, at: z.at || null, c: z.c };
  const d = z.d.find(q => q.k === m[2]); return d ? { ref, n: d.n + ', ' + z.n, short: d.n, zk: z.k, at: d.at || z.at || null, c: d.c || z.c } : null;
}
const PLACES = (() => { const out = [{ ref: 'hq', n: 'DOOR HQ' }]; (PL.zones || []).forEach(z => { out.push({ ref: 'z:' + z.k, n: z.n }); z.d.forEach(d => out.push({ ref: 'd:' + z.k + ':' + d.k, n: d.n + ', ' + z.n })); }); return out; })();
function nearestPlace(x, y) { let best = null, bd = Infinity; (PL.zones || []).forEach(z => { const t = (at, ref, pen) => { if (!at) return; const dd = Math.hypot(at[0] - x, at[1] - y) + pen; if (dd < bd) { bd = dd; best = ref; } }; t(z.at, 'z:' + z.k, 1.5); z.d.forEach(d => t(d.at, 'd:' + z.k + ':' + d.k, 0)); }); return bd < 9 ? best : null; }
/* who lives in a zone today (the game's own spawns, the "in the game now" board's data) */
const ZONE_UNITS = (() => {
  const sp = D.spawns || { nodes: {}, links: {} }, N = sp.nodes, zOf = id => { let g = N[id], n = 0; while (g && g.parent && n++ < 8) g = N[g.parent]; return g && /^z_/.test(g.id) ? g.id.slice(2) : null; }, out = {};
  Object.values(sp.links || {}).forEach(l => { if (l.type !== 'member' || !ENT[l.a]) return; const z = zOf(l.b); if (!z) return; (out[z] = out[z] || new Set()).add(l.a); });
  Object.keys(out).forEach(k => { out[k] = [...out[k]]; }); return out;
})();
const zoneOfRef = ref => { const p = placeOf(ref); return p ? p.zk : null; };

/* ── order, the route ── */
function flatQuests() { const out = []; plan().chapters.forEach((c, ci) => c.quests.forEach((q, qi) => out.push({ c, q, ci, qi, no: (ci + 1) + '.' + (q.kind === 'side' ? String.fromCharCode(97 + c.quests.filter((x, j) => j < qi && x.kind === 'side').length) : (c.quests.filter((x, j) => j < qi && x.kind !== 'side').length + 1)) }))); return out; }
const qPoint = q => q.at ? [q.at.x, q.at.y] : (placeOf(q.where) || {}).at || null;
const qUnder = q => q.ug || UG_HUBS.has(zoneOfRef(q.where));
const findQ = id => { for (const c of plan().chapters) { const q = c.quests.find(x => x.id === id); if (q) return { c, q }; } return null; };
const findC = id => plan().chapters.find(c => c.id === id);
const chNo = id => plan().chapters.findIndex(c => c.id === id) + 1;
/* zones open by chapter N: every zone named by chapters 1..N (the chapter's zone or any of its quests) */
function openZones(n) { const s = new Set(['hq']); plan().chapters.slice(0, n).forEach(c => { const z = zoneOfRef(c.zone); if (z) s.add(z); c.quests.forEach(q => { const zq = zoneOfRef(q.where); if (zq) s.add(zq); }); }); return s; }
/* the mechanics: a chapter's NEW ones are those no earlier chapter used; a mechanic used with another old one = combined */
function mechTable() {
  const seen = new Set(), rows = {}, order = [];
  plan().chapters.forEach((c, i) => { const old = c.mech.filter(m => seen.has(m)); c.mech.forEach(m => { if (!rows[m]) { rows[m] = {}; order.push(m); } rows[m][i] = !seen.has(m) ? 'intro' : old.length > 1 ? 'combine' : 'repeat'; }); c.mech.forEach(m => seen.add(m)); });
  MECHS.forEach(m => { if (!rows[m]) { rows[m] = {}; order.push(m); } });
  return { rows, order };
}
const newMech = i => { const prev = new Set(); plan().chapters.slice(0, i).forEach(c => c.mech.forEach(m => prev.add(m))); return plan().chapters[i].mech.filter(m => !prev.has(m)); };
function noticed() {
  const P = plan(), C = P.chapters, out = [], nm = (i) => 'Ch ' + (i + 1);
  for (let i = 1; i < C.length; i++) if (!newMech(i).length && !newMech(i - 1).length && i - 1 > 0) out.push(nm(i - 1) + ' and ' + nm(i) + ' teach no new mechanic: two chapters in a row with nothing new.');
  for (let i = 2; i < C.length; i++) if (C[i].goal && C[i].goal === C[i - 1].goal && C[i].goal === C[i - 2].goal) out.push(nm(i - 2) + ', ' + (i) + ' and ' + (i + 1) + ' all have the goal ' + GOALS.find(g => g[0] === C[i].goal)[1] + '.');
  for (let i = 1; i < C.length; i++) { const a = BANDS.indexOf(C[i - 1].band), b = BANDS.indexOf(C[i].band); if (a >= 0 && b >= 0 && b < a) out.push(nm(i) + ' is in band ' + C[i].band + ', lower than ' + nm(i - 1) + ' (' + C[i - 1].band + ').'); }
  P.clues.forEach(cl => { const t = cl.text || 'A clue'; if (cl.plant && !cl.pay) out.push('"' + t + '" (planted in ' + nm(chNo(cl.plant) - 1) + ') never pays off yet.'); else if (cl.plant && cl.pay && chNo(cl.pay) <= chNo(cl.plant)) out.push('"' + t + '" pays off in ' + nm(chNo(cl.pay) - 1) + ', before or where it is planted.'); else if (!cl.plant && cl.pay) out.push('"' + t + '" pays off in ' + nm(chNo(cl.pay) - 1) + ' but is never planted.'); });
  const noBoss = C.filter(c => !c.boss && !c.bossText).length; if (C.length && noBoss) out.push(noBoss === C.length ? 'No chapter has a boss yet.' : noBoss + ' of ' + C.length + ' chapters have no boss yet.');
  const steps = new Set(C.map(c => c.step).filter(Boolean)), miss = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(s => !steps.has(s)); if (C.length && miss.length) out.push('Story steps with no chapter yet: ' + miss.join(', ') + '.');
  C.forEach((c, i) => { if (!c.quests.some(q => q.kind === 'main')) out.push(nm(i) + ' has no main quest.'); });
  return out;
}

/* ── the map: the world painted once per layer from the game's ground pictures (map.js _zmPaint's look) ── */
const MAP_PICS = window.EW_MAP_PICS || 'https://cdn.entropywars.net/Assets/ui/map/';
const SKIND = [null, [92, 142, 70], [64, 108, 62], [138, 112, 78], [206, 186, 132], [222, 230, 240], [132, 128, 120], [132, 134, 142], [146, 108, 72], [74, 66, 64], [98, 58, 48], [236, 236, 246], [176, 94, 62], [124, 104, 186], [212, 178, 84], [112, 122, 134]];
const STERR = { coast: [36, 74, 146], snow: [222, 230, 240], mountain: [132, 128, 120], grass: [92, 142, 70], forest: [50, 90, 54], scrub: [170, 160, 110], mesa: [176, 120, 80], desert: [206, 186, 132] };
const MPX = 2, MPP = 12 * MPX; // painted pixels a square, a plot
const MV = { k: 0, cx: 6, cy: 10, base: {}, pics: {}, drag: null };
function stPaint(d, nx, nz, S, hs) {
  const Wd = nx * S, out = new Uint8ClampedArray(Wd * nz * S * 4); let lo = 255, hi = 0;
  for (let k = 0; k < nx * nz; k++) { if (d[k * 4 + 2] & 64) continue; const h = d[k * 4]; if (h < lo) lo = h; if (h > hi) hi = h; }
  const span = Math.max(1, hi - lo), H = (i, j) => { if (i < 0 || j < 0 || i >= nx || j >= nz) return null; const k = j * nx + i; return (d[k * 4 + 2] & 64) ? null : d[k * 4] * hs; };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, h8 = d[k * 4], g = d[k * 4 + 1], b = d[k * 4 + 2]; if (b & 64) continue;
    const h = h8 * hs, t = (h8 - lo) / span, hl = H(i - 1, j), hu = H(i, j - 1), sh = Math.max(-46, Math.min(46, ((hl == null ? 0 : h - hl) + (hu == null ? 0 : h - hu)) * 14)); let c;
    if (b & 4) c = [44, 86, 158]; else if (b & 32) c = [36, 74, 146]; else if (b & 8) c = [226, 96, 34]; else if (b & 16) c = [118, 186, 52];
    else { const base = SKIND[g] || SKIND[6], lift = .78 + .42 * t; c = [base[0] * lift + sh, base[1] * lift + sh, base[2] * lift + sh]; if ((b & 128) && g >= 1 && g <= 3) c = [40 + 30 * t + sh * .5, 74 + 34 * t + sh * .5, 44 + 20 * t + sh * .5]; else if (b & 128) c = c.map(v => v * .62); else if (b & 1) c = c.map(v => v * .72); }
    if ((b & 2) && !(b & 128)) c = [34 + sh * .3, 84 + sh * .3, 40];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const o = ((j * S + y) * Wd + i * S + x) * 4; out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255; }
  }
  return out;
}
function mapBase(layer) {
  if (MV.base[layer]) return MV.base[layer];
  const W = PL.world; if (!W) return null;
  const cv = document.createElement('canvas'); cv.width = W.w * MPP; cv.height = W.h * MPP; const x = cv.getContext('2d');
  x.fillStyle = '#0a0d10'; x.fillRect(0, 0, cv.width, cv.height);
  if (layer === 'surface') W.g.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const t = STERR[W.key[row[i]]] || [20, 24, 28]; x.fillStyle = 'rgb(' + t.map(v => v * .55 | 0) + ')'; x.fillRect(i * MPP, j * MPP, MPP, MPP); } });
  MV.base[layer] = cv;
  SD.rooms.filter(r => r.layer === layer).forEach(r => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => { try { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0); const px = stPaint(cx.getImageData(0, 0, c.width, c.height).data, c.width, c.height, MPX, r.hs); c.width = im.width * MPX; c.height = im.height * MPX; cx.putImageData(new ImageData(px, c.width, c.height), 0, 0); x.drawImage(c, (r.x - W.x0) * MPP, (r.y - W.y0) * MPP, r.w * MPP, r.h * MPP); storyDrawMap(); } catch (e) {} };
    im.src = MAP_PICS + r.room + '.png?h=' + r.v;
  });
  return cv;
}
const mapCv = () => $('stMap');
function mapFit() { const cv = mapCv(), W = PL.world; if (!cv || !W) return; MV.k = Math.min(cv.clientWidth / 74, cv.clientHeight / 66); MV.cx = 5; MV.cy = 9; }
const m2s = (px, py) => { const cv = mapCv(); return [cv.clientWidth / 2 + (px - MV.cx) * MV.k, cv.clientHeight / 2 + (py - MV.cy) * MV.k]; };
const s2m = (sx, sy) => { const cv = mapCv(); return [MV.cx + (sx - cv.clientWidth / 2) / MV.k, MV.cy + (sy - cv.clientHeight / 2) / MV.k]; };
let mapPins = [];
function storyDrawMap() {
  const cv = mapCv(); if (!cv || !ST.open || ST.tab !== 'map') return;
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  if (!MV.k) mapFit();
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = '#05070a'; x.fillRect(0, 0, w, h);
  const W = PL.world, base = mapBase(ST.mapLayer);
  if (base && W) { const [ox, oy] = m2s(W.x0, W.y0); x.imageSmoothingEnabled = MV.k < MPP; x.drawImage(base, ox, oy, W.w * MV.k, W.h * MV.k); }
  const P = plan(), atN = ST.at, open = atN ? openZones(atN) : null;
  /* the zones not open yet at chapter N: shaded */
  if (open) SD.rooms.filter(r => r.layer === ST.mapLayer && !open.has(r.hub)).forEach(r => { const [a, b] = m2s(r.x, r.y); x.fillStyle = 'rgba(5,7,10,.66)'; x.fillRect(a, b, r.w * MV.k, r.h * MV.k); });
  /* names: the zones; the districts when close */
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  (PL.zones || []).forEach(z => {
    if (!z.at) return; const ug = UG_HUBS.has(z.k); if ((ST.mapLayer === 'under') !== ug) return;
    const [X, Y] = m2s(z.at[0], z.at[1]); if (X < -80 || Y < -40 || X > w + 80 || Y > h + 40) return;
    x.font = '600 13px "Special Elite", "Courier New", monospace'; const s = z.n.toUpperCase(), tw = x.measureText(s).width + 10;
    const LY = Y - 26; x.fillStyle = 'rgba(0,0,0,.75)'; x.fillRect(X - tw / 2, LY - 9, tw, 18); x.strokeStyle = '#fff'; x.lineWidth = 1; x.strokeRect(X - tw / 2 + .5, LY - 8.5, tw - 1, 17); x.fillStyle = '#fff'; x.fillText(s, X, LY + 4);
    if (open && !open.has(z.k)) { x.font = '600 10px "IBM Plex Mono", monospace'; x.fillStyle = '#c8c8c8'; x.fillText('NOT OPEN AT CH ' + atN, X, LY - 13); }
    if (MV.k > 26) z.d.forEach(d => { if (!d.at || (Math.abs(d.at[0] - z.at[0]) < .6 && Math.abs(d.at[1] - z.at[1]) < .6)) return; const [dx, dy] = m2s(d.at[0], d.at[1]); x.font = '500 11px "IBM Plex Sans", system-ui, sans-serif'; const dw = x.measureText(d.n).width + 8; x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(dx - dw / 2, dy - 7, dw, 15); x.fillStyle = '#e8e8e8'; x.fillText(d.n, dx, dy + 4); });
  });
  /* the route: main quests in story order; a side quest hangs off the main quest before it */
  const FQ = flatQuests().filter(f => !atN || f.ci < atN), pts = FQ.map(f => ({ f, p: qPoint(f.q) }));
  const line = (a, b, col, dash, lw) => { x.save(); x.setLineDash(dash); x.lineCap = 'round'; x.strokeStyle = '#000'; x.lineWidth = lw + 4; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); x.setLineDash([]);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L > 46) { const an = Math.atan2(b[1] - a[1], b[0] - a[0]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; x.fillStyle = col; x.strokeStyle = '#000'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(mx + Math.cos(an) * 9, my + Math.sin(an) * 9); x.lineTo(mx + Math.cos(an + 2.5) * 9, my + Math.sin(an + 2.5) * 9); x.lineTo(mx + Math.cos(an - 2.5) * 9, my + Math.sin(an - 2.5) * 9); x.closePath(); x.fill(); x.stroke(); } x.restore(); };
  const tray = $('stTray'), trayAt = id => { const el = tray && tray.querySelector('[data-tq="' + id + '"]'); if (!el) return null; const r = el.getBoundingClientRect(), c = cv.getBoundingClientRect(); return [r.left - c.left + 14, r.top - c.top + r.height / 2]; };
  const scr = it => it.p ? m2s(it.p[0], it.p[1]) : trayAt(it.f.q.id);
  let lastMain = null;
  pts.forEach(it => {
    const col = CHCOL[it.f.c.col] || '#fff', here = scr(it);
    if (it.f.q.kind === 'side') { if (lastMain && here && scr(lastMain)) line(scr(lastMain), here, col, [10, 7], 2.5); return; }
    if (lastMain && here && scr(lastMain)) line(scr(lastMain), here, col, (qUnder(it.f.q) || qUnder(lastMain.f.q)) ? [2, 6] : [], 4);
    lastMain = it;
  });
  /* the picked quest's steps: small pins joined to it */
  mapPins = [];
  const selQ = ST.sel && ST.sel.kind === 'quest' ? findQ(ST.sel.id) : null;
  if (selQ && !(atN && chNo(selQ.c.id) > atN)) { const qp = qPoint(selQ.q); selQ.q.steps.forEach((s, i) => { if (!s.at) return; const sp = m2s(s.at.x, s.at.y); if (qp) line(m2s(qp[0], qp[1]), sp, '#ffffff', [3, 4], 1.5); x.beginPath(); x.arc(sp[0], sp[1], 9, 0, 7); x.fillStyle = '#ffd66b'; x.fill(); x.lineWidth = 2; x.strokeStyle = '#000'; x.stroke(); x.fillStyle = '#000'; x.font = '600 10px "IBM Plex Mono", monospace'; x.fillText(String(i + 1), sp[0], sp[1] + 3.5); mapPins.push({ kind: 'step', q: selQ.q.id, s: s.id, x: sp[0], y: sp[1], r: 10 }); }); }
  pts.forEach(it => {
    if (!it.p) return; const [X, Y] = m2s(it.p[0], it.p[1]); if (X < -30 || Y < -30 || X > w + 30 || Y > h + 30) return;
    const col = CHCOL[it.f.c.col] || '#fff', on = ST.sel && ((ST.sel.kind === 'quest' && ST.sel.id === it.f.q.id) || (ST.sel.kind === 'chapter' && ST.sel.id === it.f.c.id));
    x.save(); x.beginPath(); x.arc(X, Y, on ? 18 : 15, 0, 7); x.fillStyle = col; x.fill(); x.lineWidth = 3; x.strokeStyle = '#000'; if (it.f.q.kind === 'side') x.setLineDash([4, 3]); x.stroke(); x.setLineDash([]);
    x.lineWidth = on ? 3 : 1.5; x.strokeStyle = '#fff'; x.beginPath(); x.arc(X, Y, (on ? 18 : 15) + 2.5, 0, 7); x.stroke();
    x.fillStyle = '#000'; x.font = '600 11px "IBM Plex Mono", monospace'; x.fillText(it.f.no, X, Y + 4); x.restore();
    mapPins.push({ kind: 'quest', q: it.f.q.id, x: X, y: Y, r: 17 });
  });
  /* the hover card */
  if (MV.hover) { const f = flatQuests().find(z => z.q.id === MV.hover.q); if (f) { const p = placeOf(f.q.where), t1 = f.no + ' · ' + (f.q.name || 'Untitled quest'), t2 = (p ? p.n : 'No place yet') + (qUnder(f.q) ? ' · underground' : '') + (f.q.kind === 'side' ? ' · side quest' : ''); x.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; const bw = Math.max(x.measureText(t1).width, x.measureText(t2).width * .95) + 18; const hx = Math.min(MV.hover.x + 22, w - bw - 6), hy = MV.hover.y - 10; x.fillStyle = '#000'; x.fillRect(hx, hy, bw, 40); x.strokeStyle = '#fff'; x.lineWidth = 2; x.strokeRect(hx, hy, bw, 40); x.textAlign = 'left'; x.fillStyle = '#fff'; x.fillText(t1, hx + 9, hy + 16); x.font = '11.5px "IBM Plex Sans", system-ui, sans-serif'; x.fillStyle = '#bbb'; x.fillText(t2, hx + 9, hy + 32); } }
  if (ST.pick) { x.fillStyle = 'rgba(0,0,0,.8)'; x.fillRect(w / 2 - 170, 52, 340, 30); x.strokeStyle = '#4fd36a'; x.lineWidth = 2; x.strokeRect(w / 2 - 170, 52, 340, 30); x.fillStyle = '#4fd36a'; x.textAlign = 'center'; x.font = '600 13px "IBM Plex Sans", system-ui, sans-serif'; x.fillText('Click the map to place it · Escape to stop', w / 2, 72); }
}
function mapHit(sx, sy) { for (let i = mapPins.length - 1; i >= 0; i--) { const p = mapPins[i]; if (Math.hypot(p.x - sx, p.y - sy) <= p.r) return p; } return null; }

/* ── the panels ── */
const face = id => { const e = ENT[id]; if (!e) return ''; const n = (e.kind === 'cast' && e.c ? e.c.n : e.n); return '<span class="stchip" data-ent="' + esc(id) + '">' + (e.img ? '<img alt="" src="' + e.img + '">' : '<i>' + esc(initials(n)) + '</i>') + esc(n) + '<b data-unent="' + esc(id) + '" title="Remove">×</b></span>'; };
const entName = id => { const e = ENT[id]; return e ? (e.kind === 'cast' && e.c ? e.c.n : e.n) : ''; };
const seg = (f, opts, val) => '<div class="stseg" data-seg="' + f + '">' + opts.map(o => '<button data-v="' + esc(o[0]) + '"' + (String(val) === String(o[0]) ? ' class="on"' : '') + '>' + esc(o[1]) + '</button>').join('') + '</div>';
const fld = (lab, html) => '<div class="stlbl">' + lab + '</div>' + html;
const pickBox = (id, ph, cur) => (cur ? '<div class="stcur">' + esc(cur) + '</div>' : '') + '<div class="stpick"><input class="stinp" data-pick="' + id + '" placeholder="' + esc(ph) + '" autocomplete="off"><div class="stpl" hidden></div></div>';
function renderLeft() {
  const P = plan(); let h = '<h3>CHAPTERS</h3>';
  P.chapters.forEach((c, ci) => {
    const col = CHCOL[c.col], z = placeOf(c.zone), on = ST.sel && ST.sel.kind === 'chapter' && ST.sel.id === c.id;
    h += '<div class="stch' + (on ? ' on' : '') + '" style="--cc:' + col + '" data-ch="' + esc(c.id) + '" draggable="true"><div class="hd"><span class="dot" style="background:' + col + '"></span>Ch ' + (ci + 1) + (c.name ? ' · ' + esc(c.name) : '') + '</div>'
      + '<div class="sub">' + [c.band, z ? z.n : '', c.quests.length + (c.quests.length === 1 ? ' quest' : ' quests')].filter(Boolean).map(esc).join(' · ') + '</div>';
    flatQuests().filter(f => f.c === c).forEach(f => { const q = f.q, qon = ST.sel && ST.sel.kind === 'quest' && ST.sel.id === q.id;
      h += '<div class="stq' + (q.kind === 'side' ? ' side' : '') + (qon ? ' on' : '') + '" data-q="' + esc(q.id) + '" draggable="true"><span class="n" style="background:' + col + '">' + f.no + '</span><span class="t">' + esc(q.name || 'Untitled quest') + '</span><span class="k">' + (q.kind === 'side' ? 'SIDE' : 'MAIN') + (q.game ? ' · GAME' : '') + '</span></div>'; });
    h += '<button class="stadd" data-addq="' + esc(c.id) + '">+ Quest</button></div>';
  });
  h += '<button class="stbtn g" data-act="addCh">+ Chapter</button>';
  $('stLeft').innerHTML = h;
}
function renderTray() {
  const off = [{ ref: 'hq', n: 'DOOR HQ' }].concat((PL.zones || []).filter(z => !z.at).map(z => ({ ref: 'z:' + z.k, n: z.n })));
  const FQ = flatQuests().filter(f => !ST.at || f.ci < ST.at);
  let h = '<div class="tt">OFF THE MAP</div>';
  off.forEach(o => { const qs = FQ.filter(f => !f.q.at && (f.q.where === o.ref || (f.q.where && f.q.where.startsWith('d:' + o.ref.slice(2) + ':') && !qPoint(f.q)))); h += '<div class="o"><span class="on">' + esc(o.n) + '</span>' + qs.map(f => '<span class="n" data-tq="' + esc(f.q.id) + '" style="background:' + CHCOL[f.c.col] + '">' + f.no + '</span>').join('') + '</div>'; });
  const none = FQ.filter(f => !f.q.where && !f.q.at); if (none.length) h += '<div class="o"><span class="on" style="color:#ff8a8a">No place yet</span>' + none.map(f => '<span class="n" data-tq="' + esc(f.q.id) + '" style="background:' + CHCOL[f.c.col] + '">' + f.no + '</span>').join('') + '</div>';
  $('stTray').innerHTML = h;
}
function chapterForm(c) {
  const P = plan(), ci = P.chapters.indexOf(c), z = zoneOfRef(c.zone), lives = (ZONE_UNITS[z] || []).filter(id => !c.enemies.includes(id));
  const factions = Object.values(B.nodes).filter(n => isGrp(n) && gkOf(n) === 'faction' && membersOf(n.id).some(id => ENT[id]));
  const nm = newMech(ci), plants = P.clues.filter(k => k.plant === c.id), pays = P.clues.filter(k => k.pay === c.id && k.plant !== c.id);
  let h = '<div class="sthd"><h3>CHAPTER ' + (ci + 1) + '</h3><span class="sp"></span><button class="stbtn sm" data-act="chUp" title="Earlier">◂</button><button class="stbtn sm" data-act="chDown" title="Later">▸</button></div>';
  h += fld('Name', '<input class="stinp" data-f="name" value="' + esc(c.name) + '" placeholder="Chapter name">');
  h += fld('Colour', '<div class="stcols">' + CHCOL.map((k, i) => '<button data-col="' + i + '" style="background:' + k + '"' + (i === c.col ? ' class="on"' : '') + '></button>').join('') + '</div>');
  h += fld('Band (rank)', seg('band', BANDS.map(b => [b, b]), c.band));
  h += fld('Story step (the nine steps)', '<select class="stinp" data-f="step"><option value="0">Pick a step…</option>' + STEPS9.map((s, i) => '<option value="' + (i + 1) + '"' + (c.step === i + 1 ? ' selected' : '') + '>' + esc(s) + '</option>').join('') + '</select>');
  h += fld('Goal of the chapter', seg('goal', GOALS, c.goal));
  h += fld('Zone it opens', '<div class="strow">' + pickBox('zone', placeOf(c.zone) ? 'Change…' : 'Type a zone or district…', placeOf(c.zone) ? placeOf(c.zone).n : '') + '<button class="stbtn sm" data-act="pickZone">On map</button></div>');
  h += fld('Enemies', '<div class="stchips">' + c.enemies.map(face).join('') + '</div>' + pickBox('enemy', 'Add a unit…')
    + (lives.length ? '<div class="stsub">Lives in ' + esc(placeOf('z:' + z) ? placeOf('z:' + z).n : 'this zone') + ' (click to add)</div><div class="stlives">' + lives.slice(0, 40).map(id => '<button data-addenemy="' + esc(id) + '" title="' + esc(entName(id)) + '">' + (ENT[id].img ? '<img alt="" src="' + ENT[id].img + '">' : esc(initials(entName(id)))) + '</button>').join('') + '</div>' : '')
    + (factions.length ? '<select class="stinp" data-act="squad"><option value="">+ Squad from a faction on this board…</option>' + factions.map(f => '<option value="' + esc(f.id) + '">' + esc(f.name) + ' (' + membersOf(f.id).filter(id => ENT[id]).length + ')</option>').join('') + '</select>' : ''));
  h += fld('Mechanics used <span class="stmuted">(new ones are found by themselves)</span>', '<div class="stmech">' + [...new Set(MECHS.concat(c.mech))].map(m => '<button data-mech="' + esc(m) + '"' + (c.mech.includes(m) ? ' class="on' + (nm.includes(m) ? ' new' : '') + '"' : '') + '>' + esc(m) + (nm.includes(m) ? ' · NEW' : '') + '</button>').join('') + '</div><input class="stinp" data-act="mechAdd" placeholder="Another mechanic, press Enter">');
  h += fld('Boss', '<div class="stchips">' + (c.boss ? face(c.boss).replace('data-unent', 'data-unboss') : '') + '</div>' + pickBox('boss', c.boss ? 'Change the boss…' : 'Pick a unit…') + '<input class="stinp" data-f="bossText" value="' + esc(c.bossText) + '" placeholder="or a note: the arena, the twist…">');
  h += fld('Reward', '<input class="stinp" data-f="reward" value="' + esc(c.reward) + '" placeholder="A unit, a key, a rank…">');
  h += fld('Clues', plants.map(k => '<div class="stclue"><b class="pl">plant</b><input class="stinp" data-clue="' + esc(k.id) + '" value="' + esc(k.text) + '" placeholder="The clue"><select class="stinp" data-cluepay="' + esc(k.id) + '"><option value="">pays off: not yet</option>' + P.chapters.map((x, i) => x.id === c.id ? '' : '<option value="' + esc(x.id) + '"' + (k.pay === x.id ? ' selected' : '') + '>pays off: Ch ' + (i + 1) + '</option>').join('') + '</select><button class="stx" data-delclue="' + esc(k.id) + '">×</button></div>').join('')
    + pays.map(k => '<div class="stclue"><b class="py">payoff</b><span>' + esc(k.text || 'A clue') + '</span><span class="stmuted">planted in Ch ' + chNo(k.plant) + '</span></div>').join('') + '<button class="stadd" data-act="addClue">+ Plant a clue here</button>');
  h += fld('What DOOR trusts you with', '<input class="stinp" data-f="trust" value="' + esc(c.trust) + '">');
  h += fld('The lie you believe', '<input class="stinp" data-f="lie" value="' + esc(c.lie) + '">');
  h += fld('Notes', '<textarea class="stinp" data-f="notes" rows="4">' + esc(c.notes) + '</textarea>');
  h += '<div class="strow" style="margin-top:14px"><button class="stbtn g" data-addq="' + esc(c.id) + '">+ Quest</button><span class="sp"></span><button class="stbtn r" data-act="delCh">Delete chapter</button></div>';
  return h;
}
function questForm(c, q) {
  const f = flatQuests().find(z => z.q === q), p = placeOf(q.where);
  let h = '<div class="sthd"><h3>QUEST ' + f.no + '</h3></div>';
  h += fld('Name', '<input class="stinp" data-qf="name" value="' + esc(q.name) + '" placeholder="Quest name">');
  h += '<div class="strow" style="margin-top:8px">' + seg('kind', [['main', 'Main'], ['side', 'Side']], q.kind) + (q.game ? '<span class="stmuted">In the game: ' + esc(q.game) + '</span>' : '') + '</div>';
  h += fld('Chapter', '<select class="stinp" data-act="moveQ">' + plan().chapters.map((x, i) => '<option value="' + esc(x.id) + '"' + (x === c ? ' selected' : '') + '>Ch ' + (i + 1) + (x.name ? ' · ' + esc(x.name) : '') + '</option>').join('') + '</select>');
  h += fld('Where', '<div class="strow">' + pickBox('where', p ? 'Change…' : 'Type a place…', p ? p.n : '') + '<button class="stbtn sm" data-act="pickQ">On map</button></div>' + (q.at ? '<div class="stsub">Pinned on the map · <button class="stlink" data-act="unpinQ">unpin</button></div>' : '') + '<label class="stcheck"><input type="checkbox" data-act="ug"' + (qUnder(q) ? ' checked' : '') + (UG_HUBS.has(zoneOfRef(q.where)) ? ' disabled' : '') + '> Underground</label>');
  h += fld('Summary', '<textarea class="stinp" data-qf="summary" rows="3">' + esc(q.summary) + '</textarea>');
  h += fld('Steps <span class="stmuted">(each can have its own pin)</span>', q.steps.map((s, i) => '<div class="ststep"><b>' + (i + 1) + '</b><input class="stinp" data-step="' + esc(s.id) + '" value="' + esc(s.text) + '"><button class="stbtn sm' + (s.at ? ' on' : '') + '" data-pickstep="' + esc(s.id) + '" title="Place this step on the map">⌖</button><button class="stx" data-delstep="' + esc(s.id) + '">×</button></div>').join('') + '<button class="stadd" data-act="addStep">+ Step</button>');
  h += fld('Characters', '<div class="stchips">' + q.cast.map(face).join('') + '</div>' + pickBox('cast', 'Add a character or unit…'));
  h += fld('Cutscenes <span class="stmuted">(a cutscene, or played through)</span>', q.scenes.map((s, i) => '<div class="ststep"><input class="stinp" data-scene="' + i + '" value="' + esc(s.n) + '"><div class="stseg sm" data-scenehow="' + i + '"><button data-v="cut"' + (s.how === 'cut' ? ' class="on"' : '') + '>Cutscene</button><button data-v="played"' + (s.how === 'played' ? ' class="on"' : '') + '>Played</button></div><button class="stx" data-delscene="' + i + '">×</button></div>').join('') + '<button class="stadd" data-act="addScene">+ Scene</button>');
  h += fld('Reward', '<input class="stinp" data-qf="reward" value="' + esc(q.reward) + '">');
  h += fld('Notes', '<textarea class="stinp" data-qf="notes" rows="4">' + esc(q.notes) + '</textarea>');
  h += '<div class="strow" style="margin-top:14px"><button class="stbtn" data-act="selCh">Open chapter</button><span class="sp"></span><button class="stbtn r" data-act="delQ">Delete quest</button></div>';
  return h;
}
function renderRight() {
  const el = $('stRight'), s = ST.sel; let h = '';
  if (s && s.kind === 'quest') { const f = findQ(s.id); if (f) h = questForm(f.c, f.q); }
  else if (s && s.kind === 'chapter') { const c = findC(s.id); if (c) h = chapterForm(c); }
  if (!h) h = '<h3>THE PLAN</h3><div class="stmuted" style="font-size:13px">' + plan().chapters.length + ' chapters · ' + flatQuests().length + ' quests</div>';
  const sc = el.scrollTop; el.innerHTML = h; el.scrollTop = sc;
}
function renderBeat() {
  const P = plan(), cells = (v, miss) => v ? v : '<span class="stmiss">' + (miss || 'pick') + '</span>';
  let h = '<h3>BEAT CHART <span class="stmuted" style="font:12px var(--font-body)">· built from your chapters · click a row to edit it</span></h3><div class="sttbl"><table><tr><th>Chapter</th><th>Band</th><th>Story step</th><th>Goal</th><th>Zone</th><th>Enemies</th><th>New mechanic</th><th>Boss</th><th>Reward</th><th>Clue planted</th><th>Quests</th></tr>';
  P.chapters.forEach((c, i) => {
    const z = placeOf(c.zone), nm = newMech(i), cl = P.clues.filter(k => k.plant === c.id).map(k => k.text || 'a clue');
    h += '<tr data-editch="' + esc(c.id) + '"><td class="ch"><span class="dot" style="background:' + CHCOL[c.col] + '"></span>' + (i + 1) + (c.name ? ' · ' + esc(c.name) : '') + '</td><td>' + cells(c.band) + '</td><td>' + cells(c.step ? esc(STEPS9[c.step - 1]) : '') + '</td><td>' + cells(c.goal ? GOALS.find(g => g[0] === c.goal)[1] : '') + '</td><td>' + cells(z ? esc(z.n) : '') + '</td>'
      + '<td>' + (c.enemies.length ? c.enemies.map(id => '<span class="stmini">' + (ENT[id].img ? '<img alt="" src="' + ENT[id].img + '">' : '') + esc(entName(id)) + '</span>').join('') : cells('')) + '</td>'
      + '<td>' + (nm.length ? esc(nm.join(', ')) : '<span class="stmiss">none new</span>') + '</td><td>' + cells(c.boss ? esc(entName(c.boss)) + (c.bossText ? ' · ' + esc(c.bossText) : '') : esc(c.bossText)) + '</td><td>' + cells(esc(c.reward)) + '</td><td>' + (cl.length ? esc(cl.join(' · ')) : '<span class="stmuted">—</span>') + '</td><td>' + c.quests.length + '</td></tr>';
  });
  h += '<tr><td colspan="11"><button class="stadd" data-act="addCh">+ Chapter</button></td></tr></table></div>';
  const N = noticed(); h += '<div class="stflags"><b>THINGS THE CHART NOTICED</b>' + (N.length ? N.map(t => '<div>⚠ ' + esc(t) + '</div>').join('') : '<div>Nothing yet.</div>') + '</div>';
  const M = mechTable(); h += '<div class="stlbl" style="margin-top:16px">Mechanics: introduce alone, repeat, then combine</div><div class="sttbl"><table class="stgrid"><tr><th>Mechanic</th>' + P.chapters.map((c, i) => '<th>Ch ' + (i + 1) + '</th>').join('') + '</tr>'
    + M.order.map(m => '<tr><td>' + esc(m) + '</td>' + P.chapters.map((c, i) => { const v = M.rows[m][i]; return '<td class="' + (v || '') + '">' + (v === 'combine' ? 'combined' : v || '') + '</td>'; }).join('') + '</tr>').join('') + '</table></div>';
  $('stBeatMain').innerHTML = h;
  let s = '<h3>ANSWER THESE FIRST</h3><div class="stmuted" style="font-size:12px">The seven questions from your plan. Answers save with the plan.</div>';
  SPINE_Q.forEach(g => g.q.filter(q => q[2]).forEach(q => { s += '<div class="stqa"><div>' + esc(q[1]) + '</div><textarea class="stinp" data-ans="' + q[0] + '" rows="2" placeholder="Type here…">' + esc(P.ans[q[0]] || '') + '</textarea></div>'; }));
  s += '<div class="stmuted" style="font-size:12px;margin-top:8px">The Spine tab has the rest: the one-sheet, the six bands and every chapter\'s questions.</div>';
  $('stBeatSide').innerHTML = s;
}
function renderSpine() {
  const P = plan(); let h = '<h3>THE SIX BANDS</h3><div class="sttbl"><table><tr><th>Band</th>' + BAND_F.map(f => '<th>' + esc(f[1]) + '</th>').join('') + '<th>Chapters</th></tr>';
  BANDS.forEach(b => { const x = P.bands[b] || {}, chs = P.chapters.map((c, i) => c.band === b ? 'Ch ' + (i + 1) : '').filter(Boolean); h += '<tr><td class="ch">' + b + '</td>' + BAND_F.map(f => '<td><textarea class="stinp" rows="2" data-band="' + b + '" data-bf="' + f[0] + '">' + esc(x[f[0]] || '') + '</textarea></td>').join('') + '<td>' + (chs.join(', ') || '<span class="stmuted">none yet</span>') + '</td></tr>'; });
  h += '</table></div>';
  SPINE_Q.forEach(g => { h += '<h3 style="margin-top:20px">' + esc(g.h.toUpperCase()) + '</h3>'; g.q.forEach(q => { h += '<div class="stqa"><div>' + (q[2] ? '<b class="stfirst">FIRST</b> ' : '') + esc(q[1]) + '</div><textarea class="stinp" data-ans="' + q[0] + '" rows="2" placeholder="Type here…">' + esc(P.ans[q[0]] || '') + '</textarea></div>'; }); });
  const el = $('st_spine'), sc = el.scrollTop; el.innerHTML = h; el.scrollTop = sc;
}
function storyLight() { if (!ST.open) return; if (ST.tab === 'map') { renderLeft(); renderTray(); storyDrawMap(); } }
function storyRender() {
  if (!ST.open) return;
  $('story').querySelectorAll('[data-sttab]').forEach(b => b.classList.toggle('on', b.dataset.sttab === ST.tab));
  ['map', 'beat', 'spine'].forEach(t => { $('st_' + t).hidden = ST.tab !== t; });
  const atSel = $('stAt'); atSel.innerHTML = '<option value="0">All chapters</option>' + plan().chapters.map((c, i) => '<option value="' + (i + 1) + '"' + (ST.at === i + 1 ? ' selected' : '') + '>World at Ch ' + (i + 1) + '</option>').join('');
  $('stLayer').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === ST.mapLayer));
  if (ST.tab === 'map') { renderLeft(); renderTray(); renderRight(); requestAnimationFrame(storyDrawMap); }
  else if (ST.tab === 'beat') renderBeat(); else renderSpine();
}
function storyOpen(on) { ST.open = on; $('story').hidden = !on; $('app').hidden = on; S.ui.story = on; if (ST.tab) S.ui.storyTab = ST.tab; saveLocalSoon(); if (on) { plan(); storyRender(); } else renderAll(); }

/* ── editing ── */
function addChapter() { const P = plan(), c = { id: uid('ch'), name: '', col: P.chapters.length % CHCOL.length, band: '', step: 0, goal: '', zone: '', enemies: [], mech: [], boss: '', bossText: '', reward: '', lie: '', trust: '', notes: '', quests: [] }; P.chapters.push(c); ST.sel = { kind: 'chapter', id: c.id }; if (ST.tab !== 'map') ST.tab = 'map'; storySave(); }
function addQuest(cid) { const c = findC(cid); if (!c) return; const q = { id: uid('q'), name: '', kind: 'main', where: c.zone || '', at: null, ug: false, summary: '', game: '', steps: [], cast: [], scenes: [], reward: '', notes: '' }; c.quests.push(q); ST.sel = { kind: 'quest', id: q.id }; storySave(); setTimeout(() => { const i = $('stRight').querySelector('[data-qf="name"]'); if (i) i.focus(); }, 0); }
function curQ() { return ST.sel && ST.sel.kind === 'quest' ? findQ(ST.sel.id) : null; }
function curC() { return ST.sel && ST.sel.kind === 'chapter' ? findC(ST.sel.id) : null; }
function confirmBox(text, yes, fn) { modal('<h2>' + esc(text) + '</h2><div class="acts"><button class="btn" data-x="cancel">Keep it</button><button class="btn pri" data-x="ok" style="background:#c6352b;border-color:#c6352b">' + esc(yes) + '</button></div>', d => d.addEventListener('click', e => { const x = e.target.dataset.x; if (x === 'ok') { closeModal(); fn(); } else if (x === 'cancel') closeModal(); })); }
function pickOptions(kind) {
  if (kind === 'zone' || kind === 'where') return PLACES.map(p => ({ v: p.ref, n: p.n }));
  return ENTS.map(e => ({ v: e.id, n: (e.kind === 'cast' && e.c ? e.c.n : e.n), sub: e.kind === 'cast' ? 'story' : (e.v && e.r.v.length > 1 ? e.v.g : ''), img: e.img }));
}
function pickShow(inp) {
  const box = inp.nextElementSibling, q = pnorm(inp.value), ws = q ? q.split(' ') : [];
  const hits = pickOptions(inp.dataset.pick).map(o => { const t = pnorm(o.n + ' ' + o.v + ' ' + (o.sub || '')); if (!ws.every(w => t.includes(w))) return null; const nn = pnorm(o.n).replace(/^the /, ''), qq = q.replace(/^the /, ''); return { o, r: !q ? 3 : nn === qq ? 0 : nn.startsWith(qq) ? 1 : 2, z: /^d:/.test(o.v) ? 1 : 0 }; }).filter(Boolean).sort((a, b) => a.r - b.r || a.z - b.z || a.o.n.localeCompare(b.o.n)).slice(0, 50);
  inp._hits = hits.map(h => h.o); inp._sel = clamp(inp._sel || 0, 0, Math.max(0, hits.length - 1));
  box.innerHTML = hits.length ? hits.map((h, i) => '<div class="po' + (i === inp._sel ? ' on' : '') + '" data-pv="' + esc(h.o.v) + '">' + (h.o.img ? '<img alt="" src="' + h.o.img + '">' : '') + esc(h.o.n) + (h.o.sub ? ' <i>' + esc(h.o.sub) + '</i>' : '') + '</div>').join('') : '<div class="po none">No match</div>';
  box.hidden = false;
}
function pickTakeSt(inp, v) {
  const kind = inp.dataset.pick, q = curQ(), c = curC(); inp.value = ''; inp.nextElementSibling.hidden = true;
  if (kind === 'zone' && c) { c.zone = v; }
  else if (kind === 'where' && q) { q.q.where = v; q.q.at = null; }
  else if (kind === 'enemy' && c) { if (!c.enemies.includes(v)) c.enemies.push(v); }
  else if (kind === 'boss' && c) { c.boss = v; }
  else if (kind === 'cast' && q) { if (!q.q.cast.includes(v)) q.q.cast.push(v); }
  storySave();
}
function bindStory() {
  const root = $('story');
  root.addEventListener('click', e => {
    const t = e.target, b = t.closest('button, [data-ch], [data-q], [data-tq], [data-editch], .po[data-pv]'); if (!b) return;
    if (b.matches('.po[data-pv]')) { const inp = b.parentElement.previousElementSibling; pickTakeSt(inp, b.dataset.pv); return; }
    if (b.dataset.sttab) { ST.tab = b.dataset.sttab; S.ui.storyTab = ST.tab; saveLocalSoon(); storyRender(); return; }
    if (b.dataset.act === 'back') { storyOpen(false); return; }
    if (b.closest('#stLayer') && b.dataset.v) { ST.mapLayer = b.dataset.v; storyRender(); return; }
    if (b.dataset.addq) { addQuest(b.dataset.addq); return; }
    if (b.dataset.tq) { ST.sel = { kind: 'quest', id: b.dataset.tq }; storyRender(); return; }
    if (b.dataset.editch) { ST.sel = { kind: 'chapter', id: b.dataset.editch }; ST.tab = 'map'; storyRender(); return; }
    if (b.dataset.q && !t.closest('button')) { ST.sel = { kind: 'quest', id: b.dataset.q }; const p = qPoint(findQ(b.dataset.q).q); if (p) { MV.cx = p[0]; MV.cy = p[1]; } storyRender(); return; }
    if (b.dataset.ch && !t.closest('[data-q]') && !t.closest('button')) { ST.sel = { kind: 'chapter', id: b.dataset.ch }; storyRender(); return; }
    const c = curC(), fq = curQ(), P = plan();
    const sg = b.closest('[data-seg]'); if (sg && b.dataset.v != null) { const f = sg.dataset.seg, v = b.dataset.v; if (f === 'kind' && fq) fq.q.kind = v; else if (c) c[f] = c[f] === v ? '' : v; storySave(); return; }
    const sh = b.closest('[data-scenehow]'); if (sh && fq) { fq.q.scenes[+sh.dataset.scenehow].how = b.dataset.v; storySave(); return; }
    if (b.dataset.col != null && c) { c.col = +b.dataset.col; storySave(); return; }
    if (b.dataset.mech && c) { const m = b.dataset.mech; c.mech = c.mech.includes(m) ? c.mech.filter(x => x !== m) : c.mech.concat([m]); storySave(); return; }
    if (b.dataset.addenemy && c) { if (!c.enemies.includes(b.dataset.addenemy)) c.enemies.push(b.dataset.addenemy); storySave(); return; }
    if (b.dataset.unent) { const id = b.dataset.unent; if (c) c.enemies = c.enemies.filter(x => x !== id); if (fq) fq.q.cast = fq.q.cast.filter(x => x !== id); storySave(); return; }
    if (b.dataset.unboss && c) { c.boss = ''; storySave(); return; }
    if (b.dataset.delclue) { P.clues = P.clues.filter(k => k.id !== b.dataset.delclue); storySave(); return; }
    if (b.dataset.delstep && fq) { fq.q.steps = fq.q.steps.filter(s => s.id !== b.dataset.delstep); storySave(); return; }
    if (b.dataset.pickstep && fq) { ST.pick = { kind: 'step', q: fq.q.id, s: b.dataset.pickstep }; storyDrawMap(); return; }
    if (b.dataset.delscene != null && fq) { fq.q.scenes.splice(+b.dataset.delscene, 1); storySave(); return; }
    switch (b.dataset.act) {
      case 'addCh': addChapter(); break;
      case 'addClue': if (c) { P.clues.push({ id: uid('k'), text: '', plant: c.id, pay: '' }); storySave(); } break;
      case 'addStep': if (fq) { fq.q.steps.push({ id: uid('s'), text: '', at: null }); storySave(); setTimeout(() => { const l = [...$('stRight').querySelectorAll('[data-step]')].pop(); if (l) l.focus(); }, 0); } break;
      case 'addScene': if (fq) { fq.q.scenes.push({ n: '', how: 'cut' }); storySave(); } break;
      case 'pickZone': if (c) { ST.pick = { kind: 'zone', c: c.id }; storyDrawMap(); } break;
      case 'pickQ': if (fq) { ST.pick = { kind: 'quest', q: fq.q.id }; storyDrawMap(); } break;
      case 'unpinQ': if (fq) { fq.q.at = null; storySave(); } break;
      case 'selCh': if (fq) { ST.sel = { kind: 'chapter', id: fq.c.id }; storyRender(); } break;
      case 'chUp': case 'chDown': if (c) { const i = P.chapters.indexOf(c), j = i + (b.dataset.act === 'chUp' ? -1 : 1); if (j >= 0 && j < P.chapters.length) { P.chapters.splice(i, 1); P.chapters.splice(j, 0, c); storySave(); } } break;
      case 'delCh': if (c) confirmBox('Delete Ch ' + chNo(c.id) + (c.name ? ' · ' + c.name : '') + ' and its ' + c.quests.length + ' quests?', 'Delete chapter', () => { P.chapters = P.chapters.filter(x => x !== c); P.clues.forEach(k => { if (k.plant === c.id) k.plant = ''; if (k.pay === c.id) k.pay = ''; }); ST.sel = null; storySave(); }); break;
      case 'delQ': if (fq) confirmBox('Delete the quest ' + (fq.q.name || 'Untitled quest') + '?', 'Delete quest', () => { fq.c.quests = fq.c.quests.filter(x => x !== fq.q); ST.sel = { kind: 'chapter', id: fq.c.id }; storySave(); }); break;
      case 'export': storyExport(); break;
      case 'mfit': mapFit(); storyDrawMap(); break;
      case 'min': case 'mout': { const f = b.dataset.act === 'min' ? 1.35 : 1 / 1.35; MV.k = clamp(MV.k * f, 3, 90); storyDrawMap(); } break;
    }
  });
  root.addEventListener('input', e => {
    const t = e.target, c = curC(), fq = curQ(), P = plan();
    if (t.dataset.pick) { t._sel = 0; pickShow(t); return; }
    if (t.dataset.f && c) { c[t.dataset.f] = t.dataset.f === 'step' ? +t.value : t.value; storySave(t.tagName === 'SELECT' ? false : true); return; }
    if (t.dataset.qf && fq) { fq.q[t.dataset.qf] = t.value; storySave(true); return; }
    if (t.dataset.step && fq) { const s = fq.q.steps.find(x => x.id === t.dataset.step); if (s) { s.text = t.value; storySave(true); } return; }
    if (t.dataset.scene != null && fq) { fq.q.scenes[+t.dataset.scene].n = t.value; storySave(true); return; }
    if (t.dataset.clue) { const k = P.clues.find(x => x.id === t.dataset.clue); if (k) { k.text = t.value; storySave(true); } return; }
    if (t.dataset.ans) { if (t.value) P.ans[t.dataset.ans] = t.value; else delete P.ans[t.dataset.ans]; root.querySelectorAll('[data-ans="' + t.dataset.ans + '"]').forEach(o => { if (o !== t) o.value = t.value; }); storySave(true); return; }
    if (t.dataset.band) { const x = P.bands[t.dataset.band] = P.bands[t.dataset.band] || {}; x[t.dataset.bf] = t.value; storySave(true); return; }
  });
  root.addEventListener('change', e => {
    const t = e.target, c = curC(), fq = curQ(), P = plan();
    if (t.id === 'stAt') { ST.at = +t.value; storyRender(); return; }
    if (t.dataset.cluepay) { const k = P.clues.find(x => x.id === t.dataset.cluepay); if (k) { k.pay = t.value; storySave(); } return; }
    if (t.dataset.act === 'squad' && c && t.value) { membersOf(t.value).filter(id => ENT[id]).forEach(id => { if (!c.enemies.includes(id)) c.enemies.push(id); }); storySave(); return; }
    if (t.dataset.act === 'moveQ' && fq) { const to = findC(t.value); if (to && to !== fq.c) { fq.c.quests = fq.c.quests.filter(x => x !== fq.q); to.quests.push(fq.q); storySave(); } return; }
    if (t.dataset.act === 'ug' && fq) { fq.q.ug = t.checked; storySave(); return; }
  });
  root.addEventListener('keydown', e => {
    const t = e.target;
    if (t.dataset.pick) { const n = (t._hits || []).length; if (e.key === 'ArrowDown') { e.preventDefault(); t._sel = Math.min(n - 1, (t._sel || 0) + 1); pickShow(t); } else if (e.key === 'ArrowUp') { e.preventDefault(); t._sel = Math.max(0, (t._sel || 0) - 1); pickShow(t); } else if (e.key === 'Enter' && n) { e.preventDefault(); pickTakeSt(t, t._hits[t._sel || 0].v); } else if (e.key === 'Escape') { t.nextElementSibling.hidden = true; t.blur(); } e.stopPropagation(); return; }
    if (t.dataset.act === 'mechAdd' && e.key === 'Enter') { const c = curC(), v = t.value.trim(); if (c && v && !c.mech.includes(v)) { c.mech.push(v); storySave(); } t.value = ''; return; }
  });
  root.addEventListener('focusin', e => { if (e.target.dataset.pick) { e.target._sel = 0; pickShow(e.target); } });
  root.addEventListener('focusout', e => { const t = e.target; if (t.dataset.pick) setTimeout(() => { if (document.activeElement !== t && t.nextElementSibling) t.nextElementSibling.hidden = true; }, 160); if (t.dataset.f || t.dataset.qf || t.dataset.step || t.dataset.clue) storyLight(); });
  /* drag a quest onto another quest or chapter: new order / new chapter; drag a chapter onto another: new order */
  let dragId = null;
  $('stLeft').addEventListener('dragstart', e => { const q = e.target.closest('[data-q]'), c = e.target.closest('[data-ch]'); dragId = q ? 'q:' + q.dataset.q : c ? 'c:' + c.dataset.ch : null; if (dragId) e.dataTransfer.setData('text/plain', dragId); e.stopPropagation(); });
  $('stLeft').addEventListener('dragover', e => { if (dragId) e.preventDefault(); });
  $('stLeft').addEventListener('drop', e => {
    e.preventDefault(); if (!dragId) return; const P = plan(), tq = e.target.closest('[data-q]'), tc = e.target.closest('[data-ch]');
    if (dragId.startsWith('q:')) { const f = findQ(dragId.slice(2)); if (!f || !tc) return; const to = findC(tc.dataset.ch); f.c.quests = f.c.quests.filter(x => x !== f.q); let i = to.quests.length; if (tq && tq.dataset.q !== f.q.id) { const j = to.quests.findIndex(x => x.id === tq.dataset.q); if (j >= 0) i = j; } to.quests.splice(i, 0, f.q); }
    else if (tc) { const a = findC(dragId.slice(2)), b2 = findC(tc.dataset.ch); if (a && b2 && a !== b2) { P.chapters = P.chapters.filter(x => x !== a); P.chapters.splice(P.chapters.indexOf(b2), 0, a); } }
    dragId = null; storySave();
  });
  /* the map: drag = pan, wheel = zoom, drag a pin = move it, click = pick */
  const cv = $('stMap'), pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => { const [sx, sy] = pos(e), hit = ST.pick ? null : mapHit(sx, sy); MV.drag = { sx, sy, cx: MV.cx, cy: MV.cy, hit, moved: false }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => {
    const [sx, sy] = pos(e), d = MV.drag;
    if (!d) { const h = mapHit(sx, sy), was = MV.hover; MV.hover = h && h.kind === 'quest' ? h : null; cv.style.cursor = ST.pick ? 'crosshair' : h ? 'pointer' : 'grab'; if ((was && was.q) !== (MV.hover && MV.hover.q) || MV.hover) storyDrawMap(); return; }
    if (Math.hypot(sx - d.sx, sy - d.sy) > 4) d.moved = true; if (!d.moved) return;
    if (d.hit) { const [mx, my] = s2m(sx, sy), pt = { x: +mx.toFixed(2), y: +my.toFixed(2) }; if (d.hit.kind === 'quest') { const f = findQ(d.hit.q); if (f) f.q.at = pt; } else { const f = findQ(d.hit.q), s = f && f.q.steps.find(x => x.id === d.hit.s); if (s) s.at = pt; } storyDrawMap(); return; }
    MV.cx = d.cx - (sx - d.sx) / MV.k; MV.cy = d.cy - (sy - d.sy) / MV.k; storyDrawMap();
  });
  cv.addEventListener('pointerup', e => {
    const d = MV.drag; MV.drag = null; if (!d) return; const [sx, sy] = pos(e), [mx, my] = s2m(sx, sy), pt = { x: +mx.toFixed(2), y: +my.toFixed(2) };
    if (d.hit && d.moved) { if (d.hit.kind === 'quest') { const f = findQ(d.hit.q); if (f && !f.q.where) f.q.where = nearestPlace(mx, my) || ''; } storySave(); return; }
    if (d.moved) return;
    if (ST.pick) { const pk = ST.pick; ST.pick = null; const near = nearestPlace(mx, my);
      if (pk.kind === 'quest') { const f = findQ(pk.q); if (f) { f.q.at = pt; if (near) f.q.where = near; } }
      else if (pk.kind === 'step') { const f = findQ(pk.q), s = f && f.q.steps.find(x => x.id === pk.s); if (s) s.at = pt; }
      else if (pk.kind === 'zone') { const c = findC(pk.c); if (c && near) c.zone = 'z:' + zoneOfRef(near); }
      storySave(); return; }
    if (d.hit) { ST.sel = { kind: 'quest', id: d.hit.q }; storyRender(); }
  });
  cv.addEventListener('wheel', e => { e.preventDefault(); const [sx, sy] = pos(e), [mx, my] = s2m(sx, sy), f = Math.exp(-e.deltaY * .0015); MV.k = clamp(MV.k * f, 3, 90); const [nx, ny] = s2m(sx, sy); MV.cx += mx - nx; MV.cy += my - ny; storyDrawMap(); }, { passive: false });
  window.addEventListener('resize', () => { if (ST.open) storyDrawMap(); });
  document.addEventListener('keydown', e => { if (!ST.open || !$('modal').hidden) return; if (e.key === 'Escape') { if (ST.pick) { ST.pick = null; storyDrawMap(); } else if (!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '')) { ST.sel = null; storyRender(); } } }, true);
}
function storyExport() {
  const P = plan(), pl = r => { const p = placeOf(r); return p ? p.n : ''; };
  const out = { kind: 'entropy-wars-story-plan', v: 1, at: new Date().toISOString(), answers: Object.fromEntries(Object.entries(P.ans).map(([k, v]) => [k, { q: SPINE_BY[k][1], a: v }])), bands: P.bands,
    chapters: P.chapters.map((c, i) => ({ no: i + 1, id: c.id, name: c.name, band: c.band, step: c.step ? STEPS9[c.step - 1] : '', goal: c.goal, zone: c.zone, zoneName: pl(c.zone), enemies: c.enemies.map(id => ({ id, name: entName(id) })), mechanics: c.mech, newMechanics: newMech(i), boss: c.boss ? { id: c.boss, name: entName(c.boss) } : null, bossNote: c.bossText, reward: c.reward, trust: c.trust, lie: c.lie, notes: c.notes,
      quests: c.quests.map(q => ({ id: q.game || q.id, title: q.name, kind: q.kind, where: q.where, whereName: pl(q.where), at: q.at, underground: qUnder(q), summary: q.summary, stages: q.steps.map((s, j) => ({ id: 's' + (j + 1), objective: s.text, at: s.at })), cast: q.cast.map(id => ({ id, name: entName(id) })), scenes: q.scenes, reward: q.reward, notes: q.notes })) })),
    clues: P.clues.map(k => ({ text: k.text, planted: chNo(k.plant) || null, paysOff: chNo(k.pay) || null })) };
  const txt = JSON.stringify(out, null, 2);
  modal('<h2>Export the story plan</h2><textarea class="inp code" readonly>' + esc(txt) + '</textarea><div class="acts"><button class="btn" data-x="copy">Copy</button><button class="btn" data-x="save">Save file</button><button class="btn pri" data-x="cancel">Done</button></div>', d => d.addEventListener('click', e => { const x = e.target.dataset.x; if (x === 'copy') copyText(d.querySelector('textarea')); else if (x === 'save') saveFile('Entropy_Wars_Story_Plan_' + new Date().toISOString().slice(0, 10) + '.json', txt); else if (x === 'cancel') closeModal(); }));
}
bindStory();
$('btnStory').addEventListener('click', () => storyOpen(true));
window.__ewStory = { ST, MV, plan, storyOpen, storyRender, noticed };

/* ───────── boot ───────── */
S = loadLocal(); B = S.boards[S.active];
initWhere();
$('legend').open = S.ui.legend === true && !window.matchMedia('(max-width: 860px)').matches;
ensureView(); fit(true); pushHist(); renderAll(); setSave();
requestAnimationFrame(() => { if (!drag) fit(); });
if (S.ui.story) { ST.tab = /^(map|beat|spine)$/.test(S.ui.storyTab) ? S.ui.storyTab : 'map'; storyOpen(true); }
cloudInit();
window.__ewWeb = { get state() { return S; }, gameExport, defence, hooks, cloud };
})();
