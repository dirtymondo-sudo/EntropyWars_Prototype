// playtest_spellcam.js — THE SPELL CAMERA PROBE (2026-09-13). Repo tooling.
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
const OUT = path.join(REPO, 'shots/spellcam'); fs.mkdirSync(OUT, { recursive: true });
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
const MAP = process.env.MAP || 'prebuilt_nuketown';
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
  // ── stage: teleport caster (P1) + dummy (P2), arm the spell, sample the camera per frame
  const staged = await page.evaluate(({ SPELL, CX, CY, TX, TY }) => {
    const st = window.GAME.state;
    const caster = st.units.find(u => u.player === 1 && !u.dead);
    const dummy = st.units.find(u => u.player === 2 && !u.dead);
    if (!caster || !dummy) return { err: 'no units' };
    for (const u of st.units) if (!u.dead && u !== caster && u !== dummy) { u.dead = true; u.hp = 0; }
    const put = (u, x, y) => { u.x = x; u.y = y; try { u.z = getHeightAt(x, y); } catch (e) { u.z = 0; } };
    put(caster, CX, CY); put(dummy, TX, TY);
    dummy.hp = dummy.maxHp = 99999; caster.ap = 9; caster.mp = 9999; caster.maxMp = 9999;
    st._blitzActiveUnitId = caster.id; st.activePlayer = 1; st.selectedUnitId = caster.id;
    st.cinematicActionCam = true; st.fogOfWar = false; st.cameraDisabled = false; st.animationsDisabled = false;
    const def = SPELL_BY_ID[SPELL] || (typeof RACE_ABILITY_BY_ID !== 'undefined' && RACE_ABILITY_BY_ID[SPELL]);
    if (!def) return { err: 'no spell ' + SPELL };
    const sp = JSON.parse(JSON.stringify(def)); sp.cost = 0; sp.range = Math.max(sp.range || 0, 30); delete sp.classRestriction; delete sp.jobPreference;
    caster.spells = [sp]; caster._spellSlots = [SPELL]; caster._raceAbilities = []; caster._spellCooldowns = {}; caster._spellsUsedThisTurn = {};
    try { ThreeRenderer.invalidateUnits && ThreeRenderer.invalidateUnits(); GAME.markDirty(); GAME.renderIfDirty && GAME.renderIfDirty(); } catch (e) {}
    // per-frame camera sampler
    window.__cs = []; window.__csT0 = performance.now();
    if (!window.__stPatched) { window.__stPatched = true; window.__timers = []; const _st = window.setTimeout; window.setTimeout = function (f, ms) { const id = _st.apply(window, arguments); window.__timers.push(id); return id; }; }
    const boardTop = (() => { let mx = 0; for (let y = 0; y < bh(); y++) for (let x = 0; x < bw(); x++) mx = Math.max(mx, window._camGroundPx(x, y)); return mx; })();
    const edgeTop = Math.max(window._camGroundPx(TX, TY), window._camGroundPx(CX, CY));
    window.__csBoard = { boardTop, edgeTop, ts: CONFIG.tileSize, bw: bw(), bh: bh() };
    const tick = () => {
      try {
        const c3 = ThreeRenderer.hq && ThreeRenderer.hq.dev && ThreeRenderer.hq.dev.camera ? ThreeRenderer.hq.dev.camera() : null;
        const cam3 = c3 || (window.__three3cam || null);
        let eye = null, look = null;
        if (typeof ThreeCamera !== "undefined" && ThreeCamera.getCamera) { const c = ThreeCamera.getCamera(); if (c) { eye = [c.position.x, c.position.y, c.position.z]; const d = new THREE.Vector3(); c.getWorldDirection(d); look = [d.x, d.y, d.z]; } }
        const ts = CONFIG.tileSize;
        let gEye = null; if (eye) { const tx = Math.floor(eye[0] / ts), ty = Math.floor(eye[2] / ts); gEye = { tx, ty, on: tx >= 0 && ty >= 0 && tx < bw() && ty < bh(), g: window._camGroundPx(tx, ty) }; }
        window.__cs.push({ t: Math.round(performance.now() - window.__csT0), x: +camera.x.toFixed(2), y: +camera.y.toFixed(2), z: +camera.zoom.toFixed(2), tilt: Math.round(camera.tilt), yaw: Math.round(camera.yaw), tps: !!camera._cineTps, lift: Math.round(camera._tpsHeadLift || 0), subj: camera._tpsSubject ? [+camera._tpsSubject.x.toFixed(1), +camera._tpsSubject.y.toFixed(1)] : null, fp: !!camera._fpEye, eye: eye && eye.map(v => Math.round(v)), dir: look && look.map(v => +v.toFixed(2)), gEye, shot: camera._cineShotId });
      } catch (e) { window.__cs.push({ err: String(e.message) }); }
    };
    // a TIMER, not rAF: under software GL a frame takes seconds, and the camera controller
    // (timeouts) moves between frames — sample it every 60 ms; the three eye updates per render.
    window.__csTimer = setInterval(() => { try { tick(); } catch (e) {} if (performance.now() - window.__csT0 > 12000) clearInterval(window.__csTimer); }, 60);
    return { caster: [caster.x, caster.y, caster.z, caster.race], dummy: [dummy.x, dummy.y, dummy.z, dummy.race], spell: sp.name, kind: sp.kind, boardTop, edgeTop, bw: bw(), bh: bh() };
  }, { SPELL, CX, CY, TX, TY });
  console.log('staged', JSON.stringify(staged));
  if (staged.err) { await browser.close(); process.exit(1); }
  if (TILT_START) await page.evaluate((c) => { camera.snap({ _force: true, ...c }); }, TILT_START);
  await sleep(800);
  const cast = await page.evaluate(({ SPELL, TX, TY }) => {
    const st = window.GAME.state; const caster = st.units.find(u => u.player === 1 && !u.dead);
    st.actionMode = 'spell'; st.selectedTool = caster.spells[0].name;
    window.__csT0 = performance.now();
    let d = 0; try { d = GAME.doSpell(caster, TX, TY, getHeightAt(TX, TY)) || 0; } catch (e) { return 'threw ' + e.message; }
    return 'delay ' + d + ' | log: ' + JSON.stringify((st.logEntries || []).slice(-3).map(e => (e && e.text) || e).map(String).map(x => x.slice(0, 120)));
  }, { SPELL, TX, TY });
  console.log('cast →', cast);
  if (process.env.DETONATE === '1') {
    // a delayed strike (Nuke, Artillery Strike): the camera lives at the END-OF-ROUND detonation —
    // wait out the cast beat, then run the detonation loop directly and re-zero the sampler clock.
    await sleep(Number(process.env.DETONATE_AFTER || 2500));
    const det = await page.evaluate(() => {
      const st = window.GAME.state; const n = (st._delayedSpells || []).length;
      for (const ds of (st._delayedSpells || [])) ds.roundsLeft = 1;
      window.__csT0 = performance.now(); window.__cs = [];
      try { processDelayedSpellDetonations(function () {}); } catch (e) { return 'threw ' + e.message; }
      return 'detonating ' + n;
    });
    console.log('detonate →', det);
    process.env.__T0_RESET = '1';
  }
  const t0 = Date.now();   // (after DETONATE=1 this is the detonation clock)
  if (process.env.FREEZE_AT) {
    // FREEZE_AT=ms — kill every pending timer + the camera tween at that moment so the beat can be
    // photographed (software GL screenshots take seconds; a beat lasts hundreds of ms).
    const at = Number(process.env.FREEZE_AT); const wait = at - (Date.now() - t0); if (wait > 0) await sleep(wait);
    const fr = await page.evaluate(() => { const n = window.__timers.length; window.__timers.forEach(clearTimeout); window.__timers.length = 0; try { camera._stop(); } catch (e) {} return { cleared: n, cam: { x: camera.x, y: camera.y, tilt: camera.tilt, yaw: camera.yaw, zoom: camera.zoom, fp: !!camera._fpEye, lift: camera._tpsHeadLift, tps: !!camera._cineTps } }; });
    console.log('FROZEN at', Date.now() - t0, 'ms', JSON.stringify(fr));
    const f = path.join(OUT, `${TAG}_frozen${at}.png`);
    await sleep(1500);
    try { await page.screenshot({ path: f, timeout: 40000 }); console.log('  shot', path.basename(f)); } catch (e) { console.log('  ! shot failed', String(e.message).split('\n')[0]); }
  }
  for (const at of SHOTS) {
    const wait = at - (Date.now() - t0); if (wait > 0) await sleep(wait);
    const f = path.join(OUT, `${TAG}_${String(at).padStart(4, '0')}.png`);
    try { await page.screenshot({ path: f, timeout: 30000 }); console.log('  shot', path.basename(f), 'at', Date.now() - t0, 'ms'); } catch (e) { console.log('  ! shot failed', at, String(e.message).split('\n')[0]); }
  }
  await sleep(Math.max(0, 6500 - (Date.now() - t0)));
  const samples = await page.evaluate(() => ({ s: window.__cs, b: window.__csBoard }));
  const s = samples.s.filter(x => !x.err);
  // verdict: lowest eye relative to the board top, whether the eye ever sat off-board and below the on-board ground
  let low = Infinity, lowAt = null, offBelow = 0;
  for (const k of s) { if (!k.eye) continue; const rel = (k.eye[1] - samples.b.boardTop) / samples.b.ts; if (rel < low) { low = rel; lowAt = k; } if (k.gEye && !k.gEye.on && k.eye[1] < samples.b.edgeTop + samples.b.ts * 0.3) offBelow++; }
  console.log('board', JSON.stringify(samples.b));
  console.log('samples', s.length, 'lowest eye vs board top (tiles):', low.toFixed(2), 'off-board-and-below-edge frames:', offBelow);
  // print a compressed timeline: one line per ~250ms
  let lastT = -1000;
  for (const k of s) { if (k.t - lastT < 250) continue; lastT = k.t; console.log('  ' + JSON.stringify(k)); }
  fs.writeFileSync(path.join(OUT, `${TAG}_samples.json`), JSON.stringify(samples, null, 0));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
