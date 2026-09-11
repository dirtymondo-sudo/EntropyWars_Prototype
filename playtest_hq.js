// playtest_hq.js — D.O.O.R. headquarters screenshot probe (repo tooling, 2026-09-06).
// Enters a room of the walkable HQ with the LOCAL sprites.js / data.js / three-renderer.js /
// map.js, pins cast members to chosen spots, and photographs every character from the front
// and three-quarter (or over the shoulder when the front eye would be in a wall) plus a
// third-person establishing shot from the spawn → shots/hq/<room>_<tag>_<char>_<view>.png.
// Also prints ThreeRenderer.hq.dev.chars() and each cast member's Hips / RightHand bones.
//   npm start   (server on :3000)
//   NODE_USE_ENV_PROXY=1 node playtest_hq.js central_egress '{"belle":1,"otto":0,"elle":-1}' tag
// Sandbox note: Chromium cannot reach the CDN through the agent proxy (connection resets), so
// the browser runs with no proxy and every CDN asset is fetched Node-side (which does work
// through the proxy) into .asset-cache/ and fulfilled from there. See PLAYTEST_NOTES.md.
// Usage: node playtest_hq.js <room> [force-json] [tag]
//   room: central_egress | office | training | ring_g | ring_m (the containment ring per floor) | bay_terrestrial (the stage-1 bay, corridor off)
//   force-json: {"belle":1,"kit":1,"elle":0,...}  (spot index per member, -1 = absent)
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const crypto = require('crypto');
const LOCAL = new Set(fs.readdirSync(REPO).filter(f => /\.(js|css)$/.test(f) && !/\.test\.js$/.test(f)));   // every repo script / style (the local edits under test)
const HOSTS = new Set(['cdn.entropywars.net', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'cdn.socket.io']);
const CACHE = path.join(REPO, '.asset-cache'); fs.mkdirSync(CACHE, { recursive: true });
const CT = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
/* Chromium cannot reach the CDN through the sandbox proxy (resets); Node fetch can — so every CDN
   asset is fetched Node-side ONCE into .asset-cache/ and served back to the browser. Since 2026-09-11
   the bytes go over a LOCAL HTTP MIRROR (an in-process server on :3999) and the page route only
   REDIRECTS there: fulfilling multi-megabyte GLBs through route.fulfill() pushes them down Chromium's
   DevTools pipe, and with a warm cache (everything landing at once) the browser exited cleanly
   ~10 s after launch ("Connection terminated while reading from pipe") on every run. */
const http = require('http');
const inflight = new Map();
function startAssetMirror(port) {
  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Cache-Control', 'no-store');
    try {
      if (u.pathname.startsWith('/local/')) {
        const f = path.join(REPO, path.basename(u.pathname));
        if (!fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
        res.setHeader('Content-Type', CT[path.extname(f)] || 'application/javascript');
        return fs.createReadStream(f).pipe(res);
      }
      if (u.pathname === '/a') {
        const url = u.searchParams.get('u'); const U = new URL(url);
        const base = path.basename(U.pathname);
        const key = crypto.createHash('md5').update(U.origin + U.pathname).digest('hex').slice(0, 12) + '_' + base;
        const file = path.join(CACHE, key), ct = CT[path.extname(base).toLowerCase()] || 'application/octet-stream';
        if (!fs.existsSync(file)) {
          if (!inflight.has(key)) inflight.set(key, (async () => {
            const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status);
            fs.writeFileSync(file + '.part', Buffer.from(await r.arrayBuffer())); fs.renameSync(file + '.part', file);
          })().finally(() => inflight.delete(key)));
          try { await inflight.get(key); } catch (e) { res.statusCode = 502; return res.end(String(e.message)); }
        }
        res.setHeader('Content-Type', ct); res.setHeader('Content-Length', fs.statSync(file).size);
        return fs.createReadStream(file).pipe(res);
      }
      res.statusCode = 404; res.end();
    } catch (e) { res.statusCode = 500; res.end(String(e.message)); }
  });
  srv.listen(port, '127.0.0.1');
  return srv;
}
async function installNodeFetchCache(context) {
  let local = 0, mirrored = 0, aborted = 0;
  const A = 'http://127.0.0.1:' + MIRROR_PORT;
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    if (!HOSTS.has(u.host)) { aborted++; return route.abort(); }
    const base = path.basename(u.pathname);
    if (LOCAL.has(base)) { local++; return route.fulfill({ status: 302, headers: { location: A + '/local/' + base } }); }
    mirrored++;
    return route.fulfill({ status: 302, headers: { location: A + '/a?u=' + encodeURIComponent(u.origin + u.pathname) } });
  });
  return { stats: () => ({ local, mirrored, aborted }) };
}
const MIRROR_PORT = +(process.env.EW_MIRROR_PORT || 3999);
const room = process.argv[2] || 'central_egress';
const force = JSON.parse(process.argv[3] || '{}');
const tag = process.argv[4] || '';
const OUT = path.join(REPO, 'shots/hq');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const mirror = startAssetMirror(MIRROR_PORT);
  const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(exe) ? exe : undefined,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const cache = await installNodeFetchCache(context);
  const page = await context.newPage();
  const errs = [], logs = [], failed = [];
  page.on('requestfailed', r => failed.push(r.url().slice(0, 120) + ' ' + (r.failure() && r.failure().errorText)));
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { const t = m.text(); if (/HQ|cast|clip|retarget|GLTF|glb|missing|warn/i.test(t)) logs.push(t.slice(0, 220)); });
  await page.goto('http://localhost:3000/?hq', { waitUntil: 'commit', timeout: 70000 });
  /* the page may reload once (?hq dev flag); poll the globals, tolerating navigations */
  { const t0 = Date.now(); let ok = false, last = null;
    while (Date.now() - t0 < 180000) { try { last = await page.evaluate(() => [document.readyState, typeof window._hqEnter, typeof window.hqCastInRoom, typeof ThreeRenderer, !!(typeof ThreeRenderer !== 'undefined' && ThreeRenderer.hq)]); if ((last[0] === 'complete' || (last[0] === 'interactive' && Date.now() - t0 > 30000)) && last[1] === 'function' && last[2] === 'function' && last[4]) { ok = true; break; } } catch (e) { last = ['nav']; } await sleep(1000); }
    console.log('page state', JSON.stringify(last), 'after', ((Date.now() - t0) / 1000).toFixed(0), 's');
    if (!ok) { console.log('failed requests:', JSON.stringify(failed.slice(0, 6))); console.log('errors:', JSON.stringify(errs.slice(0, 6))); await browser.close(); process.exit(1); } }
  await page.evaluate((force) => {
    const orig = window.hqCastInRoom;
    window.hqCastInRoom = (r, p, o) => orig(r, p, Object.assign({ salt: 'probe', force }, o || {}));
    window.EW_HQ_NO_POST = true;
  }, force);
  await page.evaluate((room) => { window._hqEnter({ from: 'play', room }); }, room);
  // wait for every character to have its model + baked actions
  const t0 = Date.now();
  let chars = [];
  while (Date.now() - t0 < 240000) {
    chars = await page.evaluate(() => (ThreeRenderer.hq.dev ? ThreeRenderer.hq.dev.chars() : []));
    if (chars.length && chars.every(c => c.attached && c.actions > 0)) break;
    await sleep(1500);
  }
  await sleep(2500);
  chars = await page.evaluate(() => ThreeRenderer.hq.dev.chars());
  console.log('ROOM', room, 'chars:', JSON.stringify(chars));
  for (const c of chars) { if (c.kind !== 'cast') continue; const b = await page.evaluate(([id]) => ({ hips: ThreeRenderer.hq.dev.bone(id, 'Hips'), rhand: ThreeRenderer.hq.dev.bone(id, 'RightHand') }), [c.id]); console.log('BONES', c.id, JSON.stringify(b)); }
  const shots = [];
  async function shot(name, tp) {
    await page.evaluate((tp) => ThreeRenderer.hq.dev.teleport(tp), tp);
    await sleep(700);
    const f = path.join(OUT, `${room}${tag ? '_' + tag : ''}_${name}.png`);
    await page.screenshot({ path: f });
    shots.push(f);
  }
  // establishing shot from the spawn (third person)
  await page.evaluate(() => { const h = document.getElementById('hqLoad'); if (h) h.style.display = 'none'; const hp = document.getElementById('hqPrompt'); if (hp) hp.style.display = 'none'; });
  const shell = await page.evaluate((room) => { const r = DOOR_HQ.rooms[room]; return r ? { kind: r.kind, s: r.shell } : null; }, room);
  const inWall = (x, z, level) => { if (!shell) return false; const r = Math.hypot(x, z); if (shell.kind === 'box') return Math.abs(x) > shell.s.w / 2 - 0.4 || Math.abs(z) > shell.s.d / 2 - 0.4; if (shell.kind === 'bay') return r < shell.s.rIn + 0.4 || r > shell.s.rOut - 0.4; return r > (level ? shell.s.mezz.outer - 0.5 : shell.s.radius - 0.5) || (!level && r < 5.9); };
  // establishing third-person shot from the spawn
  const spawn = await page.evaluate((room) => DOOR_HQ.rooms[room].spawn, room);
  await shot('spawn_tp', Object.assign({ fp: false, dist: 4.2, pitch: -0.2 }, spawn));
  for (const c of chars) {
    if (c.kind === 'player') continue;
    if (c.kind !== 'cast' && !/agent/.test(c.kind)) continue;
    const rad = a => a * Math.PI / 180;
    const level = c.y > 2 ? 1 : 0;
    const low = (c.pose === 'hqSit' || c.pose === 'hqCrouch' || c.pose === 'hqFix');
    const name = c.id.replace('hq-', '');
    // candidate angles: front, three-quarter; if the eye would be in a wall use over-the-shoulder angles instead
    const angles = [[c.face, 'front', 2.6], [c.face + 50, '34', 3.0]];
    const alt = [[c.face + 135, 'ots', 2.4], [c.face + 225, 'ots2', 2.4]];
    let list = angles;
    if (angles.some(([g, , d]) => inWall(c.x + Math.sin(rad(g)) * d, c.z - Math.cos(rad(g)) * d, level))) list = alt;
    for (const [g, tag2, d] of list) {
      await shot(name + '_' + tag2, { x: c.x + Math.sin(rad(g)) * d, z: c.z - Math.cos(rad(g)) * d, level, face: g + 180, pitch: low ? -0.3 : -0.16, fp: true });
    }
  }
  console.log('SHOTS', shots.map(s => path.basename(s)).join(' '));
  console.log('CACHE', JSON.stringify(cache.stats()));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
  console.log('LOGS', JSON.stringify(logs.slice(0, 30)));
  await browser.close();
  mirror.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
