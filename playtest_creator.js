// playtest_creator.js — CHARACTER CREATOR screenshot probe (repo tooling, 2026-09-11).
// Boots the title with the LOCAL R2 files, opens the standalone forge → GEAR → CHARACTER CREATOR,
// creates a look and photographs it: full body, face close-up, facial hair + eye colour, a few
// hair styles, two fabrics, the female base, the walk → shots/creator/<tag>_<moment>.png.
// The charactercreation/ assets (rigged bases, hair GLBs, fabric tiles) are served FROM DISK by
// intercepting cdn.entropywars.net/Assets/Models/charactercreation/* — so this verifies the real
// runtime path (GLB parse, weight skinning, hair fit, fabric + face bake) without the CDN.
//   npm start   (server on :3000)
//   NODE_USE_ENV_PROXY=1 node playtest_creator.js [tag]        PW_W / PW_H size the viewport
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const crypto = require('crypto');
const HOSTS = new Set(['cdn.entropywars.net', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'cdn.socket.io', 'fonts.googleapis.com', 'fonts.gstatic.com']);
const CACHE = path.join(REPO, '.asset-cache'); fs.mkdirSync(CACHE, { recursive: true });
const CT = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.obj': 'text/plain', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const PNG1 = (() => {
  const zlib = require('zlib');
  const w = 8, h = 8, raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 150; raw[o + 1] = 150; raw[o + 2] = 150; } }
  const crc = (buf) => { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
})();
async function installRoutes(context) {
  let hits = 0, misses = 0, fails = 0, local = 0, stubs = 0, creator = 0;
  const NM = path.join(REPO, 'node_modules');
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    if (u.host === 'fonts.googleapis.com' || u.host === 'fonts.gstatic.com') return route.continue();
    const base = path.basename(u.pathname), ext = path.extname(base).toLowerCase();
    const ct = CT[ext] || 'application/octet-stream';
    const serve = (file) => { local++; return route.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(file) }); };
    // THE CREATOR ASSETS from disk — the exact files the user uploads to R2
    if (u.host === 'cdn.entropywars.net' && u.pathname.startsWith('/Assets/Models/charactercreation/')) {
      const f = path.join(REPO, 'charactercreation', u.pathname.replace('/Assets/Models/charactercreation/', ''));
      if (fs.existsSync(f)) { creator++; return serve(f); }
      console.log('  MISSING creator asset', u.pathname); return route.fulfill({ status: 404, body: '' });
    }
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
  return { stats: () => ({ hits, misses, fails, local, stubs, creator }) };
}
const tag = process.argv[2] || 'creator';
const OUT = path.join(REPO, 'shots/creator'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(exe) ? exe : undefined,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*', '--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: +(process.env.PW_W || 1600), height: +(process.env.PW_H || 900) } });
  const routes = await installRoutes(context);
  const page = await context.newPage();
  const errs = [], warns = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { const t = m.text(); if (/ThreeRenderer|creator|Creator/.test(t)) warns.push(t.slice(0, 220)); else if (/error/i.test(t) && !/net::|Failed to load resource/.test(t)) console.log('  console:', t.slice(0, 200)); });
  await page.addInitScript(() => { window.EW_DISABLE_DOOR_IDENT = true; window.EW_DISABLE_INTRO_CINE = true; try { localStorage.setItem('ew_hq', 'off'); localStorage.setItem('ew_menu3d', 'off'); } catch (e) {} });
  await page.goto('http://localhost:3000/?nohq&nomenu3d', { waitUntil: 'commit', timeout: 70000 });
  { const t0 = Date.now(); let ok = false;
    while (Date.now() - t0 < 180000) {
      let last = null;
      try { last = await page.evaluate(() => [document.readyState, typeof window._goToVsCpu, !!window.GAME]); } catch (e) { last = ['nav']; }
      if (last[0] === 'complete' && last[1] === 'function' && last[2]) { ok = true; break; }
      await sleep(1000);
    }
    if (!ok) { console.log('boot timed out'); await browser.close(); process.exit(1); } }
  await sleep(800);
  await page.evaluate(() => { try { window.enterGameFromTitle && window.enterGameFromTitle(); } catch (e) {} });
  await sleep(800);
  await page.evaluate(() => window._goToTeamBuilder());
  await sleep(1500);
  await page.evaluate(() => { const card = [...document.querySelectorAll('.pb-locker-grid > *')].find(c => /NEW TEAM/.test(c.textContent || '')); if (card) card.click(); });
  await sleep(2500);
  const shot = async (name) => { const f = path.join(OUT, `${tag}_${name}.png`); await page.screenshot({ path: f }); console.log('  shot', f); };
  const click = async (text, sel) => page.evaluate(([text, sel]) => { const el = [...document.querySelectorAll('#teamBuilderPage ' + (sel || 'button'))].find(b => (b.textContent || '').trim().toUpperCase() === text.toUpperCase() || (b.title || '').toUpperCase() === text.toUpperCase()); if (el) { el.click(); return true; } return false; }, [text, sel]);
  const waitReady = async (ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const st = await page.evaluate(() => { const h = document.querySelector('#teamBuilderPage .pb-hero3d'); return h ? h.className : 'none'; }); if (/ew-cv-ready/.test(st)) return st; await sleep(500); } return 'timeout'; };
  const rigInfo = () => page.evaluate(() => { const v = window.EWCharViewer; const s = v && v.debugScene ? v.debugScene() : null; return s; });
  // pick the first slot's race → homosapien (the creator only dresses humans)
  await page.evaluate(() => { const st = window.GAME.state; const m = st.partyMeta && st.partyMeta[1] && st.partyMeta[1][0]; if (m) { m.race = 'homosapien'; m.gender = 'male'; } });
  await page.evaluate(() => { const t = [...document.querySelectorAll('#teamBuilderPage .pb-rtile')].find(x => /homosapien|freelancer|human/i.test(x.textContent || '') || /homosapien/.test(x.getAttribute('data-race') || '')); if (t) t.click(); });
  await sleep(1200);
  await page.evaluate(() => window._pbSetTab && window._pbSetTab('gear')); await sleep(600);
  console.log('creator button:', await click('CHARACTER CREATOR')); await sleep(600);
  console.log('create:', await click('CREATE APPEARANCE')); await sleep(1500);
  console.log('stage:', await waitReady(60000));
  await sleep(4000);
  console.log('panel present:', await page.evaluate(() => !!document.querySelector('#teamBuilderPage .pb-creator-controls')), '| hair tiles:', await page.evaluate(() => document.querySelectorAll('#teamBuilderPage .pb-hair-tile').length), '| fabric tiles:', await page.evaluate(() => document.querySelectorAll('#teamBuilderPage .pb-fabric-tile').length));
  await shot('01_default_body');
  console.log('face:', await click('FACE CLOSE-UP')); await sleep(2500);
  await shot('02_default_face');
  console.log('beard:', await click('Beard'), 'eye swatch:', await page.evaluate(() => { const s = document.querySelector('#teamBuilderPage .pb-creator-swatch[aria-label^="Eyes #3d5a3a"]'); if (s) { s.click(); return true; } return false; }));
  await sleep(3000);
  await shot('03_face_beard_eyes');
  // blonde for the hair styles (the beard follows the hair colour)
  await page.evaluate(() => { const s = document.querySelector('#teamBuilderPage .pb-creator-swatch[aria-label^="Hair colour #c98a4a"]'); if (s) s.click(); });
  for (const [style, n] of [['Long straight', '04'], ['Ponytail', '05'], ['Mohawk', '06']]) {
    console.log(style + ':', await click(style, '.pb-hair-tile')); await sleep(6000);
    await shot(n + '_hair_' + style.replace(/\s+/g, '_').toLowerCase());
  }
  console.log('full body:', await click('FULL BODY')); await sleep(1500);
  console.log('denim:', await click('Denim', '.pb-fabric-tile'), 'chainmail bottoms:', await page.evaluate(() => { const t = [...document.querySelectorAll('#teamBuilderPage .pb-cc-fabrics')][1]; const b = t && [...t.querySelectorAll('.pb-fabric-tile')].find(x => x.title === 'Chainmail'); if (b) { b.click(); return true; } return false; }));
  console.log('long sleeve:', await click('Long sleeve'), 'shorts:', await click('Shorts'));
  await sleep(5000);
  await shot('07_fabrics_body');
  console.log('thumbs loaded:', await page.evaluate(() => document.querySelectorAll('#teamBuilderPage .pb-fabric-tile.has-thumb').length));
  console.log('female:', await click('FEMALE')); await sleep(1500);
  console.log('stage:', await waitReady(60000), '| gender now:', await page.evaluate(() => window.GAME.state.partyMeta[1][0].gender), '| FEMALE pressed:', await page.evaluate(() => { const b = [...document.querySelectorAll('#teamBuilderPage button')].find(x => x.textContent.trim() === 'FEMALE'); return b && b.getAttribute('aria-pressed'); }));
  await click('Clean'); await sleep(6000);
  await shot('08_female_body');
  console.log('face:', await click('FACE CLOSE-UP')); await sleep(2500);
  await shot('09_female_face');
  console.log('randomize:', await click('⚄ RANDOMIZE')); await sleep(6000);
  await click('FULL BODY'); await sleep(1500);
  await shot('10_random');
  console.log('walk:', await click('PREVIEW WALK')); await sleep(1200);
  await shot('11_walk');
  console.log('page errors:', errs.length ? errs : 'none');
  console.log('renderer notes:', warns.length ? warns.slice(0, 12) : 'none');
  console.log('net:', JSON.stringify(routes.stats()));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
