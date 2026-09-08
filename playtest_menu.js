// playtest_menu.js — main-menu scene screenshot probe (repo tooling, 2026-09-08).
// Boots the title with the LOCAL R2 files (sprites/data/three-renderer/map/ui + the stylesheets),
// presses ENTER off the title, and photographs the lone-door menu scene (three-renderer.js
// ThreeRenderer.menu): the shut door, then the ENTER beat at three moments (push-in, the open
// hold, back out) → shots/menu/<biome>_<tag>_<moment>.png. Prints page errors + the scene record.
//   npm start   (server on :3000)
//   NODE_USE_ENV_PROXY=1 node playtest_menu.js desert [tag]
// Sandbox note (same as playtest_hq.js): Chromium cannot reach the CDN through the agent proxy,
// so the browser runs with no proxy and every CDN asset is fetched Node-side into .asset-cache/.
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const crypto = require('crypto');
const LOCAL = new Set(['sprites.js', 'data.js', 'three-renderer.js', 'map.js', 'ui.js', 'battle.js', 'state.js', 'audio.js', 'hud.js', 'three-post.js',
  'styles-base.css', 'styles-hud.css', 'styles-cinematic.css', 'styles-animations.css', 'styles-editor.css']);
const HOSTS = new Set(['cdn.entropywars.net', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'cdn.socket.io', 'fonts.googleapis.com', 'fonts.gstatic.com']);
const CACHE = path.join(REPO, '.asset-cache'); fs.mkdirSync(CACHE, { recursive: true });
const CT = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.obj': 'text/plain', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
/* This environment's network policy blocks the CDNs outright (CONNECT 403), so the probe serves
   what it can from the repo + node_modules (three r128 + its examples, React UMD, socket.io from
   the server) and hands every blocked IMAGE a flat placeholder PNG (tinted by URL hash) so lit
   materials keep their colour instead of sampling an empty texture. GLBs/audio/video are aborted:
   the door shows its procedural stand-in and the Sedan is absent — verify those by position. */
const PNG1 = (() => {
  // 8x8 mid-grey PNG built by hand (zlib stored block)
  const zlib = require('zlib');
  const w = 8, h = 8, raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 150; raw[o + 1] = 150; raw[o + 2] = 150; } }
  const crc = (buf) => { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
})();
async function installNodeFetchCache(context) {
  let hits = 0, misses = 0, fails = 0, local = 0, stubs = 0;
  const NM = path.join(REPO, 'node_modules');
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    if (u.host === 'fonts.googleapis.com' || u.host === 'fonts.gstatic.com') return route.continue();
    const base = path.basename(u.pathname), ext = path.extname(base).toLowerCase();
    const ct = CT[ext] || 'application/octet-stream';
    const serve = (file) => { local++; return route.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(file) }); };
    if (u.host === 'cdn.entropywars.net' && fs.existsSync(path.join(REPO, base)) && /\.(js|css)$/.test(base)) return serve(path.join(REPO, base));
    if (u.host === 'cdn.entropywars.net' && base === 'react.production.min.js') return serve(path.join(NM, 'react/umd/react.production.min.js'));
    if (u.host === 'cdn.entropywars.net' && base === 'react-dom.production.min.js') return serve(path.join(NM, 'react-dom/umd/react-dom.production.min.js'));
    if (u.host === 'cdnjs.cloudflare.com' && base === 'three.min.js') return serve(path.join(NM, 'three/build/three.min.js'));
    if (u.host === 'cdn.jsdelivr.net' && /^\/npm\/three@0\.128\.0\//.test(u.pathname)) { const f = path.join(NM, 'three', u.pathname.replace(/^\/npm\/three@0\.128\.0\//, '')); if (fs.existsSync(f)) return serve(f); }
    if (u.host === 'cdn.socket.io') { try { const r = await fetch('http://localhost:3000/socket.io/socket.io.js'); local++; return route.fulfill({ status: 200, contentType: 'application/javascript', body: Buffer.from(await r.arrayBuffer()) }); } catch (e) {} }
    const key = crypto.createHash('md5').update(u.origin + u.pathname).digest('hex').slice(0, 12) + '_' + base;
    const file = path.join(CACHE, key);
    if (fs.existsSync(file)) { hits++; return route.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(file) }); }
    if (!HOSTS.has(u.host)) return route.abort();
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error('http ' + r.status);
      const buf = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(file, buf); misses++;
      return route.fulfill({ status: 200, contentType: ct, body: buf });
    } catch (e) {
      fails++;
      if (/\.(png|jpg|jpeg|webp)$/.test(ext)) { stubs++; return route.fulfill({ status: 200, contentType: 'image/png', body: PNG1 }); }
      return route.abort();
    }
  });
  return { stats: () => ({ hits, misses, fails, local, stubs }) };
}
const biome = process.argv[2] || 'desert';
const tag = process.argv[3] || '';
const OUT = path.join(REPO, 'shots/menu'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(exe) ? exe : undefined,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*', '--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1600, height: 900 } });
  const cache = await installNodeFetchCache(context);
  const page = await context.newPage();
  const errs = [], logs = [], failed = [];
  page.on('requestfailed', r => failed.push(r.url().slice(0, 120) + ' ' + (r.failure() && r.failure().errorText)));
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { const t = m.text(); if (/MENU|GLTF|glb|error|warn/i.test(t)) logs.push(t.slice(0, 220)); });
  /* software GL renders ~1 fps: stretch the beat so its moments can be photographed (beat seconds below are unscaled) */
  const SCALE = +(process.env.MENU_CINE_SCALE || 6);
  await page.addInitScript((sc) => { window.EW_DISABLE_DOOR_IDENT = true; window.EW_MENU_CINE_SCALE = sc; }, SCALE);
  await page.goto('http://localhost:3000/?menubiome=' + biome, { waitUntil: 'commit', timeout: 70000 });
  { const t0 = Date.now(); let ok = false, last = null;
    while (Date.now() - t0 < 180000) {
      try { last = await page.evaluate(() => [document.readyState, !!window._gameReady, typeof window.enterGameFromTitle, typeof ThreeRenderer, !!(typeof ThreeRenderer !== 'undefined' && ThreeRenderer.menu)]); } catch (e) { last = ['nav']; }
      if (last[1] && last[2] === 'function' && last[4]) { ok = true; break; }
      await sleep(1000);
    }
    console.log('page state', JSON.stringify(last), 'after', ((Date.now() - t0) / 1000).toFixed(0), 's');
    if (!ok) { console.log('failed requests:', JSON.stringify(failed.slice(0, 8))); console.log('errors:', JSON.stringify(errs.slice(0, 6))); await browser.close(); process.exit(1); } }
  await page.evaluate(() => { try { if (typeof window.doorIdentSkip === 'function') window.doorIdentSkip(); } catch (e) {} window.enterGameFromTitle(); });
  const t1 = Date.now(); let rec = null;
  while (Date.now() - t1 < 120000) {
    rec = await page.evaluate(() => { const M = ThreeRenderer.menu.dev.rec(); return M ? { live: ThreeRenderer.menu.active(), biome: M.biome, leafHot: M.leafHot, sedan: !!(M.sedan && M.sedan.children.length), lamps: M.lamps.length, state: ThreeRenderer.menu.state() } : null; });
    if (rec && rec.live && rec.leafHot && rec.sedan) break;
    await sleep(1000);
  }
  await sleep(2500);
  console.log('MENU', JSON.stringify(rec), 'after', ((Date.now() - t1) / 1000).toFixed(0), 's');
  const shots = [];
  async function shot(name) { const f = path.join(OUT, `${biome}${tag ? '_' + tag : ''}_${name}.png`); await page.screenshot({ path: f }); shots.push(f); }
  await shot('shut');
  await page.evaluate(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
  /* the beat's own clock: shoot at chosen seconds into the cinematic, logging the camera on the way */
  const beatAt = () => page.evaluate((sc) => { const M = ThreeRenderer.menu.dev.rec(); const c = M.camera.position; return { e: M.cine ? (performance.now() - M.cine.t0) / 1000 / sc : -1, cam: [+(c.x / M.U).toFixed(2), +(c.y / M.U).toFixed(2), +(c.z / M.U).toFixed(2)], open: +M.open.toFixed(2), st: ThreeRenderer.menu.state() }; }, SCALE);
  const marks = [['push', 1.2], ['open', 2.3], ['back', 5.4]];
  const t2 = Date.now(); let mi = 0;
  while (mi < marks.length && Date.now() - t2 < 20000 * SCALE) {
    const b = await beatAt(); console.log('beat', JSON.stringify(b));
    if ((b.e >= marks[mi][1]) || (b.e < 0 && mi === marks.length - 1 && Date.now() - t2 > 5000)) { await shot(marks[mi][0]); mi++; }
    await sleep(250);
  }
  const st = await page.evaluate(() => ThreeRenderer.menu.state());
  console.log('door state after the beat:', st);
  console.log('cache', JSON.stringify(cache.stats()));
  console.log('errors:', JSON.stringify(errs.slice(0, 8)));
  console.log('logs:', JSON.stringify(logs.slice(0, 20)));
  console.log('shots:', shots.join('\n'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
