// playtest_combocam.js — THE COMBO CAMERA PROBE (2026-09-24, from playtest_spellcam.js). Repo tooling.
// Stages a dual tech (two P1 casters side by side + a P2 dummy), fires it through the real
// doComboAttack with the action camera on, samples the camera, screenshots the beats and prints
// the spell director log (the combo director: COMBO_DIRECTOR_SHOTS).
//   COMBO="Tactical Strike" SHOTS=900,2000,2400,2900,3600 node playtest_combocam.js
// The rest of the header is the spell probe's:
// Launches a Δ map offline (same stand-in routing as playtest_world.js: repo
// scripts, node_modules copies of three / React / socket.io / MeshLine,
// generated textures; GLBs / audio 404), takes both seats, TELEPORTS a caster
// and a dummy to the tiles you name, hands the caster one spell, casts it
// through the real doSpell pipeline with the action camera on, SAMPLES the
// camera every frame (controller numbers + the real three camera eye/look +
// the ground under the eye + the board top) and screenshots the beats.
//   node playtest_spellcam.js                                  (defaults below)
//   MAP=prebuilt_nuketown SPELL=raceLaserBeam CASTER=3,7 TARGET=13,7 \
//   SHOTS=400,1600,2400,3200,4200 TAG=edge node playtest_spellcam.js
// The verdict line prints the lowest eye height relative to the board top
// across the shot — negative = the camera went under the map.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const OUT = path.join(REPO, 'shots/combocam'); fs.mkdirSync(OUT, { recursive: true });
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
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp') { counters.tex++; return route.fulfill({ status: 200, contentType: 'image/png', body: standIn(u.pathname) }); }
    counters.miss++; return route.fulfill({ status: 404, body: '' });
  });
}
const MAP = process.env.MAP || 'prebuilt_stadium';   // (Nuketown was retired 2026-09-18)
const SPELL = process.env.SPELL || 'raceLaserBeam';
const [CX, CY] = (process.env.CASTER || '3,7').split(',').map(Number);
const [TX, TY] = (process.env.TARGET || '13,7').split(',').map(Number);
const SHOTS = (process.env.SHOTS || '500,1500,2300,3100,4000').split(',').map(Number);
const TAG = process.env.TAG || (process.env.COMBO || 'Tactical Strike').replace(/[^A-Za-z]+/g, '_');
const TILT_START = process.env.START_CAM ? JSON.parse(process.env.START_CAM) : null;
(async () => {
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(exe) ? exe : undefined,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: Number(process.env.VW || 1280), height: Number(process.env.VH || 720) } });
  const counters = { mirror: 0, local: 0, tex: 0, miss: 0 };
  await installRoutes(context, counters);
  await context.addInitScript(() => { try { localStorage.setItem('ew_retro', JSON.stringify({ enabled: false, fogEnabled: false })); } catch (e) {} });
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && errs.length < 40) errs.push(t.slice(0, 300)); if (/\[spellcam\]/.test(t)) console.log('  page:', t.slice(0, 300)); });
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
  const COMBO = process.env.COMBO || 'Tactical Strike';
  const staged = await page.evaluate(({ COMBO, CX, CY, TX, TY }) => {
    const st = window.GAME.state;
    const key = Object.keys(COMBO_REGISTRY).find(k => COMBO_REGISTRY[k].name === COMBO);
    if (!key) return { err: 'no combo ' + COMBO };
    const [ta, tb] = key.split('|');
    const p1 = st.units.filter(u => u.player === 1 && !u.dead);
    const a = p1[0], b = p1[1];
    const dummy = st.units.find(u => u.player === 2 && !u.dead);
    if (!a || !b || !dummy) return { err: 'no units' };
    for (const u of st.units) if (!u.dead && u !== a && u !== b && u !== dummy) { u.dead = true; u.hp = 0; }
    const put = (u, x, y) => { u.x = x; u.y = y; try { u.z = getHeightAt(x, y); } catch (e) { u.z = 0; } };
    put(a, CX, CY); put(b, CX - 1, CY); put(dummy, TX, TY);
    a.types = [ta]; b.types = [tb];
    dummy.hp = dummy.maxHp = 99999;
    for (const u of [a, b]) { u.ap = 9; u.maxAp = Math.max(u.maxAp || 0, 9); u._lastComboRound = -99; }
    st._blitzActiveUnitId = a.id; st.activePlayer = 1; st.selectedUnitId = a.id;
    st.cinematicActionCam = true; st.fogOfWar = false; st.cameraDisabled = false; st.animationsDisabled = false;
    try { ThreeRenderer.invalidateUnits && ThreeRenderer.invalidateUnits(); GAME.markDirty(); GAME.renderIfDirty && GAME.renderIfDirty(); } catch (e) {}
    window.__cs = []; window.__csT0 = performance.now();
    if (!window.__stPatched) { window.__stPatched = true; window.__timers = []; const _st = window.setTimeout; window.setTimeout = function (f, ms) { const id = _st.apply(window, arguments); window.__timers.push(id); return id; }; }
    window.__csTimer = setInterval(() => {
      try { window.__cs.push({ t: Math.round(performance.now() - window.__csT0), x: +camera.x.toFixed(2), y: +camera.y.toFixed(2), z: +camera.zoom.toFixed(2), tilt: Math.round(camera.tilt), yaw: Math.round(camera.yaw), tps: !!camera._cineTps, shot: camera._cineShotId, owned: camera._cineOwnedSeq }); } catch (e) {}
      if (performance.now() - window.__csT0 > 12000) clearInterval(window.__csTimer);
    }, 60);
    return { key, a: [a.x, a.y, a.race], b: [b.x, b.y, b.race], dummy: [dummy.x, dummy.y, dummy.race] };
  }, { COMBO, CX, CY, TX, TY }).catch(e => ({ err: String(e.message) }));
  console.log('staged', JSON.stringify(staged));
  if (staged.err) { await browser.close(); process.exit(1); }
  /* THE BEAT CAPTURE: every director beat grabs the next frame the game draws after it runs
     (and again +GLIDE ms for the glides) — software GL is ~1 s a frame, so timed screenshots
     land late; this pins each beat's framing. DOM grades / inserts are not in these frames. */
  await page.evaluate((GLIDE) => {
    window.__caps = [];
    /* the NEXT animation frame, after the game's own loop has synced the rig and drawn it
       (its rAF was queued first): the drawing buffer is still intact in that same task */
    const cap = (label) => requestAnimationFrame(() => { try {
      const R = ThreeRenderer.hq.dev.renderer();
      window.__caps.push({ label, t: Math.round(performance.now() - window.__csT0), url: R.domElement.toDataURL('image/jpeg', 0.75) });
    } catch (e) { window.__caps.push({ label, err: String(e.message) }); } });
    const SD = window.SpellDirector; const o = SD._open.bind(SD);
    SD._open = function (id, ctx) { const e = o(id, ctx); const push = e.beats.push.bind(e.beats);
      e.beats.push = function (lb) { const r = push(lb); if (!/@late$/.test(lb)) { cap(lb); setTimeout(() => cap(lb + '+'), GLIDE); } return r; }; return e; };
  }, Number(process.env.GLIDE || 350));
  if (process.env.OFF === '1') await page.evaluate(() => { window.EW_DISABLE_COMBO_DIRECTOR = true; });
  await sleep(800);
  const fired = await page.evaluate(({ TX, TY }) => {
    const st = window.GAME.state; const p1 = st.units.filter(u => u.player === 1 && !u.dead);
    window.__csT0 = performance.now(); window.__cs = [];
    try { const r = GAME.doComboAttack(p1[0], p1[1], TX, TY); return 'ret ' + r + ' log ' + JSON.stringify((st.logEntries || st.log || []).slice(-2).map(e => String((e && e.text) || e).slice(0, 100))); } catch (e) { return 'threw ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | '); }
  }, { TX, TY });
  console.log('combo →', fired);
  const t0 = Date.now();
  for (const at of SHOTS) {
    const wait = at - (Date.now() - t0); if (wait > 0) await sleep(wait);
    const f = path.join(OUT, `${TAG}_${String(at).padStart(4, '0')}.png`);
    try { await page.screenshot({ path: f, timeout: 30000 }); console.log('  shot', path.basename(f), 'at', Date.now() - t0, 'ms'); } catch (e) { console.log('  ! shot failed', at, String(e.message).split('\n')[0]); }
  }
  await sleep(Math.max(0, 7000 - (Date.now() - t0)));
  const s = await page.evaluate(() => window.__cs);
  let lastT = -1000;
  for (const k of s) { if (k.t - lastT < 200) continue; lastT = k.t; console.log('  ' + JSON.stringify(k)); }
  const caps = await page.evaluate(() => window.__caps || []);
  for (const c of caps) { if (c.err) { console.log('  cap err', c.label, c.err); continue; }
    const f = path.join(OUT, `${TAG}_beat_${String(c.t).padStart(5, '0')}_${c.label.replace(/[^A-Za-z0-9+]/g, '')}.jpg`);
    fs.writeFileSync(f, Buffer.from(c.url.split(',')[1], 'base64')); console.log('  beat', path.basename(f)); }
  const dlog = await page.evaluate(() => (window.SpellDirector ? window.SpellDirector.log.slice(-2) : null));
  console.log('DIRECTOR', JSON.stringify(dlog));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
