// playtest_flicker.js — THE GROUND FLICKER PROBE (2026-11-27, repo-only dev tooling, never uploaded to R2).
// A real VS CPU battle, the AI held, the board camera wheeled all the way out, then a row of pictures with the camera nudged
// a hair between them (as the camera's damp drifts in play): z-fighting ground shows as speckle that changes picture to picture.
// Prints the lens' near / far / boom and the share of ground pixels that changed. Needs the server (npm start).
//   TAG=run1 node playtest_flicker.js   -> shots/flicker/run1_<old|new>_z<zoom>_<k>.png + run1.json
//   (old = window.EW_NO_DEPTH_FIT on, the fixed near plane; new = THE DEPTH FIT; the same match, the same camera)
//   MAP=<map id> ZOOMS=0.3,1 FLAGS=<window flags>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const OUT = path.join(REPO, 'shots', 'flicker'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'base', MAP = process.env.MAP || '';
const ZOOMS = (process.env.ZOOMS || '0.3,1').split(',').map(Number);
const FLAGS = (process.env.FLAGS || '').split(',').filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const fast = require(path.join(REPO, 'probe-fast.js'));
  const browser = await fast.launch(chromium, { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((flags) => { for (const f of flags) { const [k, v] = f.split('='); window[k] = v === undefined ? true : (isNaN(+v) ? v : +v); } }, FLAGS);
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0].slice(0, 200)));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 120; i++) { if (await page.evaluate(() => typeof window._goToVsCpu === 'function' && !!window.GAME).catch(() => false)) break; await sleep(1000); }
  await sleep(3000);
  console.log('build', await page.evaluate(() => JSON.stringify(window.EW_BUILD && window.EW_BUILD.head || null)));
  await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; });
  await page.evaluate(() => window._goToVsCpu()); await sleep(2500);
  console.log('launch', await page.evaluate((id) => { try { const mi = id ? MS_MAP_LIST.findIndex(x => x.modeId === id || x.id === id) : -1; if (mi >= 0) _msSelectedMap = mi; const gi = MS_GAME_MODES.findIndex(x => x.id === 'tdm'); if (gi >= 0) _msSelectedGM = gi; window._msConfirm(); return 'map ' + mi; } catch (e) { return 'err ' + e.message; } }, MAP));
  await sleep(2500);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => /SEAL YOUR FATE/i.test(x.innerText)); if (b) b.click(); }); await sleep(1500); if (await page.evaluate(() => GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => GAME.state.phase) === 'battle') break; await sleep(1000); }
  await page.evaluate(() => { const st = GAME.state; st.controllers = { 1: 'local', 2: 'local' }; st.autoPlayers = {}; });
  for (let i = 0; i < 300; i++) { if (await page.evaluate(() => !document.querySelector('.ls-bar-fill') || !document.querySelector('.ls-bar-fill').offsetParent)) break; await sleep(1000); }
  await sleep(8000);
  if (process.env.AUDIT) console.log('AUDIT', await page.evaluate(() => {
    // one read of the board scene (a probe, not a frame loop): every drawn mesh's sheets that a far lens reads without mips
    const sc = ThreeRenderer.hq.dev.scene(); if (!sc) return 'no scene';
    const out = {}; let n = 0;
    sc.traverseVisible(o => { if (!o.isMesh) return; n++; const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) { if (!m) continue; for (const k of ['map', 'emissiveMap', 'alphaMap']) { const t = m[k]; if (!t || !t.isTexture) continue;
        const key = (o.name || o.parent && o.parent.name || o.type).slice(0, 40) + ' | ' + k + ' min=' + t.minFilter + ' mag=' + t.magFilter + ' mips=' + t.generateMipmaps + ' an=' + t.anisotropy + ' img=' + (t.image && (t.image.width + 'x' + t.image.height));
        out[key] = (out[key] || 0) + 1; } } });
    return n + ' meshes\n' + Object.entries(out).sort((a, b) => b[1] - a[1]).slice(0, 60).map(e => e[1] + '  ' + e[0]).join('\n');
  }));
  const meta = { map: await page.evaluate(() => GAME.state.mapId || GAME.state.selectedMapId || null), shots: [] };
  for (const mode of (process.env.MODES || 'old,new').split(',')) for (const z of ZOOMS) {
    await page.evaluate((m) => { window.EW_NO_DEPTH_FIT = m === 'old'; const g = m === 'nograss'; ThreeRenderer.hq.dev.scene().traverse(o => { if (o._ew_ggrass) { if (o._fl_vis === undefined) o._fl_vis = o.visible; o.visible = g ? false : o._fl_vis; } }); }, mode);
    await page.evaluate((z) => { state.userZoomScale = z; camera.snap({ _force: true, zoom: z }); }, z);
    for (let i = 0, last = ''; i < 40; i++) { await sleep(1000); const now = await page.evaluate(() => ThreeCamera.getCamera().position.toArray().map(Math.round).join(',')); if (now === last) break; last = now; }   // the glide settles
    const pics = [];
    for (let k = 0; k < 4; k++) {
      // a hair of camera motion, as the damp drifts in play
      await page.evaluate(([k, j]) => { camera.snap({ _force: true, zoom: state.userZoomScale * (1 + k * j) }); }, [k, +process.env.JIT || 0.00002]);
      await sleep(1500);
      const info = await page.evaluate(() => { const c = ThreeCamera.getCamera(); const T = window.THREE; const f = new T.Vector3(); return { near: +c.near.toFixed(2), far: Math.round(c.far), fov: c.fov, pos: c.position.toArray().map(Math.round), zoom: camera.zoom }; });
      const p = `${OUT}/${TAG}_${mode}_z${z}_${k}.png`;
      await page.screenshot({ path: p });
      pics.push(p); meta.shots.push(Object.assign({ mode, z, k, p }, info));
      console.log('SHOT', mode, z, k, JSON.stringify(info));
    }
  }
  fs.writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(meta, null, 1));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
