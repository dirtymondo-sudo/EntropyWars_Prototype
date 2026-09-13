// playtest_world.js — scratch variant of playtest_maps.js for THE WORLD (2026-09-13).
// Every CDN is egress-blocked in this sandbox, so: repo scripts + CSS are served from
// the repo, the third-party libraries from node_modules (three r128 + examples,
// React, socket.io client, MeshLine), and every PNG texture is a generated STAND-IN
// coloured by its file name (grass → green, water → blue, …) so surfaces are not black.
// GLBs / audio / fonts 404. Per map: launch, then for each stability 1 / 0.5 / 0 set
// window.EW_WORLD_STAB, wait, shoot the poses.
//   node playtest_world.js prebuilt_shasta prebuilt_area51 …    POSES=wide,far  STABS=1,0.5,0
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const OUT = path.join(REPO, process.env.CLEAN === '1' ? 'shots/world-clean' : 'shots/world'); fs.mkdirSync(OUT, { recursive: true });
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
function png(w, h, rgba) {   // minimal PNG encoder (RGBA8, filter 0)
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
const wanted = process.argv.slice(2).filter(a => !a.startsWith('--'));
const POSES = (process.env.POSES || 'wide,far').split(',');
const STABS = (process.env.STABS || '1,0.5,0').split(',').map(Number);
const CAM = {
  wide: { x: 3.5, y: 3.5, zoom: 0.42, tilt: 40, yaw: 45 },
  low:  { x: 3.5, y: 3.5, zoom: 0.55, tilt: 62, yaw: 25 },
  far:  { x: 3.5, y: 3.5, zoom: 0.3, tilt: 50, yaw: 35 },
  vfar: { x: 3.5, y: 3.5, zoom: 0.16, tilt: 50, yaw: 35 },
  side: { x: 3.5, y: 3.5, zoom: 0.2, tilt: 68, yaw: 90 },
  top:  { x: 3.5, y: 3.5, zoom: 0.5, tilt: 12, yaw: 45 },
  horizon: { x: 3.5, y: 3.5, zoom: 0.3, tilt: 74, yaw: 35 },
  rim:  { x: 3.5, y: 3.5, zoom: 0.3, tilt: 62, yaw: 20 },
  under: { x: 3.5, y: 3.5, zoom: 0.3, tilt: 80, yaw: 20 },
};
(async () => {
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(exe) ? exe : undefined,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const counters = { mirror: 0, local: 0, tex: 0, miss: 0 };
  await installRoutes(context, counters);
  if (process.env.CLEAN === '1') await context.addInitScript(() => { try { localStorage.setItem('ew_retro', JSON.stringify({ enabled: false, fogEnabled: false })); } catch (e) {} });   // CLEAN=1: no retro filter / no retro fog — the map's own colours
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && errs.length < 40) errs.push(m.type() + ': ' + t.slice(0, 300)); if (/\[world\]|\[scenery\]|near builder|shader|THREE\.WebGL/i.test(t)) console.log('  console:', t.slice(0, 220)); });
  await page.goto('http://localhost:3000/?nohq', { waitUntil: 'commit', timeout: 70000 });
  { const t0 = Date.now(); let ok = false, last = null;
    while (Date.now() - t0 < 180000) { try { last = await page.evaluate(() => [document.readyState, typeof window._goToVsCpu, !!window.GAME, typeof EW_MAP_META]); if (last[0] === 'complete' && last[1] === 'function' && last[2]) { ok = true; break; } } catch (e) { last = ['nav']; } await sleep(1000); }
    console.log('page state', JSON.stringify(last), 'after', ((Date.now() - t0) / 1000).toFixed(0), 's', JSON.stringify(counters));
    if (!ok) { console.log('errors:', JSON.stringify(errs.slice(0, 6))); await browser.close(); process.exit(1); } }
  const meta = await page.evaluate(() => (typeof EW_MAP_META !== 'undefined' ? EW_MAP_META : window.EW_MAP_META).filter(m => m.isDelta).map(m => ({ id: m.id, label: m.label })));
  const list = meta.filter(m => wanted.some(w => m.id === w || m.id === w + '_delta'));
  if (!list.length) { console.log('no maps matched; Δ ids:', meta.map(m => m.id).join(' ')); await browser.close(); process.exit(1); }
  console.log('maps:', list.map(m => m.id).join(' '));
  for (const m of list) {
    const t0 = Date.now();
    try {
      await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; });
      if (m !== list[0]) { await page.reload({ waitUntil: 'commit', timeout: 70000 }); for (let i = 0; i < 90; i++) { if (await page.evaluate(() => !!(window.GAME && window._goToVsCpu)).catch(() => false)) break; await sleep(1000); } await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; }); }
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
      console.log('  launch via', launched);
      await sleep(2000);
      for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary'); if (b) b.click(); }); await sleep(1400); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
      await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
      let inBattle = false;
      for (let i = 0; i < 40; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') { inBattle = true; break; } await sleep(1000); }
      if (!inBattle) { console.log('  ! never reached battle for', m.id); continue; }
      await page.evaluate(() => { const st = window.GAME.state; st.controllers = { 1: 'local', 2: 'local' }; });
      let clear = 0;
      for (let i = 0; i < 60 && clear < 2; i++) {
        const left = await page.evaluate(() => { let n = 0; document.querySelectorAll('.ls-active, .ls-ready').forEach(el => { n++; el.click(); }); const hint = document.querySelector('.vs-skip-hint'); if (hint) { n++; (hint.closest('[class*="vs"]') || hint).click(); hint.click(); const ov = hint.parentNode; if (ov) ov.click(); } document.querySelectorAll('.vs-active').forEach(el => { n++; el.click(); }); return n; });
        if (left === 0) clear++; else clear = 0;
        await sleep(700);
      }
      await sleep(5000);
      const info = await page.evaluate(() => ({ world: ThreeRenderer.world(), env: window.GAME.state.mapEnv && window.GAME.state.mapEnv.world, fog: (() => { try { return null; } catch (e) { return null; } })() }));
      console.log('  battle', JSON.stringify(info));
      for (const stab of STABS) {
        await page.evaluate((v) => { window.EW_WORLD_STAB = v; }, stab);
        await sleep(stab === STABS[0] ? 1500 : 5500);
        const w = await page.evaluate(() => ThreeRenderer.world());
        console.log('  stab', stab, JSON.stringify(w));
        for (const pose of POSES) {
          const c = CAM[pose]; if (!c) continue;
          await page.evaluate((c) => { window.GAME.state.userZoomScale = c.zoom; camera.snap({ _force: true, x: c.x, y: c.y, zoom: c.zoom, tilt: c.tilt, yaw: c.yaw }); camera._smoothX = c.x; camera._smoothY = c.y; camera._smoothZoom = c.zoom; camera._smoothTilt = c.tilt; camera._smoothYaw = c.yaw; }, c);
          await sleep(1800);
          if (pose === POSES[0]) console.log('  cam', JSON.stringify(await page.evaluate(() => [camera.zoom, camera.tilt, camera.yaw, window.GAME.state.userZoomScale, typeof getDefaultZoom === 'function' ? getDefaultZoom() : null])));
          const f = path.join(OUT, `${m.id.replace(/_delta$/, '')}_s${String(stab).replace('.', '')}_${pose}.png`);
          try { await page.screenshot({ path: f, timeout: 40000, animations: 'disabled' }); console.log('  shot', path.basename(f)); }
          catch (e) { console.log('  ! screenshot failed', pose, String(e.message).split('\n')[0]); }
        }
      }
      if (process.env.EXPERIMENTS) { const ex = JSON.parse(process.env.EXPERIMENTS); for (let i = 0; i < ex.length; i++) { { const c = CAM[POSES[0]]; await page.evaluate((c) => { window.GAME.state.userZoomScale = c.zoom; camera.snap({ _force: true, x: c.x, y: c.y, zoom: c.zoom, tilt: c.tilt, yaw: c.yaw }); camera._smoothX = c.x; camera._smoothY = c.y; camera._smoothZoom = c.zoom; camera._smoothTilt = c.tilt; camera._smoothYaw = c.yaw; }, c); } try { console.log('  X' + i, JSON.stringify(await page.evaluate(ex[i])).slice(0, 300)); } catch (e) { console.log('  X' + i + ' failed', String(e.message).split('\n')[0]); } await sleep(2500); const f = path.join(OUT, `${m.id.replace(/_delta$/, '')}_x${i}.png`); try { await page.screenshot({ path: f, timeout: 40000, animations: 'disabled' }); console.log('  shot', path.basename(f)); } catch (e) {} } }
      if (process.env.PROBE_EVAL) { try { console.log('  EVAL', JSON.stringify(await page.evaluate(process.env.PROBE_EVAL)).slice(0, 2500)); } catch (e) { console.log('  EVAL failed', String(e.message).split('\n')[0]); } }
    } catch (e) { console.log('  ! error on', m.id, String(e && e.message || e).split('\n')[0]); }
    console.log('  done', m.id, ((Date.now() - t0) / 1000).toFixed(0) + 's', 'errors so far', errs.length);
  }
  console.log('COUNTERS', JSON.stringify(counters));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 10)));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
