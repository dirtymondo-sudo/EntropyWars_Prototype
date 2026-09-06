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
//   room: central_egress | office | training | bay_terrestrial
//   force-json: {"belle":1,"kit":1,"elle":0,...}  (spot index per member, -1 = absent)
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const crypto = require('crypto');
const LOCAL = new Set(['sprites.js', 'data.js', 'three-renderer.js', 'map.js']);
const HOSTS = new Set(['cdn.entropywars.net', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'cdn.socket.io']);
const CACHE = path.join(REPO, '.asset-cache'); fs.mkdirSync(CACHE, { recursive: true });
const CT = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
/* Chromium cannot reach the CDN through the sandbox proxy (resets); Node fetch can — so the browser runs with no network and every CDN asset is fetched Node-side, cached on disk, and fulfilled. */
async function installNodeFetchCache(context) {
  let hits = 0, misses = 0, fails = 0;
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    if (!HOSTS.has(u.host)) return route.abort();
    const base = path.basename(u.pathname);
    if (LOCAL.has(base)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(REPO, base)) });
    const key = crypto.createHash('md5').update(u.origin + u.pathname).digest('hex').slice(0, 12) + '_' + base;
    const file = path.join(CACHE, key), ct = CT[path.extname(base).toLowerCase()] || 'application/octet-stream';
    if (fs.existsSync(file)) { hits++; return route.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(file) }); }
    try {
      const r = await fetch(url); if (!r.ok) { fails++; return route.fulfill({ status: r.status, body: '' }); }
      const buf = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(file, buf); misses++;
      return route.fulfill({ status: 200, contentType: ct, body: buf });
    } catch (e) { fails++; return route.abort(); }
  });
  return { stats: () => ({ hits, misses, fails }) };
}
const room = process.argv[2] || 'central_egress';
const force = JSON.parse(process.argv[3] || '{}');
const tag = process.argv[4] || '';
const OUT = path.join(REPO, 'shots/hq');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
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
    while (Date.now() - t0 < 180000) { try { last = await page.evaluate(() => [document.readyState, typeof window._hqEnter, typeof window.hqCastInRoom, typeof ThreeRenderer, !!(typeof ThreeRenderer !== 'undefined' && ThreeRenderer.hq)]); if (last[0] === 'complete' && last[1] === 'function' && last[2] === 'function' && last[4]) { ok = true; break; } } catch (e) { last = ['nav']; } await sleep(1000); }
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
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
