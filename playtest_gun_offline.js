// playtest_gun_offline.js — THE DOOR GUN probe (2026-09-16, rev 4): the offline HQ harness (playtest_hq_offline.js's mirror + stand-ins)
// PLUS every GLB the repo holds served from disk — the animation libraries (rigged_animations/), the creator base (charactercreation/),
// the door kit + the ray gun (doors/) — so the walker is a POSED, rigged rig holding the real gun. Pointer lock is stubbed (headless: a
// refused lock read as the eaten ESC and paused the walk) and the keys are driven through hq.dev.press (a headless window drops real
// key events on every evaluate). Steps: [{eval}, {wait}, {teleport}, {shot}, {keydown|keyup}, {sample: ms, n, hold: key}] → shots/gun/.
//   node playtest_gun_offline.js medwing '''[{"eval":"ThreeRenderer.hq.portalDraw(true)"},{"wait":5000},{"teleport":{"x":1.5,"z":0,"face":0,"fp":true},"eval":"ThreeRenderer.hq.portalFire()","shot":"A"}]''' tag
// Needs the server (npm start) + npm i --no-save three@0.128.0 react@18 react-dom@18 playwright three.meshline. See PLAYTEST_NOTES "THE DOOR GUN PROBE".
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const OUT = path.join(REPO, 'shots/gun'); fs.mkdirSync(OUT, { recursive: true });
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
const tex = {}; function standIn(url) { const c = /carpet/.test(url) ? [150,120,80] : /drywall/.test(url) ? [200,196,186] : /concrete/.test(url) ? [130,130,134] : /wood/.test(url) ? [128,90,58] : [140,130,150]; const k = c.join(','); if (tex[k]) return tex[k]; const w = 64, h = 64, px = Buffer.alloc(w * h * 4); let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; for (let i = 0; i < w * h; i++) { const n = 0.85 + rnd() * 0.3; px[i * 4] = Math.min(255, c[0] * n); px[i * 4 + 1] = Math.min(255, c[1] * n); px[i * 4 + 2] = Math.min(255, c[2] * n); px[i * 4 + 3] = 255; } return (tex[k] = png(w, h, px)); }
const CT = { '.js': 'application/javascript', '.css': 'text/css' };
const room = process.argv[2] || 'training'; const steps = JSON.parse(process.argv[3] || '[]'); const tag = process.argv[4] || 'p';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const cnt = { mirror: 0, local: 0, tex: 0, miss: 0, glb: 0 }; const missed = [];
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    const pn = decodeURIComponent(u.pathname); const base = path.basename(pn), ext = path.extname(base).toLowerCase();
    for (const [re, target] of NPM_MIRROR) { const m = re.exec(u.pathname); if (m) { const abs = path.join(REPO, 'node_modules', target.replace(/\$(\d)/g, (_, i) => m[Number(i)])); if (fs.existsSync(abs)) { cnt.mirror++; return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(abs) }); } } }
    if ((ext === '.js' || ext === '.css') && fs.existsSync(path.join(REPO, base))) { cnt.local++; return route.fulfill({ status: 200, contentType: CT[ext], body: fs.readFileSync(path.join(REPO, base)) }); }
    if (ext === '.js') { cnt.miss++; return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }); }
    if (ext === '.glb') {
      const cands = [path.join(REPO, 'doors', base), path.join(REPO, 'charactercreation', base), path.join(REPO, 'rigged_animations', 'Assets_Models_' + base), path.join(REPO, 'rigged_animations', base), path.join(REPO, base)];
      for (const c of cands) if (fs.existsSync(c)) { cnt.glb++; return route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: fs.readFileSync(c) }); }
      missed.push(pn); cnt.miss++; return route.fulfill({ status: 404, body: '' });
    }
    if (/\.(png|jpg|jpeg|webp)$/.test(ext)) { const loc = path.join(REPO, 'charactercreation/clothingtextures', base); if (fs.existsSync(loc)) return route.fulfill({ status: 200, contentType: 'image/png', body: fs.readFileSync(loc) }); cnt.tex++; return route.fulfill({ status: 200, contentType: 'image/png', body: standIn(u.pathname) }); }
    cnt.miss++; return route.fulfill({ status: 404, body: '' });
  });
  const page = await context.newPage(); const errs = [], logs = [];
  await page.addInitScript(() => { try { Element.prototype.requestPointerLock = function () {}; HTMLElement.prototype.requestPointerLock = function () {}; } catch (e) {} });   // headless: a lock request never lands, and the eaten-ESC rule read the failure as a pause
  page.on('pageerror', e => errs.push(String(e && e.message || e).slice(0, 300)));
  page.on('console', m => { const t = m.text(); if (/\[HQ\]|portal|gun|held/i.test(t)) logs.push(t.slice(0, 200)); });
  await page.goto('http://localhost:3000/?hq&nomenu3d', { waitUntil: 'commit', timeout: 60000 });
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 90000) { try { const st = await page.evaluate(() => [document.readyState, typeof window._hqEnter, typeof ThreeRenderer !== 'undefined' && !!ThreeRenderer.hq]); if (st[1] === 'function' && st[2]) { ok = true; break; } } catch (e) {} await sleep(800); }
  if (!ok) { console.log('page never ready', errs.slice(0, 5)); await browser.close(); process.exit(1); }
  await page.evaluate(() => { window.EW_HQ_NO_POST = true; window.EW_DISABLE_CAST = true; window.EW_HQ_VARIANT = 'none'; window.EW_HQ_PORTAL = true; window.EW_HQ_AVATAR = { race: 'homosapien', gender: 'male', appearance: (typeof normalizeCharacterAppearance === 'function') ? normalizeCharacterAppearance({ outfit: 'suit', bottoms: 'trousers', feet: 'boots' }) : null }; });
  await page.evaluate((room) => { window._hqEnter({ from: 'play', room }); }, room);
  await sleep(12000);
  await page.evaluate(() => { const h = document.getElementById('hqLoad'); if (h) h.style.display = 'none'; const hp = document.getElementById('hqPrompt'); if (hp) hp.style.display = 'none'; const s = document.getElementById('hqStrip'); if (s) s.style.display = 'none'; });
  for (const st of steps) {
    if (st.teleport) { await page.evaluate((v) => ThreeRenderer.hq.dev.teleport(v), st.teleport); }
    if (st.eval) { const r = await page.evaluate(st.eval); console.log('EVAL', st.eval.slice(0, 60), '=>', JSON.stringify(r)); }
    if (st.keydown) await page.evaluate((k) => { try { ThreeRenderer.hq.setPaused(false); } catch (e) {} ThreeRenderer.hq.dev.press(k, true); }, st.keydown);
    if (st.keyup) await page.evaluate((k) => { ThreeRenderer.hq.dev.press(k, false); }, st.keyup);
    if (st.sample) { const rows = []; for (let i = 0; i < (st.n || 10); i++) { const r = await page.evaluate((k) => { if (k) ThreeRenderer.hq.dev.press(k, true); const w = ThreeRenderer.hq.dev.walk(); return w ? [Math.round(w.x * 100) / 100, Math.round(w.z * 100) / 100, Math.round(w.y * 100) / 100, Math.round(w.mvx * 10) / 10, Math.round(w.mvz * 10) / 10, w.air ? 1 : 0, Math.round(w.camYaw * 100) / 100] : null; }, st.hold || null); rows.push(r); await sleep(st.sample); } console.log('SAMPLES', JSON.stringify(rows)); }
    if (st.wait) await sleep(st.wait);
    if (st.shot) { await page.evaluate(() => { try { if (window._hqClosePause) window._hqClosePause(); } catch (e) {} const hp = document.getElementById("hqPrompt"); if (hp) hp.style.display = "none"; const s = document.getElementById("hqStrip"); if (s) s.style.display = "none"; const hh = document.getElementById("hqHints"); if (hh) hh.style.display = "none"; }); await sleep(1200); const f = path.join(OUT, tag + '_' + st.shot + '.png'); await page.screenshot({ path: f }); console.log('SHOT', f); }
  }
  console.log('COUNTERS', JSON.stringify(cnt)); console.log('MISSED GLB', JSON.stringify(missed.slice(0, 8))); console.log('ERRORS', JSON.stringify(errs.slice(0, 6))); console.log('LOGS', JSON.stringify(logs.slice(0, 20)));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
