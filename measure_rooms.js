// measure_rooms.js — the per-room cost probe (OPEN_WORLD_PLAN.md §2.3 / Phase 0, 2026-09-26). Repo-only tooling.
//
//   npm start &                      # the server on :3000
//   npm install --no-save playwright react@18 react-dom@18 three@0.128.0 three.meshline
//   node measure_rooms.js medical site_prebuilt_downtown_streets
//
// Enters each room in ONE page and prints, per room, renderer.info's draw calls / triangles, the scene's
// meshes / materials / geometries, the heap and the time the load card took. The FIRST room of a page also
// pays the boot's own entry to the main hall, so put a throwaway room first. Software GL (swiftshader):
// times are inflated, counts are exact. R2 is not reached: scripts come from the repo, three/react from
// node_modules, textures are a 1-pixel PNG, GLBs 404 unless the repo holds them. Options (env):
//   OUT=<file>        the JSON (default shots/measure_out.json)
//   CENSUS=1          the scene's top groups by visible meshes, and the repeated geometry+material pairs
//   STANDIN=<glb>     serve this one file for every missing prop GLB (so the instance pass has copies to batch)
//   NOQ=1             bypass the model queue (window.EW_NO_MODEL_QUEUE) so every file lands
//   WAIT=<ms>         wait this long after the load card drops (files that land after the gate)
//   NOINST=1          the instance pass off (window.EW_HQ_NO_INSTANCE); CELL=<m> MIN=<n> override its numbers
//   EVAL=<js body>    a function body evaluated in the page after the measure; its return goes in the JSON
//   GLBLOG=1          list every GLB requested
//   SHOT=<prefix>     screenshots of the directory's LAND tab (fogged, zoomed, EW_HQ_MAP_ALL, the underground)
const fs = require('fs'), path = require('path');
const REPO = process.cwd();
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NPM_MIRROR = [
  [/\/three\.js\/r128\/three\.min\.js$/, 'three/build/three.min.js'], [/\/three@0\.128\.0\/(examples\/js\/.+)$/, 'three/$1'],
  [/\/socket\.io\.min\.js$/, 'socket.io/client-dist/socket.io.min.js'], [/\/react\.production\.min\.js$/, 'react/umd/react.production.min.js'],
  [/\/react-dom\.production\.min\.js$/, 'react-dom/umd/react-dom.production.min.js'], [/\/THREE\.MeshLine\.js$/, 'three.meshline/src/THREE.MeshLine.js'],
];
const CT = { '.js': 'application/javascript', '.css': 'text/css' };
const PNG1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const rooms = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const glbLog = []; const cnt = { glbReq: 0, glbHit: 0, tex: 0, miss: 0 };
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    const base = path.basename(u.pathname), ext = path.extname(base).toLowerCase();
    for (const [re, target] of NPM_MIRROR) { const m = re.exec(u.pathname); if (m) { const abs = path.join(REPO, 'node_modules', target.replace(/\$(\d)/g, (_, i) => m[Number(i)])); if (fs.existsSync(abs)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(abs) }); } }
    if ((ext === '.js' || ext === '.css') && fs.existsSync(path.join(REPO, base))) return route.fulfill({ status: 200, contentType: CT[ext], body: fs.readFileSync(path.join(REPO, base)) });
    if (ext === '.js') { cnt.miss++; return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }); }
    if (ext === '.glb') { cnt.glbReq++; glbLog.push(u.pathname.slice(-70)); const pn = decodeURIComponent(u.pathname), b2 = path.basename(pn); for (const c of [path.join(REPO, 'doors', b2), path.join(REPO, b2)]) if (fs.existsSync(c)) { cnt.glbHit++; return route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: fs.readFileSync(c) }); } if (process.env.STANDIN && !/Character_output|withSkin|UAL|MAL|_Standard/i.test(b2)) { cnt.glbHit++; return route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: fs.readFileSync(process.env.STANDIN) }); } return route.fulfill({ status: 404, body: '' }); }
    if (/\.(png|jpg|jpeg|webp)$/.test(ext)) { cnt.tex++; return route.fulfill({ status: 200, contentType: 'image/png', body: PNG1 }); }
    cnt.miss++; return route.fulfill({ status: 404, body: '' });
  });
  const page = await context.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e).slice(0, 160)));
  await page.goto('http://localhost:3000/?hq&nomenu3d', { waitUntil: 'commit', timeout: 60000 });
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 120000) { try { const st = await page.evaluate(() => [typeof window._hqEnter, typeof ThreeRenderer !== 'undefined' && !!ThreeRenderer.hq]); if (st[0] === 'function' && st[1]) { ok = true; break; } } catch (e) {} await sleep(800); }
  if (!ok) { console.log('page never ready', errs.slice(0, 5)); await browser.close(); process.exit(1); }
  await page.evaluate(() => { window.EW_HQ_NO_POST = true; window.EW_DISABLE_CAST = true; window.EW_HQ_VARIANT = 'none'; }); if (process.env.CELL) await page.evaluate((c) => { HQ_STAGE_RULES.instanceCell = +c[0]; HQ_STAGE_RULES.instanceMin = +c[1]; }, [process.env.CELL, process.env.MIN || 4]); if (process.env.NOQ) await page.evaluate(() => { window.EW_NO_MODEL_QUEUE = true; }); if (process.env.NOINST) await page.evaluate(() => { window.EW_HQ_NO_INSTANCE = true; });
  const out = [];
  for (const room of rooms) {
    const glb0 = cnt.glbReq;
    const tEnter = Date.now();
    await page.evaluate((room) => { window.__tEnter = performance.now(); window._hqEnter({ from: 'play', room }); }, room);
    let ready = null;
    while (Date.now() - tEnter < 240000) {
      const st = await page.evaluate(() => { const l = document.getElementById('hqLoad'); return { hidden: !l || l.style.display === 'none', t: performance.now() - window.__tEnter }; });
      if (st.hidden) { ready = st.t; break; }
      await sleep(500);
    }
    await sleep(1500); if (process.env.WAIT) await sleep(+process.env.WAIT);
    const m = await page.evaluate((room) => {
      const R = ThreeRenderer.hq.dev.renderer(); const sc = ThreeRenderer.hq.dev.scene(); const hs = ThreeRenderer.hq.dev.hqScene();
      const c = { objects: 0, meshes: 0, instanced: 0, instances: 0, lights: 0, tris: 0, points: 0, lines: 0, mats: new Set(), geos: new Set() };
      const walk = (s) => s && s.traverse(o => { c.objects++; if (o.isLight) c.lights++; if (o.isMesh) { c.meshes++; if (o.isInstancedMesh) { c.instanced++; c.instances += o.count; } const g = o.geometry; if (g) { c.geos.add(g.uuid); const n = g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0); c.tris += Math.floor(n / 3) * (o.isInstancedMesh ? o.count : 1); } const mm = Array.isArray(o.material) ? o.material : [o.material]; mm.forEach(x => x && c.mats.add(x.uuid)); } if (o.isPoints) c.points++; if (o.isLine) c.lines++; });
      walk(sc); if (hs && hs !== sc) walk(hs);
      const info = R.info; const rm = DOOR_HQ.rooms[room]; const t = rm.terrain || {};
      let mem = null; try { mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null; } catch (e) {}
      return { room, compiled: !!rm._terrainInfo, name: rm.name || '', w: t.w, h: t.h, gen: t.gen && t.gen.kind, sky: !!(rm.shell && rm.shell.sky), inst: (ThreeRenderer.hq.dev.hqInst ? ThreeRenderer.hq.dev.hqInst() : null), calls: info.render.calls, drawTris: info.render.triangles, geometries: info.memory.geometries, textures: info.memory.textures, programs: info.programs ? info.programs.length : null, objects: c.objects, meshes: c.meshes, instanced: c.instanced, instances: c.instances, lights: c.lights, sceneTris: c.tris, materials: c.mats.size, uniqueGeos: c.geos.size, heapMB: mem };
    }, room);
    if (process.env.CENSUS) m.census = await page.evaluate(() => {
      const sc = ThreeRenderer.hq.dev.hqScene(); const by = {}; const geo = {};
      sc.children.forEach((top, i) => { const key = i + ':' + (top.name || top.type) + ':' + top.children.length; top.traverse(o => { if (!o.isMesh || !o.visible) return; let vis = true; for (let q = o; q; q = q.parent) if (!q.visible) { vis = false; break; } if (!vis) return; by[key] = (by[key] || 0) + 1; const mm = Array.isArray(o.material) ? o.material.map(x => x.uuid).join(',') : (o.material && o.material.uuid); const gk = (o.geometry && o.geometry.uuid) + '|' + mm; geo[gk] = (geo[gk] || 0) + 1; }); });
      const sig = {}; [0, 2].forEach(ti => { const top = sc.children[ti]; top.children.forEach(ch => { let n = 0; const gtypes = {}; ch.traverse(o => { if (o.isMesh && o.visible) { n++; const gt = o.geometry ? o.geometry.type : '?'; gtypes[gt] = (gtypes[gt] || 0) + 1; } }); const k = ti + ':' + (ch.name || '') + ':' + ch.type + ':' + Object.keys(ch.userData || {}).join('/') + ':' + (ch._ew_hqProp ? 'prop=' + ch._ew_hqProp.key : '') + (ch._ew_hqWall ? 'wall' : '') + ':' + Object.keys(gtypes).sort().join('+'); sig[k] = sig[k] || { kids: 0, meshes: 0 }; sig[k].kids++; sig[k].meshes += n; }); });
      const top = Object.entries(sig).sort((a, b) => b[1].meshes - a[1].meshes).slice(0, 40);
      const rep = Object.values(geo).filter(n => n >= 4); return { top, byTop: by, geoKinds: Object.keys(geo).length, repeatedKinds: rep.length, repeatedMeshes: rep.reduce((a, b) => a + b, 0) };
    });
    if (process.env.EVAL) m.eval = await page.evaluate(new Function(process.env.EVAL));
    if (process.env.SHOT) {
      const P = process.env.SHOT + '-' + room;
      const land = async () => { const ok = await page.evaluate(() => { const b = document.querySelector('[data-mapmode="land"]'); if (b) b.click(); return !!b; }); await sleep(1200); return ok; };
      await page.evaluate(() => { window.EW_HQ_MAP_ALL = false; window._hqOpenDirectory(); }); await sleep(1500);
      await page.evaluate(() => { const b = document.querySelector('[data-mapground="surface"]'); if (b) b.click(); }); await sleep(600);
      if (await land()) {
        await page.screenshot({ path: P + '-fog.png' });
        for (let z = 0; z < 3; z++) { await page.evaluate(() => { const b = document.querySelector('[data-mapzoom="in"]'); if (b) b.click(); }); await sleep(400); }
        await sleep(800); await page.screenshot({ path: P + '-fogzoom.png' });
      } else console.log('no LAND tab on the fogged map');
      await page.evaluate(() => { window.EW_HQ_MAP_ALL = true; window._hqOpenDirectory(); }); await sleep(1500);
      if (await land()) {
        await page.screenshot({ path: P + '-all.png' });
        await page.evaluate(() => { const b = document.querySelector('[data-mapground="under"]'); if (b) b.click(); }); await sleep(1200);
        await page.screenshot({ path: P + '-under.png' });
        await page.evaluate(() => { const b = document.querySelector('[data-mapground="surface"]'); if (b) b.click(); }); await sleep(1000);
        for (let z = 0; z < 2; z++) { await page.evaluate(() => { const b = document.querySelector('[data-mapzoom="in"]'); if (b) b.click(); }); await sleep(400); }
        await sleep(800); await page.screenshot({ path: P + '-allzoom.png' });
      } else console.log('no LAND tab even with EW_HQ_MAP_ALL');
      m.landErr = await page.evaluate(() => (window._ewHqFrameErrors || []).map(e => e.msg).slice(0, 5));
    }
    m.readyMs = ready == null ? 'TIMEOUT' : Math.round(ready); m.glbRequested = cnt.glbReq - glb0; m.errors = errs.length;
    out.push(m); console.log(JSON.stringify(m));
  }
  const outFile = process.env.OUT || path.join(REPO, 'shots', 'measure_out.json'); fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 8))); if (process.env.GLBLOG) console.log(glbLog.join('\n'));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
