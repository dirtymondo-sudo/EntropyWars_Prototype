// playtest_builder.js — party-builder (THE FORGE TERMINAL) screenshot probe (repo tooling, 2026-09-09).
// Boots the title with the LOCAL R2 files, enters VS CPU → match-select → FILE → the pre-match
// builder, then photographs it: ROSTER (the wall), a wall-tile hover, TECHNIQUES (the circuit +
// the technique panel), a technique preview, the party row → shots/builder/<tag>_<moment>.png.
// Prints page errors. GLBs cannot load in this sandbox (the CDN is blocked) — the hero stays the
// sprite and the VFX preview reports NO PREVIEW; the DOM / CSS is what this verifies.
//   npm start   (server on :3000)
//   NODE_USE_ENV_PROXY=1 node playtest_builder.js [tag]
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
const tag = process.argv[2] || 'forge';
const OUT = path.join(REPO, 'shots/builder'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(exe) ? exe : undefined,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*', '--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: +(process.env.PW_W || 1600), height: +(process.env.PW_H || 900) } });
  const cache = await installNodeFetchCache(context);
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { const t = m.text(); if (/error/i.test(t) && !/net::|Failed to load resource/.test(t)) console.log('  console:', t.slice(0, 200)); });
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
  // the STANDALONE forge: main menu → PARTY BUILDER → the locker → NEW TEAM (the same component as pre-match)
  await page.evaluate(() => window._goToTeamBuilder());
  await sleep(1500);
  await page.evaluate(() => { const card = [...document.querySelectorAll('.pb-locker-grid > *')].find(c => /NEW TEAM/.test(c.textContent || '')); if (card) card.click(); });
  await sleep(2500);
  const shot = async (name) => { const f = path.join(OUT, `${tag}_${name}.png`); await page.screenshot({ path: f }); console.log('  shot', f); };
  const diag = await page.evaluate(() => { const bo = document.getElementById('builderOverlay'); const pg = [...document.querySelectorAll('.title-page')].filter(p => p.classList.contains('active')).map(p => p.id); const so = document.getElementById('startOverlay'); return { phase: window.GAME && window.GAME.state.phase, gs: window.GAME && window.GAME.state.gameState, pages: pg, startOverlay: so ? getComputedStyle(so).display + '/' + so.className : null, builder: bo ? getComputedStyle(bo).display + ' ' + bo.getBoundingClientRect().width + 'x' + bo.getBoundingClientRect().height : null, panel: (() => { const bp = document.getElementById('battlePanel'); return bp ? getComputedStyle(bp).display : null; })(), loading: (() => { const l = document.querySelector('.loading-screen, #loadingScreen'); return l ? getComputedStyle(l).display : null; })() }; });
  console.log('diag:', JSON.stringify(diag));
  const hasForge = await page.evaluate(() => !!document.querySelector('.ms-crt-forge'));
  console.log('forge mounted:', hasForge, '| tab:', await page.evaluate(() => document.querySelector('.pb-body') && document.querySelector('.pb-body').getAttribute('data-tab')));
  // the party row geometry — the user's oval report
  const rings = await page.evaluate(() => [...document.querySelectorAll('#teamBuilderPage .pb-party-ring')].map(r => { const b = r.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height) }; }));
  console.log('party rings (w×h):', JSON.stringify(rings));
  await shot('roster');
  // hover the third wall tile → the stage follows after 220 ms
  const tile = await page.$('#teamBuilderPage .pb-rtile:nth-child(3)');
  if (tile) { await tile.hover(); await sleep(700); console.log('stage title after hover:', await page.evaluate(() => (document.querySelector('#teamBuilderPage .pb-stage-title') || {}).textContent)); await shot('roster_hover'); }
  await page.evaluate(() => { const b = [...document.querySelectorAll('#teamBuilderPage .pb-pill-btn')].find(x => /⇅/.test(x.textContent)); if (b) b.click(); }); await sleep(300);
  await shot('roster_sortmenu');
  await page.keyboard.press('Escape'); await sleep(200);
  await page.evaluate(() => { const d = document.querySelector('#teamBuilderPage .pb-type-disc:not(.none)'); if (d) d.click(); }); await sleep(300);
  console.log('tiles after a type filter:', await page.evaluate(() => document.querySelectorAll('#teamBuilderPage .pb-rtile').length));
  await shot('roster_typefilter');
  await page.evaluate(() => { const d = document.querySelector('#teamBuilderPage .pb-type-disc.on'); if (d) d.click(); });
  await page.evaluate(() => window._pbSetTab && window._pbSetTab('tech')); await sleep(600);
  await shot('tech');
  // (2026-09-09 relayout) the circuit is three LANES of .pb-tn rows: hover a FAR node (the gold path), then click a reachable one
  const far = await page.$('#teamBuilderPage .pb-tn.is-far');
  if (far) { await far.hover(); await sleep(400); await shot('tech_path'); }
  await page.evaluate(() => { const n = document.querySelector('#teamBuilderPage .pb-tn.is-reachable') || document.querySelector('#teamBuilderPage .pb-tn.is-equipped'); if (n) n.click(); }); await sleep(600);
  console.log('stage pill:', await page.evaluate(() => (document.querySelector('#teamBuilderPage .pb-stage-pill') || {}).textContent || null));
  await shot('tech_preview');
  await page.evaluate(() => window._pbSetTab && window._pbSetTab('gear')); await sleep(500);
  await shot('gear');
  const lanes = await page.evaluate(() => { const q = s => document.querySelector('#teamBuilderPage ' + s); const r = e => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; }; return { body: r(q('.pb-body')), tech: r(q('.pb-zone-tech')), stage: r(q('.pb-stage')), stats: r(q('.pb-zone-stats')), lanes: r(q('.pb-lanes')), technique: r(q('.pb-technique')), scroll: (q('.pb-circuit-scroll') || {}).scrollHeight + '/' + (q('.pb-circuit-scroll') || {}).clientHeight, notes: r(q('.pb-notes')), party: r(q('.pb-party')) }; });
  console.log('geometry:', JSON.stringify(lanes));
  console.log('page errors:', errs.length ? errs : 'none');
  console.log('net:', JSON.stringify(cache.stats()));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
