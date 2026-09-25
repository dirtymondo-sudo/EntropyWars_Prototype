// playtest_capture.js — THE ONE-WAY DOOR probe (CAPTURE_PLAN.md Phase 2, 2026-09-25, from playtest_clips.js). Repo tooling.
// Stages a story seat on a real board (state.partyBag), gives the P1 unit capture doors, fires one through doItem (the
// Items path), steps the paused clock and screenshots: the comet + the unfold, then the enemy pushed onto it (THE TAKE:
// the void), then the seal. Output: shots/capture/*.jpg. Same installs as playtest_clips.js.  TIER=3 for the vault leaf.
//
//
//
//
//
//
//
//
//
//
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const OUT = path.join(REPO, 'shots/clips'); fs.mkdirSync(OUT, { recursive: true });
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
let [TX, TY] = (process.env.TARGET || '13,7').split(',').map(Number);
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
  // ── stage: teleport caster (P1) + dummy (P2), arm the spell, sample the camera per frame
  const TIER = Number(process.env.TIER || 1), KEY = TIER >= 3 ? 'captureDoor3' : TIER === 2 ? 'captureDoor2' : 'captureDoor';
  const staged = await page.evaluate(({ CX, CY, TX, TY, KEY }) => {
    const st = window.GAME.state;
    const caster = st.units.find(u => u.player === 1 && !u.dead);
    const dummy = st.units.find(u => u.player === 2 && !u.dead);
    if (!caster || !dummy) return { err: 'no units' };
    for (const u of st.units) if (!u.dead && u !== caster && u !== dummy) { u.dead = true; u.hp = 0; }
    const put = (u, x, y) => { u.x = x; u.y = y; try { u.z = getHeightAt(x, y); } catch (e) { u.z = 0; } };
    put(caster, CX, CY); put(dummy, TX + 3, TY);
    dummy.hp = dummy.maxHp = 99999; caster.ap = 9;
    st.partyBag = { seat: 1, items: {} };
    caster.items = Object.assign({}, caster.items || {}); caster.items[KEY] = 2;
    st._blitzActiveUnitId = caster.id; st.activePlayer = 1; st.selectedUnitId = caster.id;
    st.fogOfWar = false; st.cameraDisabled = false; st.animationsDisabled = false;
    try { camera.snap({ _force: true, x: TX, y: TY }); } catch (e) {}
    try { GAME.markDirty(); GAME.renderIfDirty && GAME.renderIfDirty(); } catch (e) {}
    const L = captureDoorLegalTiles(caster);
    const pick = L.find(t => t.x === TX && t.y === TY) || L.slice().sort((a, b) => (Math.abs(b.x - caster.x) + Math.abs(b.y - caster.y) === 3 ? 1 : 0) - (Math.abs(a.x - caster.x) + Math.abs(a.y - caster.y) === 3 ? 1 : 0))[0];
    return { caster: [caster.x, caster.y], dummy: [dummy.x, dummy.y], legal: L.length, pick, why: pick ? captureDoorPlaceCheck(caster, pick.x, pick.y, KEY) : 'none', canUse: canUseItemNow(caster, KEY) };
  }, { CX, CY, TX, TY, KEY });
  console.log('staged', JSON.stringify(staged));
  if (staged.err || !staged.pick) { await browser.close(); process.exit(1); }
  TX = staged.pick.x; TY = staged.pick.y;
  await page.evaluate(({ TX, TY }) => { try { camera.snap({ _force: true, x: TX, y: TY }); } catch (e) {} }, { TX, TY });
  await sleep(1500);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 2000));
  const OUTC = path.join(REPO, 'shots/capture'); fs.mkdirSync(OUTC, { recursive: true });
  const shot = async (tag) => { try { await page.screenshot({ path: path.join(OUTC, 'T' + TIER + '_' + tag + '.jpg'), quality: 72, timeout: 30000 }); } catch (e) { console.log('  shot fail', String(e.message).slice(0, 80)); } };
  const step = async (n, ms, tag, every) => { for (let i = 0; i < n; i++) { try { await page.clock.runFor(ms); } catch (e) { console.log('  timer threw', String(e.message).slice(0, 300)); } if (tag && i % (every || 1) === 0) await shot(tag + '_' + String(i).padStart(2, '0')); } };
  const placed = await page.evaluate(({ TX, TY, KEY }) => {
    const st = GAME.state; const c = st.units.find(u => u.player === 1 && !u.dead);
    st.actionMode = 'item'; st.selectedTool = KEY;
    try { GAME.doItem ? GAME.doItem(c, TX, TY) : doItem(c, TX, TY); } catch (e) { return 'threw ' + e.message; }
    const d = (st.doors || []).find(x => x.kind === 'capture');
    return d ? { id: d.id, hp: d.hp, tier: d.tier, face: [d.faceX, d.faceY], reveal: !!d._revealAt, ap: c.ap, left: c.items[KEY] } : 'no door: ' + JSON.stringify(st.doors);
  }, { TX, TY, KEY });
  console.log('placed', JSON.stringify(placed));
  await step(8, 80, 'place', 1);
  await step(6, 250, null);
  await shot('standing');
  const took = await page.evaluate(({ TX, TY }) => {
    const st = GAME.state; const d = st.units.find(u => u.player === 2 && !u.dead); const door = captureDoorAt(TX, TY);
    d.x = TX; d.y = TY; try { d.z = getHeightAt(TX, TY); } catch (e) {}
    const ok = captureDoorTake(door, d, 'push'); try { GAME.markDirty(); } catch (e) {}
    return { ok, held: door && door.held, status: d.status && d.status.captured };
  }, { TX, TY });
  console.log('took', JSON.stringify(took));
  await step(10, 90, 'take', 1);
  await step(6, 250, null);
  await shot('holding');
  const sealed = await page.evaluate(({ TX, TY }) => { const door = captureDoorAt(TX, TY); return captureDoorSeal(door) ? { captures: GAME.state.captures } : 'no seal'; }, { TX, TY });
  console.log('sealed', JSON.stringify(sealed));
  await step(12, 90, 'seal', 1);
  console.log('ERRORS', JSON.stringify(errs.slice(0, 10)), JSON.stringify(counters));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
