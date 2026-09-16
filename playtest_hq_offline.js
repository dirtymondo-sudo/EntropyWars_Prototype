// playtest_hq_offline.js — the D.O.O.R. HQ screenshot probe for a sandbox where the CDN is BLOCKED (2026-09-16, the visual pass).
// Repo scripts served from disk, three r128 / React / socket.io from node_modules (npm i --no-save three@0.128.0 react@18 react-dom@18),
// stand-in textures coloured by file name, every GLB a 404 (procedural props only; --nogltf removes THREE.GLTFLoader so the
// kit helpers build their procedural STAND-INS — the vehicles' boxes at the room's tile). Needs the server (npm start).
//   node playtest_hq_offline.js <room> '[{"name":"v","x":0,"z":0,"face":0,"pitch":-0.2,"fp":true}]' [--nogltf]   → shots/hqpass/<room>_<name>.png
// Prints [HQ] logs (the TABLETOP SEAT's 'nothing under it' warnings under EW_HQ_DEBUG) — see PLAYTEST_NOTES 'THE VISUAL PASS'.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const OUT = path.join(REPO, 'shots/hqpass'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NPM_MIRROR = [
  [/\/three\.js\/r128\/three\.min\.js$/, 'three/build/three.min.js'], [/\/three@0\.128\.0\/(examples\/js\/.+)$/, 'three/$1'],
  [/\/socket\.io\.min\.js$/, 'socket.io/client-dist/socket.io.min.js'], [/\/react\.production\.min\.js$/, 'react/umd/react.production.min.js'],
  [/\/react-dom\.production\.min\.js$/, 'react-dom/umd/react-dom.production.min.js'], [/\/THREE\.MeshLine\.js$/, 'three.meshline/src/THREE.MeshLine.js'],
];
function png(w, h, rgba) { const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]); }
const PAL = [[/carpet/, [150, 120, 80]], [/terrazzo|marble/, [210, 205, 195]], [/drywall/, [200, 196, 186]], [/oxblood|leather/, [90, 40, 40]], [/wood|plank/, [128, 90, 58]], [/concrete/, [130, 130, 134]], [/alu|metal|steel|gunmetal/, [150, 158, 166]], [/ceiling/, [225, 225, 220]], [/teal/, [40, 130, 130]], [/stone|rock/, [120, 112, 108]]];
const tex = {}; function standIn(url) { const b = url.toLowerCase(); let c = [140, 130, 150]; for (const [re, col] of PAL) if (re.test(b)) { c = col; break; } const k = c.join(','); if (tex[k]) return tex[k]; const w = 64, h = 64, px = Buffer.alloc(w * h * 4); let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; for (let i = 0; i < w * h; i++) { const n = 0.85 + rnd() * 0.3; px[i * 4] = Math.min(255, c[0] * n); px[i * 4 + 1] = Math.min(255, c[1] * n); px[i * 4 + 2] = Math.min(255, c[2] * n); px[i * 4 + 3] = 255; } return (tex[k] = png(w, h, px)); }
const CT = { '.js': 'application/javascript', '.css': 'text/css' };
const room = process.argv[2] || 'cafeteria'; const views = JSON.parse(process.argv[3] || '[]'); const noGltf = process.argv.includes('--nogltf');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const cnt = { mirror: 0, local: 0, tex: 0, miss: 0 };
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    const base = path.basename(u.pathname), ext = path.extname(base).toLowerCase();
    for (const [re, target] of NPM_MIRROR) { const m = re.exec(u.pathname); if (m) { const abs = path.join(REPO, 'node_modules', target.replace(/\$(\d)/g, (_, i) => m[Number(i)])); if (fs.existsSync(abs)) { cnt.mirror++; return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(abs) }); } } }
    if ((ext === '.js' || ext === '.css') && fs.existsSync(path.join(REPO, base))) { cnt.local++; return route.fulfill({ status: 200, contentType: CT[ext], body: fs.readFileSync(path.join(REPO, base)) }); }
    if (ext === '.js') { cnt.miss++; return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }); }
    if (/\.(png|jpg|jpeg|webp)$/.test(ext)) { cnt.tex++; return route.fulfill({ status: 200, contentType: 'image/png', body: standIn(u.pathname) }); }
    cnt.miss++; return route.fulfill({ status: 404, body: '' });
  });
  const page = await context.newPage(); const errs = [], logs = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e).slice(0, 200)));
  page.on('console', m => { const t = m.text(); if (/\[HQ\]|tabletop|seat|front/i.test(t)) logs.push(t.slice(0, 200)); });
  await page.goto('http://localhost:3000/?hq&nomenu3d', { waitUntil: 'commit', timeout: 60000 });
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 90000) { try { const st = await page.evaluate(() => [document.readyState, typeof window._hqEnter, typeof ThreeRenderer !== 'undefined' && !!ThreeRenderer.hq]); if (st[1] === 'function' && st[2]) { ok = true; break; } } catch (e) {} await sleep(800); }
  if (!ok) { console.log('page never ready', errs.slice(0, 5)); await browser.close(); process.exit(1); }
  await page.evaluate((noGltf) => { window.EW_HQ_NO_POST = true; window.EW_HQ_DEBUG = true; window.EW_DISABLE_CAST = true; window.EW_HQ_VARIANT = 'none'; if (noGltf) { THREE.GLTFLoader = undefined; } }, noGltf);
  await page.evaluate((room) => { window._hqEnter({ from: 'play', room }); }, room);
  await sleep(9000);
  await page.evaluate(() => { const h = document.getElementById('hqLoad'); if (h) h.style.display = 'none'; const hp = document.getElementById('hqPrompt'); if (hp) hp.style.display = 'none'; const s = document.getElementById('hqStrip'); if (s) s.style.display = 'none'; });
  const spawn = await page.evaluate((room) => DOOR_HQ.rooms[room].spawn, room);
  const list = views.length ? views : [Object.assign({ name: 'spawn', fp: false, dist: 4.2, pitch: -0.2 }, spawn)];
  for (const v of list) { await page.evaluate((v) => ThreeRenderer.hq.dev.teleport(v), v); await sleep(2600); const f = path.join(OUT, room + '_' + (v.name || 'v') + '.png'); await page.screenshot({ path: f }); console.log('SHOT', f); }
  console.log('COUNTERS', JSON.stringify(cnt)); console.log('ERRORS', JSON.stringify(errs.slice(0, 6))); console.log('LOGS', JSON.stringify(logs.slice(0, 20)));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
