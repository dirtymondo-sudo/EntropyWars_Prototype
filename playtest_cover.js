// playtest_cover.js — THE COVER PROBE (2026-11-26, repo-only dev tooling, never uploaded to R2).
// A real VS CPU battle (P1 played by playtest.js's tactics, real CDN assets) with a sampler on every drawn frame: for the
// caster, the target and every body the frame guard holds it casts real rays from the lens at three heights and records
// what stands in front (a room piece, a prop, another body; a faded piece is not cover), whether the body is in the frame,
// and the pick (ThreeCamera.clearShotState()). Needs the server (npm start). Never run two probes at once.
//   MAP=prebuilt_downtown_delta TAG=run1 MINUTES=6 node playtest_cover.js      -> shots/occ/run1.json + run1_blk*.png
//   node playtest_cover_report.js ./shots/occ/run1.json                         -> the percentages, what covered, the picks
//   FLAGS=EW_NO_CLEAR_SHOT ...   = the same battle code with THE CLEAR SHOT off (the A side of an A/B)
//   LISTMAPS=1 = print the map ids. STAGE=1 = staged casts beside a blocker box, old vs new. FIELD=<room> = experimental.
// Notes: docs/notes/spells-vfx.md "THE CLEAR SHOT".
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const OUT = path.join(__dirname, 'shots', 'occ'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'base';
const MAP = process.env.MAP || '';
const MINUTES = +(process.env.MINUTES || 8);
const FLAGS = (process.env.FLAGS || '').split(',').filter(Boolean);
const MAXPICS = +(process.env.PICS || 14);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TURN_FN = eval('(' + fs.readFileSync(path.join(REPO, 'playtest.js'), 'utf8').match(/const TURN_FN = ([\s\S]*?\n\});\n/)[1].replace(/\);\s*$/, '') + ')');

const SAMPLER = () => {
  if (window.__occ) return 'had';
  const O = window.__occ = { samples: [], n: 0, want: null, picN: 0, err: null };
  const R = ThreeRenderer.hq.dev.renderer();
  const rc = new THREE.Raycaster();
  const v = new THREE.Vector3(), eye = new THREE.Vector3(), p = new THREE.Vector3(), d = new THREE.Vector3();
  const upos = [0, 0, 0];
  let last = 0;
  const vis = (o) => { for (let a = o; a; a = a.parent) if (a.visible === false) return false; return true; };
  const pathOf = (o) => { const names = []; let top = o; for (let a = o; a && a.parent; a = a.parent) { if (a.name) names.push(a.name); top = a; } return { top: top.name || top.type, near: names[0] || o.type, chain: names.slice(0, 4).join('<') }; };
  const flagsOf = (o) => { const f = []; for (let a = o; a && a.parent; a = a.parent) { for (const k in a) { if (k.charAt(0) === '_' && k.indexOf('_ew') === 0 && a[k] === true) f.push(k); } if (a.userData) { if (a.userData.unitId != null) f.push('unitId:' + a.userData.unitId); } } return f.slice(0, 5).join(','); };
  function unitBox(u) {
    if (!u || u.dead) return null;
    if (!ThreeRenderer.getUnitWorldPos(u.id, upos)) return null;
    const ts = CONFIG.tileSize;
    const h = (ThreeRenderer.getUnitVisualHeight ? ThreeRenderer.getUnitVisualHeight(u.id) : 0) || ts * 0.9;
    return { id: u.id, name: u.name || u.cls, x: upos[0], y: upos[1], z: upos[2], h: h, r: ts * 0.42 };
  }
  function sample(scene, cam) {
    const C = camera, st = GAME.state;
    if (!st || st.phase !== 'battle') return;
    const cine = C._cineShotId != null;
    const subs = [];
    const ub = id => { const u = st.units.find(x => x.id === id); return unitBox(u); };
    if (cine) {
      const c = ub(C._cineShotUnitId); if (c) { c.role = 'caster'; subs.push(c); }
      const t = C._cineShotTarget;
      if (t && t.id != null && t.id !== C._cineShotUnitId) { const b = ub(t.id); if (b) { b.role = 'target'; subs.push(b); } }
      try { const gs = C._frameGuard && C._frameGuard.subjects ? C._frameGuard.subjects() : null; if (gs) for (const g of gs) { if (!subs.some(s => s.id === g.id)) { const b = ub(g.id); if (b) { b.role = 'guard'; subs.push(b); } } } } catch (e) {}
    } else {
      const b = ub(st._blitzActiveUnitId); if (b) { b.role = 'active'; subs.push(b); }
    }
    if (!subs.length) return;
    cam.getWorldPosition(eye);
    rc.layers.mask = cam.layers.mask; rc.camera = cam;
    const all = st.units.map(unitBox).filter(Boolean);
    O.ticks = (O.ticks || 0) + 1; if (cine) O.cineTicks = (O.cineTicks || 0) + 1;
    const rec = { t: Math.round(performance.now()), cine: cine, shot: C._cineShotId, tps: !!C._cineTps, tilt: Math.round(C.tilt || 0), zoom: +(C.zoom || 0).toFixed(2), cs: (ThreeCamera.clearShotState && ThreeCamera.clearShotState()) || null, ca: (ThreeCamera.clearAngleState && ThreeCamera.clearAngleState()) || null, spell: (window.SpellDirector && SpellDirector.log && SpellDirector.log.length) ? (SpellDirector.log[SpellDirector.log.length - 1].spell || SpellDirector.log[SpellDirector.log.length - 1].id || null) : null, subs: [] };
    let worst = 0;
    const cv = R.domElement.getBoundingClientRect();
    const doms = [];
    try { for (const el of document.querySelectorAll('body *')) {
      if (el.tagName === 'CANVAS' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      let txt = false; for (const n of el.childNodes) { if (n.nodeType === 3 && n.nodeValue.trim()) { txt = true; break; } }
      if (!txt && el.tagName !== 'IMG') continue;
      const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.bottom < cv.top || r.top > cv.bottom) continue;
      if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      let op = 1; for (let a = el; a && a !== document.body; a = a.parentElement) { op *= +getComputedStyle(a).opacity; if (op < 0.3) break; } if (op < 0.3) continue;
      let k = ''; for (let a = el, i = 0; a && a !== document.body && i < 3; a = a.parentElement, i++) k += (a.id ? '#' + a.id : '') + '.' + String(a.className && a.className.baseVal !== undefined ? a.className.baseVal : a.className).split(' ').slice(0, 2).join('.') + '<';
      doms.push({ r: r, k: k.slice(0, 90) });
    } } catch (e) { O.err = 'dom ' + e.message; }
    for (const s of subs) {
      const out = { id: s.id, name: s.name, role: s.role, pts: 0, on: 0, blocked: 0, faded: 0, by: [] };
      for (const f of [0.25, 0.55, 0.9]) {
        p.set(s.x, s.y + s.h * f, s.z);
        v.copy(p).project(cam);
        out.pts++;
        if (Math.abs(v.x) > 1 || Math.abs(v.y) > 1 || v.z > 1) continue;
        out.on++;
        d.copy(p).sub(eye); const dist = d.length(); d.multiplyScalar(1 / dist);
        rc.set(eye, d); rc.near = 0.01; rc.far = dist - s.r * 1.2;
        let hits = [];
        scene.traverse(o => { if ((o.isMesh || o.isSprite) && o.visible !== false) { try { rc.intersectObject(o, false, hits); } catch (e) { O.errN = (O.errN || 0) + 1; O.errs = O.errs || {}; const k = (o.type + '|' + (o.name || (o.parent && o.parent.name) || '') + '|' + String(e.message).slice(0, 50)); O.errs[k] = (O.errs[k] || 0) + 1; } } });
        hits.sort((a, b) => a.distance - b.distance);
        let hard = null, soft = null, fxHit = null;
        for (const h of hits) {
          const o = h.object;
          if (!o.isMesh && !o.isSprite) continue;
          if (!vis(o)) continue;
          let m = o.material; if (Array.isArray(m)) m = m[(h.face && h.face.materialIndex) || 0] || m[0];
          if (!m || m.visible === false || m.colorWrite === false) continue;
          // the subject's own body
          if (Math.hypot(h.point.x - s.x, h.point.z - s.z) < s.r * 1.5 && h.point.y > s.y - 4 && h.point.y < s.y + s.h * 1.3) continue;
          const op = (m.transparent ? (m.opacity == null ? 1 : m.opacity) : 1);
          const fx = o.isSprite || m.blending === THREE.AdditiveBlending || (m.transparent && m.depthWrite === false);
          let cat = fx ? 'fx' : null, who = null;
          if (!cat) for (const b of all) { if (b.id !== s.id && Math.hypot(h.point.x - b.x, h.point.z - b.z) < b.r * 1.6 && h.point.y > b.y - 4 && h.point.y < b.y + b.h * 1.3) { cat = 'unit'; who = b.name; break; } }
          const P = pathOf(o);
          const e = { cat: cat || 'world', who: who, top: P.top, near: P.near, chain: P.chain, fl: flagsOf(o), op: +op.toFixed(2), at: +(h.distance / dist).toFixed(2), mt: m.type };
          if (fx) { if (op >= 0.3 && !fxHit) fxHit = { near: P.near, chain: P.chain, op: e.op, sprite: !!o.isSprite, add: m.blending === THREE.AdditiveBlending, at: e.at, tex: !!m.map }; continue; }
          if (op >= 0.5) { hard = e; break; }
          if (!soft) soft = e;
        }
        if (hard) { out.blocked++; out.by.push(hard); }
        else if (soft) { out.faded++; out.by.push(soft); }
        if (fxHit) { out.fx = (out.fx || 0) + 1; (out.fxBy = out.fxBy || []).push(fxHit); }
        { const sx = (v.x * 0.5 + 0.5) * cv.width + cv.left, sy = (-v.y * 0.5 + 0.5) * cv.height + cv.top; for (const D of doms) { if (sx >= D.r.left && sx <= D.r.right && sy >= D.r.top && sy <= D.r.bottom) { out.dom = (out.dom || 0) + 1; (out.domBy = out.domBy || []).push(D.k); break; } } }
      }
      if (out.on) worst = Math.max(worst, out.blocked / out.on); if (out.on) rec.any = Math.max(rec.any || 0, Math.max(out.blocked, out.fx || 0, out.dom || 0) / out.on);
      rec.subs.push(out);
    }
    rec.worst = +worst.toFixed(2);
    O.samples.push(rec); O.n++;
    if (cine && (rec.any || 0) >= 0.66 && !O.want) O.want = { i: O.samples.length - 1, shot: rec.shot };
  }
  const orig = R.render;
  R.render = function (scene, cam) {
    const r = orig.apply(this, arguments);
    try {
      const now = performance.now();
      if (cam === ThreeCamera.getCamera() && scene && scene.isScene && now - last > 90 && !window.__ewHold) { last = now; sample(scene, cam); }
    } catch (e) { O.err = String(e && e.message); }
    return r;
  };
  return 'ok';
};

(async () => {
  const browser = await require(path.join(REPO, 'probe-fast.js')).launch(chromium, { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((flags) => { try { localStorage.setItem('ew_cinematicActionCam', '1'); } catch (e) {} for (const f of flags) { const [k, val] = f.split('='); window[k] = val === undefined ? true : (isNaN(+val) ? val : +val); } }, FLAGS);
  const page = await ctx.newPage();
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/Raycaster/.test(t) && !/Failed to load resource|ERR_/.test(t)) console.log('CONERR', t.slice(0, 200)); });
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0].slice(0, 200)));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 120; i++) { if (await page.evaluate(() => typeof window._goToVsCpu === 'function' && !!window.GAME).catch(() => false)) break; await sleep(1000); }
  await sleep(4000);
  console.log('build', await page.evaluate(() => JSON.stringify(window.EW_BUILD || null)));
  await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; });
  if (process.env.FIELD) {
    const room = process.env.FIELD;
    await page.evaluate((room) => { window._hqEnter({ from: 'play', room }); }, room);
    await require(path.join(REPO, 'probe-fast.js')).roomReady(page, { timeout: 240000 });
    await page.evaluate(() => { try { window._hqResume(); } catch (e) {} ThreeRenderer.hq.setPaused(false); const h = document.getElementById('hqLoad'); if (h) h.style.display = 'none'; });
    await sleep(3000);
    const pre = await page.evaluate(() => {
      const H = ThreeRenderer.hq; const L = H.dev.chars();
      const C = (Array.isArray(L) ? L : []).filter(c => c && c.kind === 'npc' && c.race && !c.cast && !c.away);
      const ch = C[+(window.__spot || 0)]; if (!ch) return { err: 'no npc', sample: JSON.stringify(L && L[0]).slice(0, 300), n: L && L.length };
      H.dev.teleport({ x: ch.x - 1.2, z: ch.z, y: ch.y || 0, face: 90, pitch: -0.25, fp: false, dist: 3.5 });
      return { ch: { x: ch.x, y: ch.y, z: ch.z, race: ch.race, id: ch.id }, n: C.length };
    });
    console.log('PRE', JSON.stringify(pre));
    await sleep(2500);
    await page.evaluate(() => { try { window._hqResume(); } catch (e) {} ThreeRenderer.hq.setPaused(false); const h = document.getElementById('hqLoad'); if (h) h.style.display = 'none'; });
    await sleep(1000);
    console.log('AIM', await page.evaluate(() => JSON.stringify(ThreeRenderer.hq.encounterAim())));
    console.log('STRIKE', await page.evaluate(() => JSON.stringify(ThreeRenderer.hq.strike())));
    for (let i = 0; i < 60; i++) { const ok = await page.evaluate(() => { try { return String(activeGameMode).indexOf('field:') === 0 && GAME.state.phase === 'battle' && GAME.state.round >= 1; } catch (e) { return false; } }); if (ok) break; await sleep(1000); }
    await sleep(4000); await page.screenshot({ path: `${OUT}/${TAG}_afterstrike.png` });
    console.log('ui', await page.evaluate(() => JSON.stringify([...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => (b.className + ':' + (b.innerText || '').trim().slice(0, 24))).slice(0, 30))));
    for (let i = 0; i < 6; i++) { if (await page.evaluate(() => GAME.state.phase) === 'battle') break; await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => x.offsetParent && /SEAL YOUR FATE|BEGIN|FIGHT|START|DEPLOY|READY/i.test(x.innerText)); if (b) b.click(); }); await sleep(2500); }
    console.log('field', await page.evaluate(() => JSON.stringify([String(activeGameMode), GAME.state.phase, GAME.state.round, GAME.bw(), GAME.bh(), GAME.state.units.map(u => u.player + ':' + (u.name || u.race))])));
  } else {
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);
  const maps = await page.evaluate(() => { try { return MS_MAP_LIST.map((m, i) => i + ':' + (m.modeId || m.id) + ':' + (m.label || m.name || '')); } catch (e) { return 'err ' + e.message; } });
  if (process.env.LISTMAPS) { console.log(JSON.stringify(maps)); await browser.close(); return; }
  const launched = await page.evaluate((id) => {
    try {
      const mi = id ? MS_MAP_LIST.findIndex(x => x.modeId === id || x.id === id) : -1;
      if (mi >= 0) _msSelectedMap = mi;
      const gi = MS_GAME_MODES.findIndex(x => x.id === 'tdm'); if (gi >= 0) _msSelectedGM = gi;
      if (typeof window._msConfirm === 'function') { window._msConfirm(); return 'confirm map ' + mi; }
    } catch (e) { return 'err:' + e.message; }
    return 'none';
  }, MAP);
  console.log('launch', launched);
  await sleep(2500);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => /SEAL YOUR FATE/i.test(x.innerText)); if (b) b.click(); }); await sleep(1500); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'ai' }; });
  { let ok = 0; for (let i = 0; i < 90 && ok < 6; i++) { await sleep(1000); const ph = await page.evaluate(() => GAME.state.phase); if (ph === 'battle') ok++; else { ok = 0; if (i % 8 === 7) { console.log('restart match (phase ' + ph + ')'); await page.evaluate(() => { const st = GAME.state; try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} }); } } } }
  }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'ai' }; });
  await sleep(8000);
  console.log('cam before', await page.evaluate(() => JSON.stringify([GAME.state.cinematicActionCam, GAME.state._aiTurbo, GAME.state.devAutoSim, localStorage.getItem('ew_cinematicActionCam')])));
  
  console.log('sampler', await page.evaluate(SAMPLER));
  const meta = await page.evaluate(() => { const st = GAME.state; return { map: st.mapId || st.selectedMapId || null, cine: st.cinematicActionCam, w: GAME.bw(), h: GAME.bh(), p1: st.units.filter(u => u.player === 1).map(u => u.name || u.cls), p2: st.units.filter(u => u.player === 2).map(u => u.name || u.cls) }; });
  console.log('meta', JSON.stringify(meta));
  await page.screenshot({ path: `${OUT}/${TAG}_start.png` });

  if (process.env.STAGE) {
    await page.evaluate(() => { const st = GAME.state; st.controllers = { 1: 'local', 2: 'local' }; st.autoPlayers = {}; });
    await sleep(1500);
    const scen = await page.evaluate(() => {
      const ts = CONFIG.tileSize, W = GAME.bw(), H = GAME.bh(), st = GAME.state;
      const B = ThreeRenderer.shotBlockers() || [], out = [], seen = {};
      const hAt = (x, y) => (st.boardHeights && st.boardHeights[y] && st.boardHeights[y][x]) || 0;
      const boxAt = (x, y) => { const cx = (x + 0.5) * ts, cz = (y + 0.5) * ts; for (let i = 0; i < B.length; i += 7) if (cx > B[i] - ts * 0.3 && cx < B[i + 1] + ts * 0.3 && cz > B[i + 4] - ts * 0.3 && cz < B[i + 5] + ts * 0.3) return true; return false; };
      for (let i = 0; i < B.length; i += 7) {
        const w = (B[i + 1] - B[i]) / ts, d = (B[i + 5] - B[i + 4]) / ts, h = (B[i + 3] - B[i + 2]) / ts;
        const bx = Math.floor((B[i] + B[i + 1]) / 2 / ts), by = Math.floor((B[i + 4] + B[i + 5]) / 2 / ts);
        if (bx < -3 || by < -3 || bx >= W + 3 || by >= H + 3) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          let k = 1; while (k < 4 && (bx + dx * k < 0 || by + dy * k < 0 || bx + dx * k >= W || by + dy * k >= H)) k++;
          const c = [bx + dx * k, by + dy * k], t = [c[0] + dx * 3, c[1] + dy * 3];
          const key = c + '>' + t; if (seen[key]) continue; seen[key] = 1;
          if (c[0] < 0 || c[1] < 0 || c[0] >= W || c[1] >= H || t[0] < 0 || t[1] < 0 || t[0] >= W || t[1] >= H) continue;
          if (boxAt(c[0], c[1]) || boxAt(t[0], t[1])) continue;
          if (Math.abs(hAt(c[0], c[1]) - hAt(t[0], t[1])) > 1) continue;
          let pass = true; try { if (typeof isTerrainPassable === 'function') pass = isTerrainPassable(c[0], c[1]) && isTerrainPassable(t[0], t[1]); } catch (e) {}
          if (!pass) continue;
          out.push({ c, t, box: [bx, by], w: +w.toFixed(1), d: +d.toFixed(1), h: +h.toFixed(1), tree: B[i + 6] });
        }
      }
      return { n: B.length / 7, out };
    });
    console.log('boxes', scen.n, 'scenarios', scen.out.length);
    console.log('BOXDUMP', await page.evaluate(() => { const ts = CONFIG.tileSize, B = ThreeRenderer.shotBlockers(); const o = []; for (let i = 0; i < B.length; i += 7) o.push([(B[i] / ts).toFixed(1), (B[i + 1] / ts).toFixed(1), (B[i + 4] / ts).toFixed(1), (B[i + 5] / ts).toFixed(1), (B[i + 2] / ts).toFixed(1), (B[i + 3] / ts).toFixed(1), B[i + 6]].join(' ')); return o.join(' | '); }));
    if (process.env.DUMPONLY) { await browser.close(); return; }
    const list = scen.out.filter(s => !s.tree && s.h >= 0.7).concat(scen.out.filter(s => s.tree)).slice(0, +(process.env.NSCEN || 8));
    const cast = async (sc, noClear, tag) => {
      const r = await page.evaluate(({ sc, noClear }) => {
        const st = GAME.state;
        window.EW_NO_CLEAR_SHOT = !!noClear;
        const caster = st.units.find(u => u.player === 1 && (!u.dead || u.__staged)), dummy = st.units.find(u => u.player === 2 && (!u.dead || u.__staged));
        if (!caster || !dummy) return { err: 'no units' };
        for (const u of st.units) if (!u.dead && u !== caster && u !== dummy) { u.dead = true; u.hp = 0; }
        caster.__staged = dummy.__staged = true;
        const put = (u, x, y) => { u.x = x; u.y = y; try { u.z = getHeightAt(x, y); } catch (e) { u.z = 0; } };
        put(caster, sc.c[0], sc.c[1]); put(dummy, sc.t[0], sc.t[1]);
        dummy.maxHp = 99999; dummy.hp = 99999; caster.ap = 9; caster.mp = 9999; caster.maxMp = 9999; caster.hp = caster.maxHp;
        st._blitzActiveUnitId = caster.id; st.activePlayer = 1; st.selectedUnitId = caster.id;
        st.cinematicActionCam = true; st.fogOfWar = false;
        let sp = (caster.spells || []).find(s => /^(damage|line|multiHit)$/.test(s.kind)) || (caster.spells || [])[0];
        if (!sp) return { err: 'no spell' };
        sp.cost = 0; sp.range = Math.max(sp.range || 0, 30); caster._spellCooldowns = {}; caster._spellsUsedThisTurn = {};
        try { ThreeRenderer.invalidateUnits && ThreeRenderer.invalidateUnits(); GAME.markDirty(); GAME.renderIfDirty && GAME.renderIfDirty(); } catch (e) {}
        window.__occ.samples.length = 0;
        return { caster: caster.name, dummy: dummy.name, spell: sp.name, kind: sp.kind };
      }, { sc, noClear });
      if (r.err) return r;
      await sleep(2500);
      r.ret = await page.evaluate(({ sc }) => { const st = GAME.state; const caster = st.units.find(u => u.id === st._blitzActiveUnitId); const sp = (caster.spells || []).find(s => /^(damage|line|multiHit)$/.test(s.kind)) || caster.spells[0]; st.selectedTool = sp.name; st.actionMode = 'spell'; const L0 = st.logEntries.length; let ret; try { ret = GAME.doSpell(caster, sc.t[0], sc.t[1], undefined); } catch (e) { ret = 'err ' + e.message; } st.selectedTool = null; st.actionMode = null; return String(ret) + ' ' + st.logEntries.slice(L0).map(e => typeof e === 'string' ? e : e.m).join(' / ').slice(0, 120); }, { sc });
      const t0 = Date.now(); let n = 0, sawShot = false;
      while (Date.now() - t0 < 14000) {
        const live = await page.evaluate(() => camera._cineShotId != null);
        if (live) sawShot = true;
        if (sawShot && !live) break;
        if (live && n < 3 && Date.now() - t0 > [700, 2200, 3800][n]) { n++; await page.screenshot({ path: `${OUT}/${tag}_${n}.png` }); }
        await sleep(120);
      }
      const S = await page.evaluate(() => window.__occ.samples.filter(s => s.cine));
      let on = 0, bl = 0; const by = {}; for (const s of S) for (const u of s.subs) { on += u.on; bl += u.blocked; for (const b of u.by) if (b.op >= 0.5) by[b.near || b.top] = (by[b.near || b.top] || 0) + 1; }
      r.samples = S.length; r.on = on; r.blocked = bl; r.by = by; r.cs = S.length ? S[S.length - 1].cs : null; r.picks = [...new Set(S.map(s => s.cs ? s.cs.yaw + '/' + s.cs.tilt + ' own' + s.cs.own + ' cost' + s.cs.cost : ''))].join(' | ');
      await sleep(1500);
      return r;
    };
    const res = [];
    for (let i = 0; i < list.length; i++) {
      const sc = list[i];
      const oldR = await cast(sc, true, `${TAG}_s${i}_old`);
      const newR = await cast(sc, false, `${TAG}_s${i}_new`);
      console.log('SCEN', i, JSON.stringify(sc), '\n  OLD', JSON.stringify(oldR), '\n  NEW', JSON.stringify(newR));
      res.push({ sc, oldR, newR });
    }
    fs.writeFileSync(`${OUT}/${TAG}_stage.json`, JSON.stringify(res));
    await browser.close(); return;
  }
  const start = Date.now(); let pics = 0, stalls = 0, lastShot = null;
  while (Date.now() - start < MINUTES * 60000) {
    const w = await page.evaluate(() => { const O = window.__occ; const w = O.want; return w ? { i: w.i, shot: w.shot } : null; });
    if (w) {
      if (pics < MAXPICS && w.shot !== lastShot) { lastShot = w.shot; pics++; try { await page.screenshot({ path: `${OUT}/${TAG}_blk${String(pics).padStart(2, '0')}_s${w.i}.png` }); } catch (e) {} }
      await page.evaluate(() => { window.__occ.want = null; });
    }
    const r = await page.evaluate(TURN_FN).catch(e => ({ status: 'err', e: String(e.message).slice(0, 80) }));
    const st = await page.evaluate(() => { const s = window.GAME.state; return { round: s.round, winner: s.winner }; });
    if (st.winner != null) { console.log('winner', st.winner); break; }
    if (r.status === 'played') { stalls = 0; await sleep(300); }
    else if (r.status === 'ai-turn') { await page.evaluate(() => { try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(380); stalls = 0; }
    else { await page.evaluate(() => { try { window.maybeAdvanceTurn(); } catch (e) {} try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(350); if (stalls === 40) { console.log('stall', JSON.stringify(r), await page.evaluate(() => { const s = GAME.state; return JSON.stringify({ a: s._blitzActiveUnitId, ph: s.phase, rd: s.round, intro: !!s._introCine, cinePresent: (typeof isCinematicPresent === 'function') && isCinematicPresent(), shot: camera._cineShotId, busy: s.busy, anim: s.animating, lock: s.inputLocked, ov: [...document.querySelectorAll('.overlay,.modal,[class*=intro],[class*=banner]')].filter(e => e.offsetParent).map(e => e.className).slice(0, 6) }); })); await page.screenshot({ path: `${OUT}/${TAG}_stall.png` }); } if (++stalls > 200) { console.log('stalled'); break; } }
  }
  const data = await page.evaluate(() => ({ samples: window.__occ.samples, err: window.__occ.err, round: GAME.state.round }));
  fs.writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify({ meta, data }));
  console.log('cine now', await page.evaluate(() => JSON.stringify([GAME.state.cinematicActionCam, window.__occ.ticks, window.__occ.cineTicks, window.__occ.errN])));
  console.log('errs', await page.evaluate(() => JSON.stringify(Object.entries(window.__occ.errs || {}).sort((a, b) => b[1] - a[1]).slice(0, 12))));
  console.log('samples', data.samples.length, 'err', data.err, 'round', data.round, 'pics', pics);
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
