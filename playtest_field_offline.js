// playtest_field_offline.js — THE FIELD PROBE (Phase 9 Delivery 8, 2026-09-16): the cave encounter end to end, offline.
// The offline HQ harness (playtest_hq_offline.js: repo scripts from disk, three r128 / React / socket.io from node_modules —
// npm i --no-save playwright three@0.128.0 react@18 react-dom@18 three.meshline — stand-in textures, every GLB a 404; needs
// the server, npm start) walks into a cave chamber, stands 1.3 m west of its race-hinted native, resumes the walk (the
// harness enters PAUSED), strikes (hq.strike()) and reads the battle that starts: activeGameMode (a `field:` id), the
// board, the seats-as-zones, every unit's cell, the heights, the run marker, the camera seed; shots/field/*.png.
//   node playtest_field_offline.js [roomId]        (default: the gallery, site_prebuilt_hollow_earth_gallery)
// The one page error the harness always prints ("THREE.Scene is not a constructor" at index.html's inline loading-screen
// script) is the sandbox's: the mirrored three.min.js lands after that script runs. See PLAYTEST_NOTES "THE FIELD PROBE".
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const OUT = path.join(REPO, 'shots/field'); fs.mkdirSync(OUT, { recursive: true });
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
/* THE FIELD PROBE (scratch): enter the cave's gallery offline, stand beside the gnome, strike, and read the battle that starts */
const room = process.argv[2] || 'site_prebuilt_hollow_earth_gallery';
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
  page.on('pageerror', e => errs.push(String(e && e.stack || e).slice(0, 700)));
  page.on('console', m => { const t = m.text(); if (/\[HQ\]|SpawnZones|encounter|field|Error|error/i.test(t)) logs.push(t.slice(0, 260)); });
  await page.goto('http://localhost:3000/?hq&nomenu3d', { waitUntil: 'commit', timeout: 60000 });
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 90000) { try { const st = await page.evaluate(() => [document.readyState, typeof window._hqEnter, typeof ThreeRenderer !== 'undefined' && !!ThreeRenderer.hq]); if (st[1] === 'function' && st[2]) { ok = true; break; } } catch (e) {} await sleep(800); }
  if (!ok) { console.log('page never ready', errs.slice(0, 5)); await browser.close(); process.exit(1); }
  await page.evaluate(() => { window.EW_HQ_NO_POST = true; window.EW_HQ_DEBUG = true; window.EW_DISABLE_CAST = true; window.EW_HQ_VARIANT = 'none'; window.EW_DISABLE_3D_UNITS = false; });
  await page.evaluate((room) => { window._hqEnter({ from: 'play', room }); }, room);
  await sleep(8000);
  const pre = await page.evaluate(() => {
    const H = ThreeRenderer.hq; const room = DOOR_HQ.rooms[window._hqCurRoom || 'site_prebuilt_hollow_earth_gallery'];
    const sp = room.npcSpots.find(s => s.race === 'gnome') || room.npcSpots[0];
    const info = hqCaveInfo(room.id || 'site_prebuilt_hollow_earth_gallery');
    const y = hqCaveTopAt(info, sp.x, sp.z);
    H.dev.teleport({ x: sp.x - 1.3, z: sp.z, y: y, face: 90, pitch: -0.25, fp: false, dist: 3.5 });
    return { spot: sp, y };
  });
  console.log('PRE', JSON.stringify(pre));
  await sleep(1500);
  const aim = await page.evaluate(() => { const H = ThreeRenderer.hq; return { aim: H.encounterAim(), walk: H.dev.walk ? H.dev.walk() : null, chars: (H.dev && H.dev.state) ? undefined : undefined }; });
  console.log('AIM', JSON.stringify(aim));
  await page.screenshot({ path: path.join(OUT, 'field_before.png') });
  const un = await page.evaluate(() => { try { window._hqResume(); } catch (e) {} ThreeRenderer.hq.setPaused(false); const h = document.getElementById('hqLoad'); if (h) h.style.display = 'none'; return ThreeRenderer.hq.dev.walk().paused; });
  console.log('PAUSED AFTER RESUME', un);
  const struck = await page.evaluate(() => ThreeRenderer.hq.strike());
  console.log('STRIKE', struck);
  let res = null; const t1 = Date.now();
  while (Date.now() - t1 < 40000) {
    res = await page.evaluate(() => {
      try {
        return { gs: state.gameState, mode: (typeof activeGameMode !== 'undefined') ? activeGameMode : null, w: CONFIG.boardWidth, h: CONFIG.boardHeight,
                 zones: state.spawnZones ? JSON.parse(JSON.stringify(state.spawnZones)) : null,
                 units: (state.units || []).map(u => [u.player, u.x, u.y, u.z, u.race, u.name]),
                 run: window._hqEncounterRun ? { fieldId: window._hqEncounterRun.fieldId, cells: window._hqEncounterRun.field && window._hqEncounterRun.field.cells } : null,
                 heights: state.boardHeights ? state.boardHeights.map(r => r.join('')) : null, hq: !!window._hqHome, round: state.round };
      } catch (e) { return { err: String(e) }; }
    });
    if (res && res.mode && String(res.mode).indexOf('field:') === 0 && res.units && res.units.length && res.round >= 1) break;
    await sleep(1000);
  }
  await sleep(2500);
  console.log('RESULT', JSON.stringify(res));
  await page.screenshot({ path: path.join(OUT, 'field_battle.png') });
  const cam = await page.evaluate(() => { try { return ThreeCamera.seedState ? ThreeCamera.seedState() : null; } catch (e) { return String(e); } });
  console.log('CAM', JSON.stringify(cam));
  console.log('COUNTERS', JSON.stringify(cnt)); console.log('ERRORS', JSON.stringify(errs.slice(0, 8))); console.log('LOGS', JSON.stringify(logs.slice(0, 40)));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
