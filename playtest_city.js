// playtest_city.js — the D.O.O.R. HQ screenshot probe WITH THE REAL SHEETS (2026-09-17, THE URBAN PACK).
// The sandbox's egress proxy (HTTPS_PROXY) reaches cdn.entropywars.net + the JS CDNs, so — unlike playtest_hq_offline.js
// (stand-in textures) — every R2 texture / GLB / OBJ loads for real; the urban pack (Assets/world/terrain/urban/) is
// served from the repo's textures/ folder (+ the root) so an unuploaded sheet still shows. Repo scripts from disk, the
// JS libraries from node_modules when present. Needs the server (npm start) and playwright + three@0.128.0 (npm i --no-save).
//   node playtest_city.js <room> '[{"name":"v","x":0,"z":0,"face":0,"pitch":-0.2,"fp":true,"dist":4}]' [--wait=<longest wait, ms>] [--sleep=<extra ms>] [--nogltf]
//   → shots/city/<room>_<name>.png ; prints [HQ] logs + page errors. See PLAYTEST_NOTES "THE CITY PROBE".
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const OUT = path.join(REPO, 'shots/city'); fs.mkdirSync(OUT, { recursive: true });
const fast = require('./probe-fast.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const T0 = Date.now(), lap = (l) => console.log('TIME ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s  ' + l);
const NPM_MIRROR = [
  [/\/three\.js\/r128\/three\.min\.js$/, 'three/build/three.min.js'], [/\/three@0\.128\.0\/(examples\/js\/.+)$/, 'three/$1'],
  [/\/socket\.io\.min\.js$/, 'socket.io/client-dist/socket.io.min.js'], [/\/react\.production\.min\.js$/, 'react/umd/react.production.min.js'],
  [/\/react-dom\.production\.min\.js$/, 'react-dom/umd/react-dom.production.min.js'], [/\/THREE\.MeshLine\.js$/, 'three.meshline/src/THREE.MeshLine.js'],
];
const CT = { '.js': 'application/javascript', '.css': 'text/css' };
const args = process.argv.slice(2).filter(a => !a.startsWith('--')), flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const flag = (k, d) => { const f = flags.find(x => x === '--' + k || x.startsWith('--' + k + '=')); if (!f) return d; const i = f.indexOf('='); return i < 0 ? true : f.slice(i + 1); };   // (2026-11-17: the value keeps its own '=' signs: a --pre script has them)
const room = args[0] || 'site_prebuilt_downtown_streets'; const views = JSON.parse(args[1] || '[]'); const noGltf = !!flag('nogltf', false); const WAIT = Number(flag('wait', 22000));
const EXE = fast.EXE;
const run = async () => {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || null;
  const browser = await fast.launch(chromium, { headless: true, executablePath: EXE, proxy: proxy ? { server: proxy, bypass: 'localhost,127.0.0.1' } : undefined, args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-certificate-errors'] });   // probe-fast.js: llvmpipe when it is there, the held screenshot
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: Number(flag('w', 1280)), height: Number(flag('h', 800)) } });
  const cnt = { mirror: 0, local: 0, urban: 0, cdn: 0, cache: 0, fail: 0 };
  const CACHE = process.env.EW_CDN_CACHE || path.join(REPO, 'shots/.cdn-cache'); fs.mkdirSync(CACHE, { recursive: true });
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    const base = path.basename(u.pathname), ext = path.extname(base).toLowerCase();
    if (process.env.EW_ROUTE_LOG && new RegExp(process.env.EW_ROUTE_LOG).test(url)) console.log('ROUTE', Date.now() % 10000000, url.slice(0, 200));
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
  page.on('console', m => { const t = m.text(); if (process.env.EW_LIVE_LOG && /\[HQ\]/.test(t)) console.log('LIVE', t.slice(0, 200)); if (/\[HQ\]|failed|error|diner|warn/i.test(t) && !/tabletop .* has nothing under it/.test(t)) logs.push(t.slice(0, Number(flag('loglen', 240)))); });
  await page.goto('http://localhost:3000/?hq&nomenu3d' + (flag('gpu', false) ? '&ew_gpu=' + flag('gpu', '') : ''), { waitUntil: 'commit', timeout: 60000 });
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 120000) { try { const st = await page.evaluate(() => [document.readyState, typeof window._hqEnter, typeof ThreeRenderer !== 'undefined' && !!ThreeRenderer.hq]); if (st[1] === 'function' && st[2]) { ok = true; break; } } catch (e) {} await sleep(800); }
  if (!ok) { console.log('page never ready', errs.slice(0, 5)); await browser.close(); process.exit(1); }
  await page.evaluate((noGltf) => { window.EW_HQ_NO_POST = !!window.EW_CITY_POST ? false : true; window.EW_HQ_DEBUG = true; window.EW_DISABLE_CAST = true; window.EW_HQ_VARIANT = 'none'; if (noGltf) { THREE.GLTFLoader = undefined; } }, noGltf);
  if (flag('post', false)) await page.evaluate(() => { window.EW_HQ_NO_POST = false; });
  if (flag('pre', false)) await page.evaluate((js) => { try { eval(js); } catch (e) { console.log('[HQ] PROBE pre failed ' + e.message); } }, String(flag('pre', '')));   // --pre=<js>: run in the page before the room is entered (2026-11-15: switch a part of a room off to find what breaks)
  await page.evaluate((room) => { window._hqEnter({ from: 'play', room }); }, room);
  /* THE WAIT (2026-11-16): no fixed sleep. The probe goes on the moment the room's load gate is ready and the network is
     quiet; --wait is now the LONGEST it waits (default 240 s), --sleep=<ms> adds a fixed pause after it (the old way). */
  lap('entering ' + room);
  const rdy = await fast.roomReady(page, { timeout: Math.max(WAIT, 240000) });
  if (!rdy.ok) console.log('ROOM NOT READY — the pictures below may show a half-loaded room');
  if (flag('sleep', false)) await sleep(Number(flag('sleep', 0)));
  lap('room ready');
  await page.evaluate(() => { for (const id of ['hqLoad', 'hqPrompt', 'hqStrip', 'hqToast']) { const h = document.getElementById(id); if (h) h.style.display = 'none'; } });
  const spawn = await page.evaluate((room) => DOOR_HQ.rooms[room].spawn, room);
  const list = views.length ? views : [Object.assign({ name: 'spawn', fp: false, dist: 4.2, pitch: -0.2 }, spawn)];
  for (const v of list) {
    await page.evaluate((v) => { try { if (window._hqPauseDrop) window._hqPauseDrop(); if (window._hqResume) window._hqResume(); } catch (e) {} ThreeRenderer.hq.dev.teleport(v); if (v.eval) { try { eval(v.eval); } catch (e) { console.log('[HQ] eval failed', e); } } }, v);
    await fast.settle(page, v.settle);   // two drawn frames of the new view (or "settle": <ms> on the view)
    await page.evaluate(() => { try { if (window._hqPauseDrop) window._hqPauseDrop(); const pz = document.getElementById('hqPause'); if (pz) pz.style.display = 'none'; } catch (e) {} });
    /* "walk": { "key": "w", "max": 90000 } on a view (2026-11-17, the One World seams): after the picture's place is set, hold the key until the room changes (a seam or a
       passage was walked through) or `max` ms pass; prints WALK <name> <from> -> <to | NO CHANGE> with the metres moved. The picture is taken BEFORE the walk. */
    if (v.walk) { const f0 = path.join(OUT, room + '_' + (v.name || 'v') + '.png'); await page.screenshot({ path: f0, timeout: 180000 });
      const pos = () => page.evaluate(() => { const g = ThreeRenderer.hq.dev.playerGroup && ThreeRenderer.hq.dev.playerGroup(); return [ThreeRenderer.hq.room(), g ? +(g.position.x / 73).toFixed(1) : null, g ? +(g.position.z / 73).toFixed(1) : null]; });
      const a = await pos(), t1 = Date.now(), key = v.walk.key || 'w'; let b = a, last = a;
      await page.mouse.move(640, 400); if (v.walk.run !== false) await page.keyboard.down('Shift'); await page.keyboard.down(key);   // (running unless "run": false: the software probe's walker is slow)
      while (Date.now() - t1 < (v.walk.max || 90000)) { await sleep(700); try { b = await pos(); } catch (e) { break; } if (b[0] !== a[0]) break; if (b[1] != null) last = b; }
      await page.keyboard.up(key); if (v.walk.run !== false) await page.keyboard.up('Shift');
      console.log('WALK ' + (v.name || 'v') + ' ' + a[0] + ' (' + a[1] + ', ' + a[2] + ') -> ' + (b[0] !== a[0] ? b[0] : 'NO CHANGE') + ' after ' + ((Date.now() - t1) / 1000).toFixed(1) + ' s, last seen at (' + last[1] + ', ' + last[2] + '), ' + Math.hypot(last[1] - a[1], last[2] - a[2]).toFixed(1) + ' m');
      if (b[0] !== a[0]) { await fast.roomReady(page, { timeout: 240000 }); await page.evaluate(() => { for (const id of ['hqLoad', 'hqPrompt', 'hqStrip', 'hqToast']) { const h = document.getElementById(id); if (h) h.style.display = 'none'; } }); await fast.settle(page, 3000);
        const f1 = path.join(OUT, room + '_' + (v.name || 'v') + '_arrived.png'); await page.screenshot({ path: f1, timeout: 180000 }); const c = await pos(); console.log('ARRIVED ' + c[0] + ' at (' + c[1] + ', ' + c[2] + ')'); lap('walked ' + (v.name || 'v')); if (v.walk.then) continue; break; }   // "then": true = go on with the next views in the room it reached (a chain of seams in one run, 2026-11-17)
      lap('walk ' + (v.name || 'v')); continue; }
    const f = path.join(OUT, room + '_' + (v.name || 'v') + '.png'); await page.screenshot({ path: f, timeout: 180000 }); lap('shot ' + (v.name || 'v')); console.log('SHOT', f, 'room=' + await page.evaluate(() => (window._hqCurRoom || (ThreeRenderer.hq.dev.room && ThreeRenderer.hq.dev.room()) || '?')));
  }
  console.log('COUNTERS', JSON.stringify(cnt)); console.log('ERRORS', JSON.stringify(errs.slice(0, 8))); console.log('LOGS', JSON.stringify(logs.slice(0, 30))); console.log('PROBES', JSON.stringify(logs.filter(t => /PROBE|diner/i.test(t)).slice(0, 12)));
  await browser.close();
};
(async () => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { await run(); return; }
    catch (e) { const closed = /has been closed|crashed|Target closed/i.test(String(e && e.message)); console.error('PROBE ' + (closed && attempt < 3 ? 'RETRY ' + attempt : 'FAIL'), String(e && e.message).slice(0, 160)); if (!closed || attempt === 3) process.exit(1); await sleep(3000); }
  }
})();
