// playtest_handover.js — THE HAND-OVER PROBE (2026-11-16): walks a room, starts a fight in it (a strike), wins it, presses
// BACK TO THE ROOM and comes back, with a picture and counts at each step. Built on playtest_city.js (same routing, probe-fast.js).
//   npm start   (server on :3000)
//   node playtest_handover.js [room] [--flags=EW_HQ_NO_PARK] [--merge=<ms>] [--fight=<ms>]
//   -> shots/fight/1_walk_before.png ... 7_back_teleported.png ; prints WALK / FIGHT / BACK after N s / DIAG / CAM / HQLOGS / ERRORS.
// The fight is ended from the probe (the enemy's hp set to 0, checkWin()); the strike lands 3.5 m in front of the spawn.
// Notes: docs/notes/rendering-loading-perf.md "THE PARKED ROOM".
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
const flag = (k, d) => { const f = flags.find(x => x === '--' + k || x.startsWith('--' + k + '=')); if (!f) return d; const v = f.split('=')[1]; return v === undefined ? true : v; };
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
  await page.goto('http://localhost:3000/?hq&nomenu3d', { waitUntil: 'commit', timeout: 60000 });
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
  const OUT = process.env.EW_SHOTS || path.join(REPO, 'shots/fight'); fs.mkdirSync(OUT, { recursive: true });
  const shot = async (n) => { try { await page.screenshot({ path: path.join(OUT, n + '.png') }); lap('shot ' + n); } catch (e) { console.log('shot failed', n, String(e.message).slice(0, 120)); } };
  const ev = async (js) => { try { return await page.evaluate(js); } catch (e) { return 'ERR ' + String(e.message).slice(0, 200); } };
  const stat = () => ev(`(function(){ var H = ThreeRenderer.hq.dev.scene && null; var t = ''; try { var b = ThreeRenderer.hq.dev.stack && ThreeRenderer.hq.dev.stack(); } catch (e) {}
    var g = null; try { g = ThreeRenderer.hq.gate(); } catch (e) {}
    var pl = null; try { var pg = ThreeRenderer.hq.dev.playerGroup(); pl = pg ? [Math.round(pg.position.x / 73), Math.round(pg.position.z / 73)] : null; } catch (e) {}
    return { gate: g ? { ready: g.ready, landed: g.landed, done: g.done, total: g.total } : null, player: pl, chars: (function(){ try { return ThreeRenderer.hq.dev.chars().length; } catch (e) { return -1; } })(), phase: (typeof GAME !== 'undefined' && GAME.state) ? GAME.state.phase : null, hqScene: !!(ThreeRenderer.hq.dev.hqScene && ThreeRenderer.hq.dev.hqScene()), frameErr: window._ewHqFrameErrors || 0 }; })()`);

  const diag = () => ev(`(function(){ var sc = ThreeRenderer.hq.dev.hqScene(); if (!sc) return null; var L = [], ck = [0, 0], vis = 0, tot = 0, held = 0; var r = ThreeRenderer.hq.dev.renderer();
    sc.traverse(function (o) { if (o.isLight) L.push(o.type.replace('Light','') + ':' + (+o.intensity).toFixed(2) + ':' + o.color.getHexString() + (o.visible ? '' : ':HIDDEN') + ':L' + o.layers.mask + (o.parent === sc ? '' : ':nested')); if (o._ew_ckFar != null) { ck[0]++; if (o.visible) ck[1]++; } if (o.isMesh) { tot++; if (o._ew_bRec) held++; } });
    var top = sc.children.map(function (c) { return (c.name || c.type) + (c.visible ? '' : '(hidden)') + ':' + c.children.length; }).join(' | ').slice(0, 500);
    return { lights: L.length, lightList: L.slice(0, 14), chunks: ck, meshes: tot, held: held, exposure: r.toneMappingExposure, toneMapping: r.toneMapping, fog: sc.fog ? [sc.fog.density, sc.fog.color.getHexString()] : null, bg: sc.background && sc.background.getHexString ? sc.background.getHexString() : String(sc.background), info: [r.info.render.calls, r.info.render.triangles], shadow: [r.shadowMap.enabled, r.shadowMap.autoUpdate], top: top, cam: (function(){ var c = ThreeRenderer.hq.dev.scene && null; return null; })(), hfog: (typeof _EW_HFOG !== 'undefined') ? [_EW_HFOG.x, _EW_HFOG.y, _EW_HFOG.z, _EW_HFOG.w] : 'n/a', cycle: document.body.dataset.cycle, clear: r.getClearAlpha ? r.getClearAlpha() : null }; })()`);

  const camd = () => ev(`(function(){ var sc = ThreeRenderer.hq.dev.hqScene(); var pg = ThreeRenderer.hq.dev.playerGroup(); var cam = null; sc.traverse(function (o) { if (o.isCamera) cam = o; });
    var st = ThreeRenderer.hq.dev.still ? null : null; var dbg = ThreeRenderer.hq.dev.camera ? ThreeRenderer.hq.dev.camera() : null;
    var ov = [].slice.call(document.querySelectorAll('body *')).filter(function (e) { var cs = getComputedStyle(e); return (cs.position === 'fixed' || cs.position === 'absolute') && e.offsetWidth > 900 && e.offsetHeight > 500 && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05; }).map(function (e) { var cs = getComputedStyle(e); return (e.id || e.className || e.tagName).toString().slice(0, 30) + ' z' + cs.zIndex + ' o' + cs.opacity + ' bg' + cs.backgroundColor; }).slice(0, 12);
    var cv = document.querySelector('canvas'); 
    return { player: pg ? [pg.position.x / 73, pg.position.y / 73, pg.position.z / 73, pg.visible, pg.children.length] : null, camInScene: !!cam, dbg: dbg, overlays: ov, canvases: [].slice.call(document.querySelectorAll('canvas')).map(function (c) { var cs = getComputedStyle(c); return (c.id || c.className) + ' ' + c.width + 'x' + c.height + ' ' + cs.display + ' o' + cs.opacity + ' p:' + (c.parentNode && (c.parentNode.id || c.parentNode.className)); }) }; })()`);
  await fast.settle(page, 0, 6);
  console.log('WALK', JSON.stringify(await stat()));
  await shot('1_walk_before');
  // let the merge run a while (WebGL: batch + chunks)
  await sleep(Number(flag('merge', 8000)));
  console.log('WALK2', JSON.stringify(await ev(`(function(){ var sc = ThreeRenderer.hq.dev.hqScene(), n = 0, b = 0, cells = 0, sk = 0; sc.traverse(function (o) { if (o.isMesh) n++; if (o.isSkinnedMesh) sk++; if (o._ew_hqBatch) b++; if (o._ew_sCell) cells++; }); return { meshes: n, batchMeshes: b, squares: cells, skinned: sk, chars: (function () { try { return ThreeRenderer.hq.dev.chars().length; } catch (e) { return -1; } })() }; })()`)));
  console.log('CAM-BEFORE', JSON.stringify(await camd()));
  console.log('DIAG-BEFORE', JSON.stringify(await diag()));
  await shot('2_walk_merged');
  // the strike
  console.log('STRIKE', JSON.stringify(await ev(`(function(){ var g = ThreeRenderer.hq.dev.playerGroup().position; var x = g.x / 73, z = g.z / 73 + 3.5, y = 0; window._hqEncounterFire({ target: { kind: 'npc', id: 'probe-1', race: 'dinosaur', x: x, z: z, y: y }, x: x, z: z, y: y, gesture: 'attack' }); return 1; })()`)));
  let t1 = Date.now();
  while (Date.now() - t1 < 180000) { const s2 = await stat(); if (s2 && s2.phase === 'battle') break; await sleep(1500); }
  lap('battle phase'); await sleep(Number(flag('fight', 12000)));
  console.log('FIGHT', JSON.stringify(await stat()));
  await shot('3_fight');
  // win
  console.log('WIN', JSON.stringify(await ev(`(function(){ var st = GAME.state; var u = st.units.filter(function (x) { return String(x.id).indexOf('2-') === 0; }); u.forEach(function (x) { x.hp = 0; x.alive = false; x.dead = true; }); try { checkWin(); } catch (e) { return 'ERR ' + e.message; } return u.length; })()`)));
  t1 = Date.now(); let btn = false;
  while (Date.now() - t1 < 120000) { btn = await ev(`!!(document.getElementById('encReturnBtn') && document.getElementById('encReturnBtn').offsetParent)`); if (btn === true) break; await sleep(1500); }
  lap('return button ' + btn);
  await shot('4_debrief');
  const tBack = Date.now();
  await ev(`document.getElementById('encReturnBtn').click(), 1`);
  t1 = Date.now(); let back = null;
  while (Date.now() - t1 < 240000) { back = await stat(); if (back && back.hqScene && back.gate && back.gate.ready && back.phase !== 'battle') break; await sleep(1000); }
  console.log('BACK after ' + ((Date.now() - tBack) / 1000).toFixed(1) + ' s', JSON.stringify(back));
  await fast.settle(page, 0, 6);
  await shot('5_back');
  await sleep(8000);
  console.log('BACK2', JSON.stringify(await stat()), JSON.stringify(await ev(`(function(){ var sc = ThreeRenderer.hq.dev.hqScene(), n = 0, b = 0, cells = 0, sk = 0; sc.traverse(function (o) { if (o.isMesh) n++; if (o.isSkinnedMesh) sk++; if (o._ew_hqBatch) b++; if (o._ew_sCell) cells++; }); return { meshes: n, batchMeshes: b, squares: cells, skinned: sk, chars: (function () { try { return ThreeRenderer.hq.dev.chars().length; } catch (e) { return -1; } })() }; })()`)));
  console.log('CAM-AFTER', JSON.stringify(await camd()));
  console.log('DIAG-AFTER', JSON.stringify(await diag()));
  await shot('6_back_later');
  await ev(`ThreeRenderer.hq.dev.teleport({ x: 113.75, z: 22.75, face: 270, fp: false, dist: 4, pitch: -0.2 }), 1`); await fast.settle(page, 0, 6); await shot('7_back_teleported');
  console.log('HQLOGS', JSON.stringify(logs.filter(l => /\[HQ\]|HQ→battle|parked|resumed/i.test(l)).slice(-40)));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 12)));
  await browser.close();
};
run().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
