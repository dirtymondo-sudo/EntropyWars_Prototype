// playtest_city.js — the D.O.O.R. HQ screenshot probe WITH THE REAL SHEETS (2026-09-17, THE URBAN PACK).
// The sandbox's egress proxy (HTTPS_PROXY) reaches cdn.entropywars.net + the JS CDNs, so — unlike playtest_hq_offline.js
// (stand-in textures) — every R2 texture / GLB / OBJ loads for real; the urban pack (Assets/Sprites/terrain/urban/) is
// served from the repo's textures/ folder (+ the root) so an unuploaded sheet still shows. Repo scripts from disk, the
// JS libraries from node_modules when present. Needs the server (npm start) and playwright + three@0.128.0 (npm i --no-save).
//   node playtest_city.js <room> '[{"name":"v","x":0,"z":0,"face":0,"pitch":-0.2,"fp":true,"dist":4}]' [--wait=25000] [--nogltf]
//   → shots/city/<room>_<name>.png ; prints [HQ] logs + page errors. See PLAYTEST_NOTES "THE CITY PROBE".
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const OUT = path.join(REPO, 'shots/city'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NPM_MIRROR = [
  [/\/three\.js\/r128\/three\.min\.js$/, 'three/build/three.min.js'], [/\/three@0\.128\.0\/(examples\/js\/.+)$/, 'three/$1'],
  [/\/socket\.io\.min\.js$/, 'socket.io/client-dist/socket.io.min.js'], [/\/react\.production\.min\.js$/, 'react/umd/react.production.min.js'],
  [/\/react-dom\.production\.min\.js$/, 'react-dom/umd/react-dom.production.min.js'], [/\/THREE\.MeshLine\.js$/, 'three.meshline/src/THREE.MeshLine.js'],
];
const CT = { '.js': 'application/javascript', '.css': 'text/css' };
const args = process.argv.slice(2).filter(a => !a.startsWith('--')), flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const flag = (k, d) => { const f = flags.find(x => x === '--' + k || x.startsWith('--' + k + '=')); if (!f) return d; const v = f.split('=')[1]; return v === undefined ? true : v; };
const room = args[0] || 'site_prebuilt_downtown_streets'; const views = JSON.parse(args[1] || '[]'); const noGltf = !!flag('nogltf', false); const WAIT = Number(flag('wait', 22000));
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => fs.existsSync(p));
const run = async () => {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || null;
  const browser = await chromium.launch({ headless: true, executablePath: EXE, proxy: proxy ? { server: proxy, bypass: 'localhost,127.0.0.1' } : undefined, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: Number(flag('w', 1280)), height: Number(flag('h', 800)) } });
  const cnt = { mirror: 0, local: 0, urban: 0, cdn: 0, cache: 0, fail: 0 };
  const CACHE = process.env.EW_CDN_CACHE || path.join(REPO, 'shots/.cdn-cache'); fs.mkdirSync(CACHE, { recursive: true });
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    const base = path.basename(u.pathname), ext = path.extname(base).toLowerCase();
    for (const [re, target] of NPM_MIRROR) { const m = re.exec(u.pathname); if (m) { const abs = path.join(REPO, 'node_modules', target.replace(/\$(\d)/g, (_, i) => m[Number(i)])); if (fs.existsSync(abs)) { cnt.mirror++; return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(abs) }); } } }
    if ((ext === '.js' || ext === '.css') && fs.existsSync(path.join(REPO, base))) { cnt.local++; return route.fulfill({ status: 200, contentType: CT[ext], body: fs.readFileSync(path.join(REPO, base)) }); }
    if (/\/terrain\/urban\//.test(u.pathname) && ext === '.png') { const b2 = decodeURIComponent(base); for (const c of [path.join(REPO, 'textures', b2), path.join(REPO, b2)]) if (fs.existsSync(c)) { cnt.urban++; return route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(c) }); } }
    /* the CDN through the egress proxy: fetched here and re-served WITH a CORS header (the proxy strips it and WebGL then
       refuses every image as cross-origin — the whole city rendered black), cached on disk so a second run is fast */
    if (/^https?:/.test(url)) {
      const key = (u.hostname + u.pathname).replace(/[^a-zA-Z0-9._-]/g, '_'), cf = path.join(CACHE, key), cm = cf + '.meta';
      if (fs.existsSync(cf) && fs.existsSync(cm)) { cnt.cache++; return route.fulfill({ status: 200, contentType: fs.readFileSync(cm, 'utf8'), headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(cf) }); }
      try {
        const resp = await route.fetch(); const body = await resp.body(); const ctype = resp.headers()['content-type'] || 'application/octet-stream';
        if (resp.status() === 200 && body.length) { try { fs.writeFileSync(cf, body); fs.writeFileSync(cm, ctype); } catch (e) {} }
        cnt.cdn++; return route.fulfill({ status: resp.status(), contentType: ctype, headers: { 'access-control-allow-origin': '*' }, body });
      } catch (e) { cnt.fail++; return route.fulfill({ status: 404, body: '' }); }
    }
    return route.continue();
  });
  const page = await context.newPage(); const errs = [], logs = [];
  page.on('crash', () => { console.log('PAGE CRASHED — last logs:', JSON.stringify(logs.slice(-6))); });
  if (flag('flags', '')) await page.addInitScript((fl) => { fl.split(',').forEach(k => { if (k) window[k] = true; }); }, String(flag('flags', '')));
  page.on('pageerror', e => errs.push(String(e && e.message || e).slice(0, 240)));
  page.on('console', m => { const t = m.text(); if (/\[HQ\]|failed|error/i.test(t) && !/tabletop .* has nothing under it/.test(t)) logs.push(t.slice(0, Number(flag('loglen', 240)))); });
  await page.goto('http://localhost:3000/?hq&nomenu3d', { waitUntil: 'commit', timeout: 60000 });
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 120000) { try { const st = await page.evaluate(() => [document.readyState, typeof window._hqEnter, typeof ThreeRenderer !== 'undefined' && !!ThreeRenderer.hq]); if (st[1] === 'function' && st[2]) { ok = true; break; } } catch (e) {} await sleep(800); }
  if (!ok) { console.log('page never ready', errs.slice(0, 5)); await browser.close(); process.exit(1); }
  await page.evaluate((noGltf) => { window.EW_HQ_NO_POST = !!window.EW_CITY_POST ? false : true; window.EW_HQ_DEBUG = true; window.EW_DISABLE_CAST = true; window.EW_HQ_VARIANT = 'none'; if (noGltf) { THREE.GLTFLoader = undefined; } }, noGltf);
  if (flag('post', false)) await page.evaluate(() => { window.EW_HQ_NO_POST = false; });
  await page.evaluate((room) => { window._hqEnter({ from: 'play', room }); }, room);
  await sleep(WAIT);
  await page.evaluate(() => { for (const id of ['hqLoad', 'hqPrompt', 'hqStrip', 'hqToast']) { const h = document.getElementById(id); if (h) h.style.display = 'none'; } });
  const spawn = await page.evaluate((room) => DOOR_HQ.rooms[room].spawn, room);
  const list = views.length ? views : [Object.assign({ name: 'spawn', fp: false, dist: 4.2, pitch: -0.2 }, spawn)];
  for (const v of list) {
    await page.evaluate((v) => { try { if (window._hqPauseDrop) window._hqPauseDrop(); if (window._hqResume) window._hqResume(); } catch (e) {} ThreeRenderer.hq.dev.teleport(v); if (v.eval) { try { eval(v.eval); } catch (e) { console.log('[HQ] eval failed', e); } } }, v);
    await sleep(v.settle || 2600);
    await page.evaluate(() => { try { if (window._hqPauseDrop) window._hqPauseDrop(); const pz = document.getElementById('hqPause'); if (pz) pz.style.display = 'none'; } catch (e) {} });
    const f = path.join(OUT, room + '_' + (v.name || 'v') + '.png'); await page.screenshot({ path: f, timeout: 180000 }); console.log('SHOT', f, 'room=' + await page.evaluate(() => (window._hqCurRoom || (ThreeRenderer.hq.dev.room && ThreeRenderer.hq.dev.room()) || '?')));
  }
  console.log('COUNTERS', JSON.stringify(cnt)); console.log('ERRORS', JSON.stringify(errs.slice(0, 8))); console.log('LOGS', JSON.stringify(logs.slice(0, 30)));
  await browser.close();
};
(async () => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await run(); return; }
    catch (e) { const closed = /has been closed|crashed|Target closed/i.test(String(e && e.message)); console.error('PROBE ' + (closed && attempt < 3 ? 'RETRY ' + attempt : 'FAIL'), String(e && e.message).slice(0, 160)); if (!closed || attempt === 3) process.exit(1); await sleep(3000); }
  }
})();
