// playtest_clutter.js — THE CLUTTER PROBE (2026-11-27, repo-only dev tooling, never uploaded to R2).
// A real VS CPU battle (P1 played by playtest.js's tactics) that, ~0.4 s after each damage number of a live spell shot,
// saves a frame and measures how much of the hit body's box on screen is covered by text: floating pops, name plates,
// the corner TOTAL DMG title, toasts, the log line. Needs the server (npm start). Never run two probes at once.
//   MAP=prebuilt_downtown_delta TAG=before MINUTES=6 node playtest_clutter.js  -> shots/clutter/<TAG>.json + <TAG>_NN.png
// Notes: docs/notes/spells-vfx.md "THE CLEAN READ".
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const OUT = path.join(__dirname, 'shots', 'clutter'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'base';
const MAP = process.env.MAP || '';
const MINUTES = +(process.env.MINUTES || 6);
const FLAGS = (process.env.FLAGS || '').split(',').filter(Boolean);
const MAXPICS = +(process.env.PICS || 16);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TURN_FN = eval('(' + fs.readFileSync(path.join(REPO, 'playtest.js'), 'utf8').match(/const TURN_FN = ([\s\S]*?\n\});\n/)[1].replace(/\);\s*$/, '') + ')');

/* the hook: every pop the game shows, with its tile and kind */
const HOOK = () => {
  if (window.__clt) return 'had';
  const O = window.__clt = { pops: [] };
  const A = window.ThreeAnim; const orig = A.floatingText;
  A.floatingText = function (x, y, text, kind) { try { O.pops.push({ t: performance.now(), x, y, text: String(text), kind, shot: camera._cineShotId }); } catch (e) {} return orig.apply(this, arguments); };
  return 'ok';
};
/* the measure: the body box of the unit on (x, y) on screen, and what text covers it */
const MEASURE = (p) => {
  const st = GAME.state;
  const vis = e => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.15; };
  const popRects = [...document.querySelectorAll('#floatTextOverlay > *')].filter(vis).map(e => {
    const r = e.getBoundingClientRect();
    const bw0 = parseFloat(e.style.width) || e.width || 0, bh0 = parseFloat(e.style.height) || e.height || 0, kx = bw0 ? r.width / bw0 : 1, ky = bh0 ? r.height / bh0 : 1;
    const mL = e._ewMarginL != null ? e._ewMarginL : (e._ewMarginX || 0), mR = e._ewMarginR != null ? e._ewMarginR : (e._ewMarginX || 0);
    return { left: r.left + mL * kx, right: r.right - mR * kx, top: r.top + (e._ewMarginTop || 0) * ky, bottom: r.bottom - (e._ewMarginBot || 0) * ky };
  }).filter(r => r.right > r.left && r.bottom > r.top);
  const titleRects = [...document.querySelectorAll('.acam-title > *')].filter(vis).map(e => e.getBoundingClientRect()).filter(r => r.width > 2 && r.height > 2);
  const hudRects = [...document.querySelectorAll('.ew-scoreboard, .ew-matchmeta, .achieve-toast, .combat-banner')].filter(vis).map(e => e.getBoundingClientRect()).filter(r => r.width > 2 && r.height > 2);
  const inR = (c, rs) => rs.some(r => c[0] >= r.left && c[0] <= r.right && c[1] >= r.top && c[1] <= r.bottom);
  let cells = 0, cp = 0, ct = 0, ch = 0, worst = 0, bodies = 0, sumH = 0;
  for (const u of st.units) {
    if (u.dead) continue;
    const sb = ThreeRenderer.unitScreenBox(u.id); if (!sb || sb.h < innerHeight * 0.04) continue;
    if (sb.x < 0 || sb.x > innerWidth || sb.y < 0 || sb.y > innerHeight) continue;
    bodies++; sumH += sb.h;
    const w = Math.max(sb.h * 0.42, 10), x0 = sb.x - w / 2, y0 = sb.y - sb.h / 2; let n = 0;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      const c = [x0 + (i + 0.5) * w / 6, y0 + (j + 0.5) * sb.h / 6]; cells++;
      const a = inR(c, popRects), t = inR(c, titleRects), h = inR(c, hudRects);
      if (a) cp++; if (t) ct++; if (h) ch++; if (a || t || h) n++;
    }
    worst = Math.max(worst, n / 36);
  }
  const pct = v => cells ? Math.round(1000 * v / cells) / 10 : 0;
  const hb = id => { if (id == null) return null; try { const b = ThreeRenderer.unitScreenBox(id); return b ? Math.round(1000 * b.h / innerHeight) / 10 : null; } catch (e) { return null; } };
  const tu = (typeof unitAt === 'function') ? unitAt(p.x, p.y) : st.units.find(u => u.x === p.x && u.y === p.y);
  const fg = window._ewFrameGuard ? window._ewFrameGuard() : null;
  const sg = window._shotGrammarState ? window._shotGrammarState() : null;
  let pitch = null, ca = null; try { const c = ThreeCamera.getCamera(); const d = new THREE.Vector3(); c.getWorldDirection(d); pitch = Math.round(Math.asin(-d.y) * 57.3); ca = ThreeCamera.clearAngleState(); } catch (e) {}
  const sz = { pitch, ca: ca ? [ca.delta, ca.tilt] : null, tgtH: hb(tu && tu.id), casH: hb(fg && fg.caster), zoom: +(camera.zoom || 0).toFixed(3), tilt: Math.round(camera.tilt || 0), phase: fg && fg.phase, dolly: fg && fg.solve && fg.solve.dolly != null ? Math.round(fg.solve.dolly) : null, nHit: fg ? fg.hit.length : 0, big: fg && fg.solve ? fg.solve.big : null, live: camera._cineShotId != null, log: sg ? sg.log.slice(-3) : null };
  return { ...sz, bodies, bodyH: bodies ? Math.round(100 * sumH / bodies / innerHeight) : 0, pops: pct(cp), title: pct(ct), hud: pct(ch), worst: Math.round(worst * 100), popsUp: popRects.length, hudUp: hudRects.length, shot: camera._cineShotId, text: p.text };
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
  {
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
  
  const LOADING = () => { const vis = e => e && e.offsetParent && getComputedStyle(e).opacity > 0.1; return [...document.querySelectorAll('.ls-status, .ls-hint')].some(vis) || [...document.querySelectorAll('div,span')].some(e => e.childElementCount === 0 && /TAP TO SKIP/.test(e.textContent) && vis(e)); };
  for (let i = 0; i < 480; i++) { if (!(await page.evaluate(LOADING).catch(() => true))) break; if (i % 30 === 0) console.log('loading…'); await page.evaluate(() => { try { window.maybeAdvanceTurn(); } catch (e) {} }).catch(() => {}); await sleep(1000); }
  console.log('loaded');
  console.log('hook', await page.evaluate(HOOK));
  await page.screenshot({ path: `${OUT}/${TAG}_start.png` });
  const start = Date.now(); let pics = 0, stalls = 0, seen = 0; const rows = [];
  const shotsPic = new Set();
  while (Date.now() - start < MINUTES * 60000) {
    const fresh = await page.evaluate((seen) => { const P = window.__clt.pops; const now = performance.now(); const out = []; for (let i = seen; i < P.length; i++) out.push(Object.assign({ i, age: now - P[i].t }, P[i])); return { out, n: P.length, live: camera._cineShotId != null }; }, seen);
    for (const p of fresh.out) {
      if (p.shot == null || !/^-\d/.test(p.text) || await page.evaluate(LOADING).catch(() => true)) { seen = p.i + 1; continue; }
      if (p.age < 380) break;
      seen = p.i + 1;
      if (p.age > 1400) continue;
      const m = await page.evaluate(MEASURE, p).catch(() => null);
      if (!m) continue;
      let pic = null;
      if (pics < MAXPICS && !shotsPic.has(p.shot)) { shotsPic.add(p.shot); pics++; pic = `${TAG}_${String(pics).padStart(2, '0')}.png`; try { await page.screenshot({ path: `${OUT}/${pic}` }); } catch (e) {} }
      m.pic = pic; rows.push(m); console.log('HIT', JSON.stringify(m));
    }
    if (fresh.live) { await sleep(120); continue; }
    const r = await page.evaluate(TURN_FN).catch(e => ({ status: 'err', e: String(e.message).slice(0, 80) }));
    const st = await page.evaluate(() => { const s = window.GAME.state; return { round: s.round, winner: s.winner }; });
    if (st.winner != null) { console.log('winner', st.winner); break; }
    if (r.status === 'played') { stalls = 0; await sleep(300); }
    else if (r.status === 'ai-turn') { await page.evaluate(() => { try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(380); stalls = 0; }
    else { await page.evaluate(() => { try { window.maybeAdvanceTurn(); } catch (e) {} try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(350); if (++stalls > 200) { console.log('stalled'); break; } }
  }
  fs.writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(rows));
  const avg = k => rows.length ? Math.round(10 * rows.reduce((a, r) => a + r[k], 0) / rows.length) / 10 : 0;
  console.log('SUMMARY hits', rows.length, 'body cells under: pops', avg('pops') + '%', 'corner', avg('title') + '%', 'hud', avg('hud') + '%', '| worst body avg', avg('worst') + '%', '| hits with a body half covered', rows.filter(r => r.worst >= 50).length, '| hud boxes up', rows.filter(r => r.hudUp).length, '| body height avg', avg('bodyH') + '%');
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
