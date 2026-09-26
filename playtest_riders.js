// playtest_riders.js — THE TARGETING RIDERS PROBE (SPELL_LIBRARY_PLAN.md Phase 3, 2026-09-26). Repo tooling.
// Built from playtest_clips.js (same routes / boot / battle entry). Stages a P1 caster and a cluster of P2
// dummies (+ one P1 ally beside them), then casts, on the real board with the real engine:
//   1. riderScatterShot (randomTargets: 3 distinct random enemies in range 4) — prints which dummies lost HP;
//   2. riderImpactRound (splash 50 % radius 1) at one dummy — prints the victim's and the neighbours' HP;
// each on a paused Playwright clock stepped STEP ms at a time (software GL is ~1 s a frame), a screenshot every
// CAPE steps to shots/riders/. Prints page errors. Needs npm start (:3000) and, in ONE npm command,
// `npm install --no-save playwright react@18 react-dom@18 three@0.128.0`.
//   node playtest_riders.js
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const OUT = path.join(REPO, 'shots/riders'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NPM_MIRROR = [
  [/\/three\.js\/r128\/three\.min\.js$/, 'three/build/three.min.js'],
  [/\/three@0\.128\.0\/(examples\/js\/.+)$/, 'three/$1'],
  [/\/socket\.io\.min\.js$/, 'socket.io/client-dist/socket.io.min.js'],
  [/\/react\.production\.min\.js$/, 'react/umd/react.production.min.js'],
  [/\/react-dom\.production\.min\.js$/, 'react-dom/umd/react-dom.production.min.js'],
  [/\/THREE\.MeshLine\.js$/, 'three.meshline/src/THREE.MeshLine.js'],
];
const PAL = [
  [/deep_water|ocean/, [22, 60, 120]], [/water|river|lake|sea/, [40, 110, 170]], [/lava|magma/, [235, 90, 20]], [/scorch|ash|obsid/, [50, 36, 52]],
  [/grass|meadow|turf|forest|leaves|leaf/, [70, 140, 60]], [/purple/, [120, 70, 150]], [/desert|sand|dune/, [214, 186, 120]], [/dirt|soil|mud|wasteland/, [150, 120, 84]],
  [/cave_wall|rock_wall|rocks|cliff|mountain|stone/, [120, 112, 108]], [/cave_floor/, [128, 112, 140]], [/cloud/, [236, 236, 246]], [/ice|snow|frost/, [210, 232, 248]],
  [/marble/, [222, 218, 208]], [/moon/, [178, 180, 190]], [/mars/, [186, 110, 74]], [/wood|plank|bark/, [128, 90, 58]], [/brick/, [160, 84, 64]],
  [/urban|road|concrete|street|asphalt|tile/, [130, 130, 134]], [/metal|alu|gunmetal|steel/, [150, 158, 166]], [/carpet/, [190, 170, 100]], [/void|black/, [10, 10, 16]],
];
function colourFor(url) { const b = url.toLowerCase(); for (const [re, c] of PAL) if (re.test(b)) return c; return [140, 130, 150]; }
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const texCache = {};
function standIn(url) {
  const key = colourFor(url).join(',') + (/sprite|unit|portrait|icon|ui\//i.test(url) ? 'u' : 't');
  if (texCache[key]) return texCache[key];
  const w = 64, h = 64, c = colourFor(url), px = Buffer.alloc(w * h * 4);
  let seed = 1; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < w * h; i++) { const n = 0.82 + rnd() * 0.36; px[i * 4] = Math.min(255, c[0] * n); px[i * 4 + 1] = Math.min(255, c[1] * n); px[i * 4 + 2] = Math.min(255, c[2] * n); px[i * 4 + 3] = 255; }
  return (texCache[key] = png(w, h, px));
}
const CT = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
async function installRoutes(context, counters) {
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    const base = path.basename(u.pathname), ext = path.extname(base).toLowerCase();
    for (const [re, target] of NPM_MIRROR) { const m = re.exec(u.pathname); if (m) { const abs = path.join(REPO, 'node_modules', target.replace(/\$(\d)/g, (_, i) => m[Number(i)])); if (fs.existsSync(abs)) { counters.mirror++; return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(abs) }); } } }
    if (u.hostname === 'cdn.entropywars.net' && (ext === '.js' || ext === '.css') && fs.existsSync(path.join(REPO, base))) { counters.local++; return route.fulfill({ status: 200, contentType: CT[ext], headers: { 'Cache-Control': 'no-store' }, body: fs.readFileSync(path.join(REPO, base)) }); }
    if (ext === '.glb') { const RA = path.join(REPO, 'rigged_animations'); let f = null;
      if (/\/Assets\/Models\//.test(u.pathname) && fs.existsSync(path.join(RA, 'Assets_Models_' + base))) f = path.join(RA, 'Assets_Models_' + base);
      else if (/Character_output|withSkin|_output/i.test(base) && !/Animation_/.test(base)) f = path.join(RA, 'Meshy_AI_human_body_base_mesh_male_biped_Character_output.glb');
      if (f) { counters.glb = (counters.glb||0)+1; return route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: fs.readFileSync(f) }); } }
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp') { counters.tex++; return route.fulfill({ status: 200, contentType: 'image/png', body: standIn(u.pathname) }); }
    counters.miss++; return route.fulfill({ status: 404, body: '' });
  });
}
const MAP = process.env.MAP || 'prebuilt_stadium';   // (Nuketown was retired 2026-09-18)
const SPELL = process.env.SPELL || 'raceLaserBeam';
const [CX, CY] = (process.env.CASTER || '3,7').split(',').map(Number);
const [TX, TY] = (process.env.TARGET || '13,7').split(',').map(Number);
const SHOTS = (process.env.SHOTS || '500,1500,2300,3100,4000').split(',').map(Number);
const TAG = process.env.TAG || SPELL;
const TILT_START = process.env.START_CAM ? JSON.parse(process.env.START_CAM) : null;
(async () => {
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(exe) ? exe : undefined,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 } });
  const counters = { mirror: 0, local: 0, tex: 0, miss: 0 };
  await installRoutes(context, counters);
  await context.addInitScript(() => { try { localStorage.setItem('ew_retro', JSON.stringify({ enabled: false, fogEnabled: false })); } catch (e) {} });
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && errs.length < 40) errs.push(t.slice(0, 300)); if (/\[(spellcam|CAPSTONE)\]/.test(t)) console.log('  page:', t.slice(0, 300)); });
  await page.goto('http://localhost:3000/?nohq', { waitUntil: 'commit', timeout: 70000 });
  { const t0 = Date.now(); let ok = false, last = null;
    while (Date.now() - t0 < 180000) { try { last = await page.evaluate(() => [document.readyState, typeof window._goToVsCpu, !!window.GAME]); if (last[0] === 'complete' && last[1] === 'function' && last[2]) { ok = true; break; } } catch (e) { last = ['nav']; } await sleep(1000); }
    console.log('page state', JSON.stringify(last), 'after', ((Date.now() - t0) / 1000).toFixed(0), 's');
    if (!ok) { console.log('errors:', JSON.stringify(errs.slice(0, 6))); await browser.close(); process.exit(1); } }
  const meta = await page.evaluate(() => (typeof EW_MAP_META !== 'undefined' ? EW_MAP_META : window.EW_MAP_META).filter(m => m.isDelta).map(m => ({ id: m.id, label: m.label })));
  const m = meta.find(x => x.id === MAP || x.id === MAP + '_delta');
  if (!m) { console.log('no map', MAP, '— Δ ids:', meta.map(x => x.id).join(' ')); await browser.close(); process.exit(1); }
  await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; });
  await page.evaluate(() => window._goToVsCpu());
  await sleep(1500);
  await page.evaluate((label) => { const cards = [...document.querySelectorAll('.ms-tty-card, .ms-map-card')]; const c = cards.find(b => { const t = b.querySelector('b'); return ((t && t.textContent) || b.textContent || '').trim() === label || (b.textContent || '').includes(label); }); if (c) c.click(); }, m.label);
  await sleep(500);
  await page.evaluate(() => { const el = [...document.querySelectorAll('.ms-tty-row, .ms-mode-card')].find(b => /team\s*death\s*match/i.test(b.textContent || '')); if (el) el.click(); });
  await sleep(600);
  const launched = await page.evaluate((id) => {
    try { const list = (typeof MS_MAP_LIST !== 'undefined') ? MS_MAP_LIST : null; const mi = list ? list.findIndex(x => x.modeId === id) : -1;
      if (mi >= 0 && typeof _msSelectedMap !== 'undefined') { _msSelectedMap = mi; }
      if (typeof MS_GAME_MODES !== 'undefined' && typeof _msSelectedGM !== 'undefined') { const gi = MS_GAME_MODES.findIndex(x => x.id === 'tdm'); if (gi >= 0) _msSelectedGM = gi; }
      if (typeof window._msConfirm === 'function') { window._msConfirm(); return 'mirror:' + mi; } } catch (e) { return 'err:' + e.message; }
    const b = document.querySelector('.ms-tty-btn.primary, .ms-btn-primary'); if (b) { b.click(); return 'click'; } return 'none';
  }, m.id);
  console.log('launch via', launched);
  await sleep(2000);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary'); if (b) b.click(); }); await sleep(1400); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  let inBattle = false;
  for (let i = 0; i < 40; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') { inBattle = true; break; } await sleep(1000); }
  if (!inBattle) { console.log('never reached battle'); await browser.close(); process.exit(1); }
  await page.evaluate(() => { const st = window.GAME.state; st.controllers = { 1: 'local', 2: 'local' }; st.autoPlayers = {}; });
  let clear = 0;
  for (let i = 0; i < 60 && clear < 2; i++) {
    const left = await page.evaluate(() => { let n = 0; document.querySelectorAll('.ls-active, .ls-ready').forEach(el => { n++; el.click(); }); const hint = document.querySelector('.vs-skip-hint'); if (hint) { n++; hint.click(); const ov = hint.parentNode; if (ov) ov.click(); } document.querySelectorAll('.vs-active').forEach(el => { n++; el.click(); }); return n; });
    if (left === 0) clear++; else clear = 0;
    await sleep(700);
  }
  await sleep(3000);
  const cast = async (label, spellId, tx, ty) => {
    const staged = await page.evaluate(({ spellId }) => {
      const st = window.GAME.state;
      const all = st.units.filter(u => !u.dead);
      const caster = all.find(u => u.player === 1);
      const foes = all.filter(u => u.player === 2);
      const ally = all.find(u => u.player === 1 && u !== caster);
      if (!caster || foes.length < 3) return { err: 'need 1 caster + 3 enemies, have ' + foes.length };
      const put = (u, x, y) => { u.x = x; u.y = y; try { u.z = getHeightAt(x, y); } catch (e) { u.z = 0; } };
      // a caster on (5,7); enemies at (7,7) (8,7) (7,8) (7,6) (8,8)… — the far ones (range 4) and a cluster for the splash
      const spots = [[7, 7], [8, 7], [7, 8], [7, 6], [8, 8], [12, 12]];
      put(caster, 5, 7);
      foes.forEach((u, i) => { const s = spots[i] || [13, 2 + i]; put(u, s[0], s[1]); u.hp = u.maxHp = 5000; });
      if (ally) { put(ally, 8, 6); ally.hp = ally.maxHp = 5000; }
      caster.ap = 9; caster.mp = caster.maxMp = 9999;
      st._blitzActiveUnitId = caster.id; st.activePlayer = 1; st.selectedUnitId = caster.id;
      st.fogOfWar = false; st.animationsDisabled = false; st.cinematicActionCam = true;
      const sp = JSON.parse(JSON.stringify(SPELL_BY_ID[spellId])); sp.cost = 0;
      caster.spells = [sp]; caster._spellSlots = [spellId]; caster._raceAbilities = []; caster._spellCooldowns = {}; caster._spellsUsedThisTurn = {};
      caster._spellUsedThisTurn = false; caster.acted = false; caster._actedThisRound = false;
      try { ThreeRenderer.invalidateUnits && ThreeRenderer.invalidateUnits(); GAME.markDirty(); GAME.renderIfDirty && GAME.renderIfDirty(); } catch (e) {}
      window.__hp0 = Object.fromEntries(st.units.filter(u => !u.dead).map(u => [u.id, u.hp]));
      return { caster: [caster.id, caster.x, caster.y], units: st.units.filter(u => !u.dead).map(u => [u.id, u.player, u.x, u.y]), pool: (window._randomTargetPool ? window._randomTargetPool(caster, sp).map(u => u.id) : null),
        lit: (typeof hasSpellTargetInRange === 'function') ? hasSpellTargetInRange(caster, sp) : null, selfCast: isSpellSelfCast(sp) };
    }, { spellId });
    console.log(label, 'staged', JSON.stringify(staged));
    if (staged.err) return;
    await sleep(800);
    const r = await page.evaluate(({ tx, ty }) => {
      const st = window.GAME.state; const caster = st.units.find(u => u.id === st._blitzActiveUnitId);
      st.actionMode = 'spell'; st.selectedTool = caster.spells[0].name;
      try { return 'delay ' + (GAME.doSpell(caster, tx, ty, getHeightAt(tx, ty)) || 0); } catch (e) { return 'threw ' + e.message; }
    }, { tx, ty });
    console.log(label, 'cast →', r);
    const STEP = Number(process.env.STEP || 200), N = Number(process.env.FRAMES || 40), CAPE = Number(process.env.CAPE || 5);
    for (let i = 0; i < N; i++) {
      try { await page.clock.runFor(STEP); } catch (e) { console.log('  timer threw', String(e.message).split('\n').slice(0, 4).join(' | ').slice(0, 600)); }
      if (i % CAPE === 0) { try { await page.screenshot({ path: path.join(OUT, label + '_' + String(i * STEP).padStart(5, '0') + '.jpg'), quality: 70, timeout: 20000 }); } catch (e) {} }
    }
    const dmg = await page.evaluate(() => GAME.state.units.filter(u => window.__hp0[u.id] != null).map(u => [u.id, u.player, u.x + ',' + u.y, window.__hp0[u.id] - u.hp]).filter(x => x[3] !== 0));
    console.log(label, 'damage taken', JSON.stringify(dmg));
    const log = await page.evaluate(() => (GAME.state.log || GAME.state.combatLog || []).slice(-8).map(l => (typeof l === 'string' ? l : (l.text || l.msg || JSON.stringify(l))).slice(0, 160)));
    console.log(label, 'log tail', JSON.stringify(log));
  };
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 2000));
  await cast('scatter', 'riderScatterShot', 5, 7);
  await cast('impact', 'riderImpactRound', 7, 7);
  console.log('ERRORS', JSON.stringify(errs.slice(0, 10)), JSON.stringify(counters));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
