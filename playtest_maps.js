// playtest_maps.js — Δ board screenshot probe (repo tooling, 2026-09-06).
// Starts a VS-CPU Team Deathmatch on each requested Δ map with the LOCAL copies of
// data.js / sprites.js / three-renderer.js / map.js / state.js (so scenery edits are
// testable before the R2 upload), freezes the match, and photographs the board from
// four camera poses → shots/maps/<mapId>_<pose>.png.
//   npm start                                   (server on :3000)
//   NODE_USE_ENV_PROXY=1 node playtest_maps.js prebuilt_cyberpunk prebuilt_camelot
//   NODE_USE_ENV_PROXY=1 node playtest_maps.js --all        (every Δ + the facility boards)
//   POSES=wide,low node playtest_maps.js ...                (subset of default,wide,low,top)
// Sandbox note (same as playtest_hq.js): Chromium cannot reach the CDN through the
// agent proxy, so the browser runs with no proxy and every CDN asset is fetched
// Node-side into .asset-cache/ and fulfilled from there.
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const crypto = require('crypto');
const LOCAL = new Set((process.env.LOCAL_ASSETS || 'sprites.js,data.js,three-renderer.js,map.js,state.js').split(',').map(s => s.trim()).filter(Boolean));
const HOSTS = new Set(['cdn.entropywars.net', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'cdn.socket.io']);
const CACHE = path.join(REPO, '.asset-cache'); fs.mkdirSync(CACHE, { recursive: true });
const CT = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.obj': 'text/plain', '.mtl': 'text/plain', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
async function installNodeFetchCache(context) {
  let hits = 0, misses = 0, fails = 0;
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    if (!HOSTS.has(u.host)) return route.abort();
    const base = path.basename(u.pathname);
    // no-store: a page.reload() between maps must re-read the repo copy, not Chromium's memory cache
    if (LOCAL.has(base) && fs.existsSync(path.join(REPO, base))) return route.fulfill({ status: 200, contentType: 'application/javascript', headers: { 'Cache-Control': 'no-store' }, body: fs.readFileSync(path.join(REPO, base)) });
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
const args = process.argv.slice(2);
const ALL = args.includes('--all');
const wanted = args.filter(a => !a.startsWith('--'));
const POSES = (process.env.POSES || 'default,wide,low,top').split(',');
const OUT = path.join(REPO, 'shots/maps'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
// camera poses: tile-space focal (x,y), zoom (<1 = further away), tilt (higher = lower eye), yaw
const CAM = {
  default: null,
  wide: { x: 3.5, y: 3.5, zoom: 0.42, tilt: 40, yaw: 45 },
  low:  { x: 3.5, y: 3.5, zoom: 0.55, tilt: 62, yaw: 25 },
  top:  { x: 3.5, y: 3.5, zoom: 0.5,  tilt: 12, yaw: 45 },
};
(async () => {
  const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(exe) ? exe : undefined,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const cache = await installNodeFetchCache(context);
  const page = await context.newPage();
  const errs = [], failed = [];
  page.on('requestfailed', r => failed.push(r.url().slice(0, 120) + ' ' + (r.failure() && r.failure().errorText)));
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { const t = m.text(); if (/\[scenery\]|near builder|MapForge|DeltaForge/i.test(t)) console.log('  console:', t.slice(0, 200)); });
  await page.goto('http://localhost:3000/?nohq', { waitUntil: 'commit', timeout: 70000 });
  { const t0 = Date.now(); let ok = false, last = null;
    while (Date.now() - t0 < 180000) { try { last = await page.evaluate(() => [document.readyState, typeof window._goToVsCpu, !!window.GAME, typeof EW_MAP_META]); if (last[0] === 'complete' && last[1] === 'function' && last[2]) { ok = true; break; } } catch (e) { last = ['nav']; } await sleep(1000); }
    console.log('page state', JSON.stringify(last), 'after', ((Date.now() - t0) / 1000).toFixed(0), 's');
    if (!ok) { console.log('failed requests:', JSON.stringify(failed.slice(0, 6))); console.log('errors:', JSON.stringify(errs.slice(0, 6))); await browser.close(); process.exit(1); } }
  const meta = await page.evaluate(() => (typeof EW_MAP_META !== 'undefined' ? EW_MAP_META : window.EW_MAP_META).filter(m => m.isDelta).map(m => ({ id: m.id, label: m.label, scenery: m.env && m.env.scenery, near: m.env && m.env.near })));
  let list = ALL ? meta : meta.filter(m => wanted.some(w => m.id === w || m.id === w + '_delta' || m.label.toLowerCase().includes(w.toLowerCase())));
  if (!list.length) { console.log('no maps matched; Δ ids:', meta.map(m => m.id).join(' ')); await browser.close(); process.exit(1); }
  console.log('maps:', list.map(m => m.id).join(' '));
  for (const m of list) {
    const t0 = Date.now();
    try {
      await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; });
      // back to the menu between maps: reload is the only reliable reset in the sandbox
      if (m !== list[0]) { await page.reload({ waitUntil: 'commit', timeout: 70000 }); for (let i = 0; i < 90; i++) { if (await page.evaluate(() => !!(window.GAME && window._goToVsCpu)).catch(() => false)) break; await sleep(1000); } await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; }); }
      await page.evaluate(() => window._goToVsCpu());
      await sleep(1500);
      const picked = await page.evaluate((label) => {
        const cards = [...document.querySelectorAll('.ms-map-card')];
        const c = cards.find(b => (b.textContent || '').includes(label));
        if (c) { c.click(); return (c.textContent || '').slice(0, 60); }
        return null;
      }, m.label);
      if (!picked) { console.log('  ! map card not found for', m.label); continue; }
      await sleep(500);
      await page.evaluate(() => { const el = [...document.querySelectorAll('.ms-mode-card')].find(b => /death\s*match/i.test(b.textContent || '')); if (el) el.click(); });
      await sleep(600);
      await page.evaluate(() => { const b = document.querySelector('.ms-btn-primary'); if (b) b.click(); });
      await sleep(2000);
      for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary'); if (b) b.click(); }); await sleep(1400); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
      await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
      let inBattle = false;
      for (let i = 0; i < 40; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') { inBattle = true; break; } await sleep(1000); }
      if (!inBattle) { console.log('  ! never reached battle for', m.id); continue; }
      // freeze: nobody moves, no AI turns, so every pose shows the same board
      await page.evaluate(() => { const st = window.GAME.state; st.controllers = { 1: 'local', 2: 'local' }; });
      // click through the loading gate (.ls-active) and the VS splash (.vs-active / tap to skip)
      let clear = 0;
      for (let i = 0; i < 60 && clear < 2; i++) {
        const left = await page.evaluate(() => {
          let n = 0;
          document.querySelectorAll('.ls-active, .ls-ready').forEach(el => { n++; el.click(); });
          const hint = document.querySelector('.vs-skip-hint');
          if (hint) { n++; (hint.closest('[class*="vs"]') || hint).click(); hint.click(); const ov = hint.parentNode; if (ov) ov.click(); }
          document.querySelectorAll('.vs-active').forEach(el => { n++; el.click(); });
          return n;
        });
        if (left === 0) clear++; else clear = 0;
        await sleep(700);
      }
      const info = await page.evaluate(() => { const st = window.GAME.state; return { mode: st.modeId || st.mapId, env: st.mapEnv && { scenery: st.mapEnv.scenery, near: st.mapEnv.near }, w: st.boardW || (st.board && st.board[0] && st.board[0].length), three: (typeof ThreeRenderer !== 'undefined') && ThreeRenderer.isActive() }; });
      console.log('  battle', JSON.stringify(info));
      await sleep(7000);   // let the GLB props + horizon models arrive
      for (const pose of POSES) {
        const c = CAM[pose]; if (c === undefined) continue;
        if (c) await page.evaluate((c) => { camera.snap({ _force: true, x: c.x, y: c.y, zoom: c.zoom, tilt: c.tilt, yaw: c.yaw }); camera._smoothX = c.x; camera._smoothY = c.y; camera._smoothZoom = c.zoom; camera._smoothTilt = c.tilt; camera._smoothYaw = c.yaw; }, c);
        await sleep(c ? 1800 : 300);
        const f = path.join(OUT, `${m.id.replace(/_delta$/, '')}_${pose}.png`);
        try { await page.screenshot({ path: f, timeout: +(process.env.SHOT_TIMEOUT || 25000), animations: 'disabled' }); console.log('  shot', path.basename(f)); }
        catch (e) { console.log('  ! screenshot failed', pose, String(e.message).split('\n')[0]); }
      }
      if (process.env.PROBE) {
        const probe = await page.evaluate(() => {
          const out = { roots: 0, byType: {}, neon: [], errs: [] };
          const scene = (typeof ThreeRenderer !== 'undefined' && ThreeRenderer.hq && ThreeRenderer.hq.dev && ThreeRenderer.hq.dev.scene) ? ThreeRenderer.hq.dev.scene() : null;
          let hz = null; if (scene) scene.traverse(o => { if (o.name === 'facilityNear') hz = o; });
          if (!hz) { out.errs.push('no facilityNear group'); return out; }
          out.roots = hz.children.length;
          hz.traverse(o => {
            if (!o.material) return;
            const m = Array.isArray(o.material) ? o.material[0] : o.material;
            const k = m.type + (m.map ? '+map' : '') + (m.blending === 2 ? '+add' : '');
            out.byType[k] = (out.byType[k] || 0) + 1;
            if (o.name && o.name.startsWith('moat:')) { const wp = new THREE.Vector3(); o.getWorldPosition(wp); out.neon.push({ n: o.name, type: m.type, y: +(wp.y / 128).toFixed(2), em: m.emissive ? '#' + m.emissive.getHexString() : null, emI: m.emissiveIntensity, img: !!(m.map && m.map.image), vis: o.visible, w: o.geometry.parameters.width / 128, fluid: !!m._ew_fluidTop, fog: m.fog }); }
            if (o.name && o.name.startsWith('neon:')) { const wp = new THREE.Vector3(); o.getWorldPosition(wp); out.neon.push({ n: o.name, x: +(wp.x / 128).toFixed(2), y: +(wp.y / 128).toFixed(2), z: +(wp.z / 128).toFixed(2), ry: +o.rotation.y.toFixed(2), rz: +o.rotation.z.toFixed(2), op: +m.opacity.toFixed(2), vis: o.visible, img: !!(m.map && m.map.image), iw: m.map && m.map.image ? m.map.image.width : 0, blend: m.blending, tr: m.transparent }); }
          });
          return out;
        }).catch(e => ({ errs: [String(e)] }));
        console.log('  PROBE', JSON.stringify(probe).slice(0, 3000));
      }
    } catch (e) { console.log('  ! error on', m.id, String(e && e.message || e).split('\n')[0]); }
    console.log('  done', m.id, ((Date.now() - t0) / 1000).toFixed(0) + 's', 'errors so far', errs.length);
  }
  console.log('CACHE', JSON.stringify(cache.stats()));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 10)));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
