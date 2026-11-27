// playtest_handcam.js — THE HAND CAMERA PROBE (2026-11-27, repo-only dev tooling, never uploaded to R2).
// A real VS CPU battle; on the local player's turn the probe works the battle camera with REAL mouse input (wheel notches,
// right-drag orbits, left-drag pans) and records the lens on every drawn frame. For a plain orbit camera the lens stands
// `dist` from the focal at the pitch the hand set, whatever the heading: the report says how far the drawn lens strayed from
// that (a crane, a dolly-in, a floor lift), how big the worst one-frame jump was, and how much of the unit's body a real ray
// from the lens could not reach. Needs the server (npm start). Never run two probes at once.
//   MAP=<id> TAG=<name> node playtest_handcam.js          -> shots/handcam/<name>.json + pictures
//   LISTMAPS=1 node playtest_handcam.js                   -> the map ids
//   FLAGS=EW_NO_HAND_ORBIT ...                            -> the camera as it was before THE HAND ORBIT (the A side)
//   SPOT=x,y  = stand the unit on that tile first. ZOOMS=4.5,2 PITCHES=78,60 = the orbits to fly.
// Notes: docs/notes/spells-vfx.md "THE HAND ORBIT".
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const OUT = path.join(__dirname, 'shots', 'handcam'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'base';
const MAP = process.env.MAP || '';
const FLAGS = (process.env.FLAGS || '').split(',').filter(Boolean);
const ZOOMS = (process.env.ZOOMS || '4.5,2').split(',').map(Number);
const PITCHES = (process.env.PITCHES || '78,60').split(',').map(Number);
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SAMPLER = () => {
  if (window.__hc) return 'had';
  const O = window.__hc = { samples: [], tag: '', on: false, err: null };
  const R = ThreeRenderer.hq.dev.renderer();
  const eye = new THREE.Vector3(), dir = new THREE.Vector3(), p = new THREE.Vector3(), d = new THREE.Vector3();
  const rc = new THREE.Raycaster(), upos = [0, 0, 0];
  const vis = (o) => { for (let a = o; a; a = a.parent) if (a.visible === false) return false; return true; };
  function cover(scene, cam, u) {
    // real rays from the lens to the body at three heights: what is in front and still solid
    if (!u || !ThreeRenderer.getUnitWorldPos(u.id, upos)) return null;
    const ts = CONFIG.tileSize, h = (ThreeRenderer.getUnitVisualHeight ? ThreeRenderer.getUnitVisualHeight(u.id) : 0) || ts * 0.9;
    let pts = 0, blocked = 0; const by = {};
    rc.camera = cam; rc.layers.mask = cam.layers.mask;
    for (const f of [0.25, 0.55, 0.9]) {
      p.set(upos[0], upos[1] + h * f, upos[2]); pts++;
      d.copy(p).sub(eye); const dist = d.length(); d.multiplyScalar(1 / dist);
      rc.set(eye, d); rc.near = 0.01; rc.far = dist - ts * 0.5;
      const hits = [];
      scene.traverse(o => { if (o.isMesh && o.visible !== false && !o._ew_fieldPick) { try { rc.intersectObject(o, false, hits); } catch (e) {} } });
      hits.sort((a, b) => a.distance - b.distance);
      for (const hit of hits) {
        const o = hit.object; if (!vis(o)) continue;
        let m = o.material; if (Array.isArray(m)) m = m[(hit.face && hit.face.materialIndex) || 0] || m[0];
        if (!m || m.visible === false || m.colorWrite === false) continue;
        if (m.blending === THREE.AdditiveBlending || (m.transparent && m.depthWrite === false && (m.opacity == null ? 1 : m.opacity) < 0.5)) continue;
        if (m.side === THREE.FrontSide && hit.face && o.matrixWorld) { const n = hit.face.normal.clone().transformDirection(o.matrixWorld); if (n.dot(d) > 0) continue; }   // a back face is not drawn
        if (Math.hypot(hit.point.x - upos[0], hit.point.z - upos[2]) < ts * 0.6 && hit.point.y > upos[1] - 4) continue;   // the body itself
        let nm = ''; for (let a = o; a && a.parent && !nm; a = a.parent) nm = a.name || ''; by[nm || o.type] = 1; blocked++; break;
      }
    }
    return { pts: pts, blocked: blocked, by: Object.keys(by) };
  }
  let n = 0;
  const orig = R.render;
  R.render = function (scene, cam) {
    const r = orig.apply(this, arguments);
    try {
      if (O.on && cam === ThreeCamera.getCamera() && scene && scene.isScene && !window.__ewHold) {
        const C = camera, st = GAME.state, ts = CONFIG.tileSize;
        cam.getWorldPosition(eye); cam.getWorldDirection(dir);
        const u = st.units.find(x => x.id === (st.selectedUnitId || st._blitzActiveUnitId));
        const s = { t: Math.round(performance.now()), tag: O.tag, e: [+(eye.x / ts).toFixed(3), +(eye.y / ts).toFixed(3), +(eye.z / ts).toFixed(3)], d: [+dir.x.toFixed(4), +dir.y.toFixed(4), +dir.z.toFixed(4)],
          x: +C.x.toFixed(3), y: +C.y.toFixed(3), zoom: +C.zoom.toFixed(3), tilt: +C.tilt.toFixed(1), yaw: +C.yaw.toFixed(1), sT: +C._smoothTilt.toFixed(1), sY: +C._smoothYaw.toFixed(1), sZ: +C._smoothZoom.toFixed(3),
          fy: +((C._computedElevZ || 0) / ts).toFixed(3), base: +(ThreeCamera.getBaseDist() / ts).toFixed(3), pan: !!st._userPanning, orb: !!st._userOrbiting, cine: C._cineShotId != null, tps: !!C._cineTps, hold: !!C._tpsHold, menu: !!C._menuShot,
          cv: ThreeCamera.closeViewState ? ThreeCamera.closeViewState() : null, sb: ThreeCamera.steadyBoardState ? (ThreeCamera.steadyBoardState() || {}).lift || 0 : 0, lf: ThreeCamera.lensFloorHits ? ThreeCamera.lensFloorHits() : 0, ho: ThreeCamera.handOrbitState ? ThreeCamera.handOrbitState() : null };
        if (u && ThreeRenderer.getUnitWorldPos(u.id, upos)) s.u = [+(upos[0] / ts).toFixed(3), +(upos[1] / ts).toFixed(3), +(upos[2] / ts).toFixed(3)];
        if ((n++ % 3) === 0) s.cov = cover(scene, cam, u);
        O.samples.push(s);
      }
    } catch (e) { O.err = String(e && e.message); }
    return r;
  };
  return 'ok';
};

(async () => {
  const browser = await require(path.join(REPO, 'probe-fast.js')).launch(chromium, { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((flags) => { try { localStorage.setItem('ew_cinematicActionCam', '1'); } catch (e) {} for (const f of flags) { const [k, val] = f.split('='); window[k] = val === undefined ? true : (isNaN(+val) ? val : +val); } }, FLAGS);
  const page = await ctx.newPage();
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/Raycaster/.test(t) && !/Failed to load resource|ERR_/.test(t)) console.log('CONERR', t.slice(0, 200)); });
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0].slice(0, 200)));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 120; i++) { if (await page.evaluate(() => typeof window._goToVsCpu === 'function' && !!window.GAME).catch(() => false)) break; await sleep(1000); }
  await sleep(4000);
  console.log('build', await page.evaluate(() => JSON.stringify(window.EW_BUILD || null)));
  await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; });
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);
  if (process.env.LISTMAPS) { console.log(await page.evaluate(() => { try { return JSON.stringify(MS_MAP_LIST.map((m, i) => i + ':' + (m.modeId || m.id) + ':' + (m.label || m.name || ''))); } catch (e) { return 'err ' + e.message; } })); await browser.close(); return; }
  console.log('launch', await page.evaluate((id) => {
    try {
      const mi = id ? MS_MAP_LIST.findIndex(x => x.modeId === id || x.id === id) : -1;
      if (mi >= 0) _msSelectedMap = mi;
      const gi = MS_GAME_MODES.findIndex(x => x.id === 'tdm'); if (gi >= 0) _msSelectedGM = gi;
      if (typeof window._msConfirm === 'function') { window._msConfirm(); return 'confirm map ' + mi; }
    } catch (e) { return 'err:' + e.message; }
    return 'none';
  }, MAP));
  await sleep(2500);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => /SEAL YOUR FATE/i.test(x.innerText)); if (b) b.click(); }); await sleep(1500); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  { let ok = 0; for (let i = 0; i < 90 && ok < 6; i++) { await sleep(1000); const ph = await page.evaluate(() => GAME.state.phase); if (ph === 'battle') ok++; else { ok = 0; if (i % 8 === 7) { console.log('restart match (phase ' + ph + ')'); await page.evaluate(() => { const st = GAME.state; try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} }); } } } }
  // both seats local: nothing takes the turn away while the hand works the camera
  await page.evaluate(() => { const st = GAME.state; st.controllers = { 1: 'local', 2: 'local' }; st.autoPlayers = {}; });
  // the loading card may still cover the fight
  for (let i = 0; i < 240; i++) { const up = await page.evaluate(() => { const l = document.querySelector('.ls-status'); return !!(l && l.offsetParent) || /TAP TO SKIP/.test(document.body.innerText || ''); }); if (!up) break; await sleep(1000); }
  await sleep(6000);
  if (process.env.SPOT) {
    const sp = process.env.SPOT.split(',').map(Number);
    console.log('spot', await page.evaluate((sp) => { const st = GAME.state; const u = st.units.find(x => x.id === st._blitzActiveUnitId) || st.units.find(x => x.player === 1 && !x.dead); u.x = sp[0]; u.y = sp[1]; try { u.z = getHeightAt(sp[0], sp[1]); } catch (e) { u.z = 0; } st._blitzActiveUnitId = u.id; st.selectedUnitId = u.id; try { ThreeRenderer.invalidateUnits && ThreeRenderer.invalidateUnits(); GAME.markDirty(); GAME.renderIfDirty && GAME.renderIfDirty(); } catch (e) {} try { camera.snap({ _force: true, x: u.x, y: u.y }); } catch (e) {} return u.name + ' at ' + u.x + ',' + u.y + ',' + u.z; }, sp));
    await sleep(2500);
  }
  console.log('sampler', await page.evaluate(SAMPLER));
  const meta = await page.evaluate(() => { const st = GAME.state, u = st.units.find(x => x.id === (st.selectedUnitId || st._blitzActiveUnitId)); return { map: st.mapId || st.selectedMapId || null, w: GAME.bw(), h: GAME.bh(), unit: u ? [u.name, u.x, u.y, u.z, u.player] : null, mode: String(activeGameMode), flags: Object.keys(window).filter(k => /^EW_NO_/.test(k) && window[k]) }; });
  console.log('meta', JSON.stringify(meta));
  const cx = Math.round(W * 0.6), cy = Math.round(H * 0.45);
  const pose = () => page.evaluate(() => ({ tilt: camera.tilt, yaw: camera.yaw, zoom: camera.zoom, sT: GAME.state.dioramaTiltDeg, sY: GAME.state.dioramaYawDeg }));
  const tag = (t) => page.evaluate((t) => { window.__hc.tag = t; window.__hc.on = !!t; }, t);
  const shot = async (name) => { try { await page.screenshot({ path: `${OUT}/${TAG}_${name}.png` }); } catch (e) { console.log('shot failed', name, e.message); } };
  // a real right-drag by (dx, dy) px in small steps
  const drag = async (dx, dy, steps, button, pause) => {
    await page.mouse.move(cx, cy); await page.mouse.down({ button: button || 'right' });
    for (let i = 1; i <= steps; i++) { await page.mouse.move(cx + dx * i / steps, cy + dy * i / steps); await sleep(pause || 60); }
    await page.mouse.up({ button: button || 'right' });
  };
  // the wheel until the zoom reads z
  const zoomTo = async (z) => { for (let i = 0; i < 60; i++) { const p = await pose(); if (Math.abs(p.zoom - z) < 0.13) break; await page.mouse.move(cx, cy); await page.mouse.wheel(0, p.zoom < z ? -100 : 100); await sleep(90); } await sleep(500); };
  // right-drag until the pitch reads t (0.3 degrees a px)
  const pitchTo = async (t) => { for (let i = 0; i < 6; i++) { const p = await pose(); const need = t - p.sT; if (Math.abs(need) < 1.5) break; await drag(0, Math.max(-300, Math.min(300, need / 0.3)), 8); await sleep(350); } };
  await shot('0_start');
  await tag('rest'); await sleep(1500);
  let k = 0;
  for (const z of ZOOMS) for (const pt of PITCHES) {
    k++;
    const name = 'z' + z + '_p' + pt;
    await tag('set:' + name); await zoomTo(z); await pitchTo(pt); await sleep(900);
    console.log('pose', name, JSON.stringify(await pose()));
    // one full turn in 12 right-drags of 30 degrees (75 px at 0.4 degrees a px), released between them like a hand does
    for (let i = 0; i < 12; i++) {
      await tag('orbit:' + name + ':' + i);
      await drag(75, 0, 6, 'right', 70);
      await tag('rest:' + name + ':' + i);
      await sleep(650);
      if (i % 3 === 0) await shot(k + '_' + name + '_yaw' + (i * 30));
    }
    // the pitch from the top to level and back, in one held drag each way
    await tag('pitch:' + name + ':down'); await drag(0, -200, 12, 'right', 70); await sleep(500); await shot(k + '_' + name + '_top');
    await tag('pitch:' + name + ':up'); await drag(0, 290, 14, 'right', 70); await sleep(500); await shot(k + '_' + name + '_low');
    await tag('pitch:' + name + ':back'); await pitchTo(pt); await sleep(400);
  }
  // the wheel through its range at the last pitch
  await tag('wheel:in'); await zoomTo(6); await shot('w_in');
  await tag('wheel:out'); await zoomTo(1); await shot('w_out');
  // a left-drag pan and back
  await tag('pan'); await drag(160, 60, 8, 'left', 70); await sleep(600); await drag(-160, -60, 8, 'left', 70); await sleep(600);
  await tag('');
  const data = await page.evaluate(() => ({ samples: window.__hc.samples, err: window.__hc.err }));
  fs.writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify({ meta, data }));
  // ── the report ──
  const S = data.samples, rep = {};
  for (const s of S) {
    const key = s.tag.split(':')[0] + (s.tag.split(':')[1] ? ':' + s.tag.split(':')[1] : '');
    const R = rep[key] || (rep[key] = { n: 0, dMin: 1e9, dMax: 0, pitchMin: 1e9, pitchMax: -1e9, jump: 0, cov: 0, covN: 0, by: {}, lift: 0, want: null });
    if (!s.u) continue;
    // the lens against the plain orbit: `dist` from the focal, on the hand's pitch
    const fx = s.x + 0.5, fz = s.y + 0.5, fy = s.fy;
    const dx = s.e[0] - fx, dy = s.e[1] - fy, dz = s.e[2] - fz, dist = Math.hypot(dx, dy, dz), want = s.base / s.sZ;
    const pitch = Math.asin(-s.d[1]) * 180 / Math.PI;   // degrees the lens looks down
    R.n++; R.dMin = Math.min(R.dMin, dist / want); R.dMax = Math.max(R.dMax, dist / want);
    R.pitchMin = Math.min(R.pitchMin, pitch - (90 - s.sT)); R.pitchMax = Math.max(R.pitchMax, pitch - (90 - s.sT));
    R.lift = Math.max(R.lift, s.e[1] - (fy + want * Math.cos(s.sT * Math.PI / 180)));
    if (R.last && s.t - R.last.t < 400) { const j = Math.hypot(s.e[0] - R.last.e[0], s.e[1] - R.last.e[1], s.e[2] - R.last.e[2]) / want; if (j > R.jump) R.jump = j; }
    R.last = s;
    if (s.cov) { R.covN += s.cov.pts; R.cov += s.cov.blocked; for (const b of s.cov.by) R.by[b] = (R.by[b] || 0) + 1; }
  }
  console.log('samples', S.length, 'err', data.err);
  for (const key of Object.keys(rep)) { const R = rep[key]; if (!R.n) continue; console.log('REPORT', key.padEnd(22), 'n', String(R.n).padStart(4), ' boom x', R.dMin.toFixed(2), '-', R.dMax.toFixed(2), ' pitch off', R.pitchMin.toFixed(1), '..', R.pitchMax.toFixed(1), ' lift', R.lift.toFixed(2), 'sq', ' jump', R.jump.toFixed(2), ' body hidden', R.covN ? Math.round(100 * R.cov / R.covN) + '%' : '-', Object.keys(R.by).slice(0, 5).join(',')); }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
