s=open('app.js').read()
L=s.split('\n')
def find(prefix, start=0):
    for i in range(start,len(L)):
        if L[i].startswith(prefix): return i
    raise Exception(prefix)
a=find("function rosterMatch(r) {"); b=find("function initWhere()")
new = r'''function rosterMatch(e) {
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
}'''.split('\n')
L[a:b]=new
a=find("function addRaces(keys, at) {"); b=find("function addNote()")
new=r'''function addEntries(ids, at) {
  ids = ids.filter(id => ENT[id] && !B.nodes[id]); if (!ids.length) return 0;
  const c = at || viewCentre(), taken = takenList();
  ids.forEach((id, i) => { const e = ENT[id], p = at && i === 0 ? { x: Math.round(at.x), y: Math.round(at.y) } : freeSpot(c, taken); taken.push(p);
    B.nodes[id] = e.kind === 'cast' ? { id, kind: 'cast', cast: e.c.id, x: p.x, y: p.y, note: '' } : Object.assign({ id, kind: 'race', race: e.r.k, x: p.x, y: p.y, note: '' }, e.r.v.length > 1 ? { g: e.v.g } : {}); });
  if (ids.length === 1) sel = { kind: 'node', id: ids[0] };
  commit();
  if (ids.length > 1) { toast('Pinned ' + ids.length); fit(); }
  return ids.length;
}'''.split('\n')
L[a:b]=new
a=find("$('rlist').addEventListener('pointerdown'"); b=find("$('q').addEventListener('input'")
new=r'''$('rlist').addEventListener('pointerdown', e => { const t = e.target.closest('.tile'); if (!t || e.pointerType === 'touch' || e.button !== 0) return; rdrag = { k: t.dataset.id, sx: e.clientX, sy: e.clientY, on: false }; });
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
});'''.split('\n')
L[a:b]=new
s='\n'.join(L)
def rep(a,b):
    global s
    assert a in s, a[:80]
    s=s.replace(a,b)
rep("$('addShown').addEventListener('click', () => { addRaces(shown.slice()); });","$('addShown').addEventListener('click', () => { addEntries(shown.slice()); });")
rep("const k = mode === 'home' ? ((o.race && o.race.home) || 'Elsewhere')","const k = mode === 'home' ? ((o.race && o.race.home) || (o.cast && (o.cast.rooms[0] || GRP_NAME[o.cast.grp])) || 'Elsewhere')")
rep("(r ? '<span class=\"key\">race key: ' + esc(r.k) + '</span>' : '<span class=\"key\">custom ' + esc(n.shape || 'character') + '</span>')",
    "(r ? '<span class=\"key\">race key: ' + esc(r.k) + (r.v.length > 1 ? ' \\u00b7 gender: ' + o.v.g : '') + '</span>' : cst ? '<span class=\"key\">' + (cst.grp === 'cast' ? 'DOOR_CAST.' : cst.grp === 'boss' ? 'BOSS_DEFS: ' : 'tutorial tape: ') + esc(cst.grp === 'tape' ? cst.raw : cst.id) + '</span>' : '<span class=\"key\">custom ' + esc(n.shape || 'character') + '</span>')")
rep("const n = B.nodes[sel.id], o = info(n), r = o.race, d = defence(B, n.id), name = esc(o.name);","const n = B.nodes[sel.id], o = info(n), r = o.race, cst = o.cast, d = defence(B, n.id), name = esc(o.name);")
rep("(r && r.role ? '<span class=\"badge\">' + esc(r.role) + '</span>' : '') + '</div>' + (r && r.cs ? '<span class=\"stamp\">' + esc(r.cs) + '</span>' : '') + '</div></div>';",
    "(r && r.role ? '<span class=\"badge\">' + esc(r.role) + '</span>' : '') + (cst ? '<span class=\"badge\">' + GRP_NAME[cst.grp] + '</span>' : '') + '</div>' + (r && r.cs ? '<span class=\"stamp\">' + esc(r.cs) + '</span>' : '') + '</div></div>';")
rep("      const lore = r.dos || (r.cn ? 'Customs: ' + r.cn + '.' : '');\n      if (lore || r.q.length || r.fin) h += '<div><h4>On file</h4>' + (lore ? '<p style=\"margin:0 0 6px\">' + esc(lore) + '</p>' : '') + r.q.map(",
    "      const lore = r.dos || (r.cn ? 'Customs: ' + r.cn + '.' : ''), qs = o.v.q || r.q;\n      if (o.v.sp) h += '<p class=\"muted\" style=\"margin:0\">This version\\u2019s own spells (RACE_GENDER_SPELLS): ' + esc(o.v.sp.join(', ')) + '</p>';\n      if (r.v.length > 1) h += '<p class=\"muted\" style=\"margin:0\">Other version: ' + esc(r.v.filter(x => x !== o.v).map(x => x.n).join(', ')) + (B.nodes[raceId(r.k, r.v.find(x => x !== o.v).g)] ? ' (on this board)' : '') + '</p>';\n      if (lore || qs.length || r.fin) h += '<div><h4>On file</h4>' + (lore ? '<p style=\"margin:0 0 6px\">' + esc(lore) + '</p>' : '') + qs.map(")
rep("(!lore && !r.q.length && r.fin ?","(!lore && !qs.length && r.fin ?")
rep("    } else {\n      h += '<div class=\"two\"><label class=\"field\"><span>Name</span><input class=\"inp\" id=\"cName\"",
r'''    } else if (cst) {
      const base = cst.race && RACE[cst.race];
      h += '<dl class="facts">' + (cst.title ? '<dt>Title</dt><dd>' + esc(cst.title) + '</dd>' : '') + (cst.dept ? '<dt>Department</dt><dd>' + esc(cst.dept) + '</dd>' : '') + (cst.g ? '<dt>Gender</dt><dd>' + esc(cst.g) + '</dd>' : '') + (base ? '<dt>Race</dt><dd>' + esc(base.n) + ' (' + esc(cst.race) + ')</dd>' : cst.tmpl ? '<dt>Unit template</dt><dd>' + esc(cst.tmpl) + ' (the cast default)</dd>' : '') + (cst.rooms.length ? '<dt>Found in</dt><dd>' + esc(cst.rooms.join('; ')) + '</dd>' : '') + (cst.hidden ? '<dt>Appears</dt><dd>Cutscenes only. Never stands in the building.</dd>' : '') + '<dt>Portrait</dt><dd>' + (cst.ik === 'model' ? 'Taken from this character’s own 3D model' : cst.ik === 'race' ? 'Borrowed from the ' + esc(base ? base.n : cst.race) + ' unit, as the game does' : 'None in the game files') + '</dd></dl>';
      if (cst.desc) h += '<div><h4>On file</h4><p style="margin:0">' + esc(cst.desc) + '</p></div>';
      if (cst.doing.length) h += '<div><h4>At their post</h4>' + cst.doing.map(q => '<p class="quote">' + esc(q) + '</p>').join('') + '</div>';
      const ln = cst.lines.concat(cst.says.map(x => '“' + x + '”').filter(x => !cst.lines.includes(x)));
      if (ln.length) h += '<div><h4>Lines in the game</h4>' + ln.slice(0, 12).map(q => '<p class="quote">' + esc(q) + '</p>').join('') + (ln.length > 12 ? '<p class="muted">and ' + (ln.length - 12) + ' more in the cutscenes</p>' : '') + '</div>';
    } else {
      h += '<div class="two"><label class="field"><span>Name</span><input class="inp" id="cName"''')
rep("temperText(r).map(t => '<li class=\"game\">' + esc(t) + '</li>').join('') + '</ul></div>';",
    "temperText(r).map(t => '<li class=\"game\">' + esc(t) + '</li>').join('') + '</ul></div>';\n    else if (cst && cst.grp === 'cast') h += '<div><h4>Already in the game\\u2019s encounter rules</h4><ul class=\"rel\"><li class=\"game\">Story cast have no temper: they cannot be struck on the walk (HQ_NPC_TEMPERS).</li></ul></div>';")
# game export
a=s.index("function gameExport(all) {"); b=s.index("function act(a) {")
s=s[:a]+r'''function gameExport(all) {
  const boards = all ? S.order.map(id => S.boards[id]).filter(b => !b.sample) : [B];
  /* a reference: race key and gender kept apart; story characters by their own id in the game data */
  const ref = (b, id) => { const n = b.nodes[id];
    if (n.kind === 'race') { const r = RACE[n.race], g = r.v.length > 1 ? n.g : r.v[0].g; return { key: r.v.length > 1 ? n.race + ':' + g : n.race, kind: 'race', race: n.race, gender: g }; }
    if (n.kind === 'cast') { const c = CAST[n.cast]; return { key: 'character:' + c.id, kind: 'character', id: c.id, race: c.race || null, gender: c.g || null }; }
    return { key: 'custom:' + n.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''), kind: 'custom', race: null, gender: null }; };
  const out = { _about: 'Entropy Wars relationship web. `race` values match AVAILABLE_RACES and `gender` is separate (male / female). Story characters are listed in `characters` under their own id from the game data (DOOR_CAST, BOSS_DEFS, the tutorial tape) and referenced as character:<id>. Custom characters are custom:<name>, listed in `custom`. `from` is the one who acts, `to` the one acted on.', version: 2, exported: new Date().toISOString(), boards: boards.map(b => b.name),
    types: Object.fromEntries(TYPES.map(t => [t.id, { effect: t.fx || 'none', means: t.fx ? FX_NOTE[t.fx] : 'no effect on who joins a fight' }])), relations: [], defence: {}, groups: {}, motives: {}, characters: {}, custom: {} };
  const D2 = out.defence, adj = {};
  const side = (o, p, r) => { o[p] = r.kind === 'race' ? r.race : r.key; o[p + 'Kind'] = r.kind; o[p + 'Gender'] = r.gender; return o; };
  boards.forEach(b => {
    Object.values(b.nodes).forEach(n => { if (n.kind === 'note') return; const r = ref(b, n.id);
      if (n.kind === 'custom') out.custom[r.key] = { name: n.name, title: n.sub || '', kind: n.shape, type: n.faction || null, portraitRace: n.race || null };
      if (n.kind === 'cast') { const c = CAST[n.cast]; out.characters[c.id] = { name: c.raw, title: c.title || '', source: c.grp === 'cast' ? 'DOOR_CAST' : c.grp === 'boss' ? 'BOSS_DEFS' : 'TUTORIAL_LESSONS', race: c.race || null, gender: c.g || null }; }
      if (n.note) (out.motives[r.key] = out.motives[r.key] || []).push(n.note); });
    Object.values(b.links).forEach(l => {
      const at = actorTarget(l), f = ref(b, at[0]), t = ref(b, at[1]);
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
'''+s[b:]
rep("<p>Race keys are exactly those in AVAILABLE_RACES. <code>relations</code> is every tie;","<p>Race keys are exactly those in AVAILABLE_RACES, with gender as its own field. Story characters sit in <code>characters</code> under their id from the game data. <code>relations</code> is every tie;")
open('app.js','w').write(s)
t=open('template.html').read()
a=".tile.onb .pic { opacity: .38; }"
assert a in t
t=t.replace(a,""".pair { grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; background: var(--panel2); border-radius: 8px; min-width: 0; }
.pair .tile:hover { background: var(--line); }
.tile.story .pic { border-radius: 22%; }
.tile.onb .pic { opacity: .38; }""")
a=".node.sel .pic {"
assert a in t
t=t.replace(a,".node .boss.story { left: auto; right: 14px; background: var(--accent); color: var(--accent-ink); }\n.node.sel .pic {")
t=t.replace('placeholder="Search 160 units, families, sites…"','placeholder="Search units, story cast, sites…"')
open('template.html','w').write(t)
