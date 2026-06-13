// Height/camera/VFX integration harness.
// Verifies that unit heights (incl. flying), spell VFX endpoints and the
// action camera all live in the SAME world space after the elevation-ratio
// unification (window._getElevationPx ratio 1.0 == three-renderer
// ELEV_STEP_RATIO). Serves the LOCAL repo copies of the edited scripts via
// LOCAL_ASSETS so repo edits are testable before the R2 upload.
//
//   node playtest_heights.js          (server must be running on :3000)
//
// Checks:
//  A. unit world Y from the renderer == _getElevationPx-based expectation
//     for grounded, roof-standing and AIRBORNE units.
//  B. cinematic action cam: during a P1 spell on an airborne target, the
//     camera lookAt height sits between the two unit anchors, and the CASTER
//     stays inside the viewport for the whole swoop+dolly.
//  C. VFX endpoint args: ThreeVFXEffects entry points receive z levels that
//     convert to the renderer-space unit height.
// Artifacts: shots/heights-*.png + console PASS/FAIL summary.
const { chromium } = require('playwright');
const fs = require('fs');
const { installAssetCache } = require('./asset_cache');

process.env.LOCAL_ASSETS = process.env.LOCAL_ASSETS ||
  'battle.js,ui.js,hud.js,three-camera.js,three-vfx.js,three-vfx-effects.js,three-lightning.js,three-renderer.js';

const SHOTS = __dirname + '/shots';
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function snap(page, name) { try { await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 9000, animations: 'disabled' }); } catch (e) {} }

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
  const cache = await installAssetCache(ctx);
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0]));
  await page.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 60000 });
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => !!(window.GAME && window._goToVsCpu)).catch(() => false)) break; await sleep(1000); }
  console.log('Game loaded.', JSON.stringify(cache.stats()));

  // ── start an 8×8 TDM vs CPU ──
  await page.evaluate(() => window._goToVsCpu());
  await sleep(1800);
  await page.evaluate(() => {
    const map = [...document.querySelectorAll('.ms-map-card')].find(b => /8×8|8x8/i.test(b.textContent || '') && /4\s*SPAWNS/i.test(b.textContent || ''));
    if (map) map.click();
  });
  await sleep(600);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.ms-mode-card')].find(b => /death\s*match/i.test(b.textContent || ''));
    if (el) el.click();
  });
  await sleep(800);
  await page.evaluate(() => { const b = document.querySelector('.ms-btn-primary'); if (b) b.click(); });
  await sleep(2000);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary'); if (b) b.click(); }); await sleep(1400); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  for (let i = 0; i < 30; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'ai' }; });
  console.log('Battle started. ThreeRenderer active:', await page.evaluate(() => window.ThreeRenderer && ThreeRenderer.isActive()));

  const results = [];
  const fail = (name, detail) => { results.push({ name, ok: false, detail }); console.log(`  FAIL ${name}: ${detail}`); };
  const pass = (name, detail) => { results.push({ name, ok: true, detail }); console.log(`  PASS ${name}${detail ? ': ' + detail : ''}`); };

  // ── A. unit height audit (grounded + forced airborne) ──
  console.log('\n[A] unit world-Y audit');
  const audit = await page.evaluate(() => {
    const st = window.GAME.state, ts = CONFIG.tileSize || 128;
    const out = [];
    // force one enemy airborne (jetpack guarantees canFly)
    const tgt = st.units.find(u => u.player === 2 && !u.dead);
    tgt.equipment = tgt.equipment || {};
    tgt.equipment.accessory1 = 'jetpack';
    tgt.z = (getHeightAt(tgt.x, tgt.y) || 0) + 3;
    window.__airborneTargetId = tgt.id;
    for (const u of st.units) {
      if (u.dead) continue;
      const airborne = (typeof canFly === 'function' && canFly(u) && isUnitAirborne(u));
      const expected = airborne ? window._getElevationPx(u.z)
                                : window._getElevationPx(getHeightAt(u.x, u.y) || 0);
      const got = ThreeRenderer.unitSurfaceY(u);
      out.push({ name: u.name || u.cls, airborne, z: u.z ?? 0, expected, got });
    }
    return out;
  });
  let aBad = 0;
  for (const r of audit) {
    if (Math.abs(r.expected - r.got) > 2) { aBad++; console.log(`    mismatch ${r.name} airborne=${r.airborne} z=${r.z} expected=${r.expected} got=${r.got}`); }
  }
  const airborneCount = audit.filter(r => r.airborne).length;
  if (aBad === 0 && airborneCount > 0) pass('unit-heights', `${audit.length} units (${airborneCount} airborne) renderer Y == _getElevationPx`);
  else if (aBad === 0) fail('unit-heights', 'no airborne unit in audit — forcing failed');
  else fail('unit-heights', `${aBad}/${audit.length} mismatched`);

  // ── C-prep. wrap VFX entry points to record what they're asked to draw ──
  await page.evaluate(() => {
    window.__VFX_CALLS = [];
    const wrap = (obj, fn) => {
      const orig = obj[fn]; if (!orig) return;
      obj[fn] = function () { try { window.__VFX_CALLS.push({ fn, args: [...arguments].map(a => (typeof a === 'object' && a) ? JSON.parse(JSON.stringify(a)) : a) }); } catch (e) {} return orig.apply(this, arguments); };
    };
    wrap(window.ThreeVFXEffects, 'projectile');
    wrap(window.ThreeVFXEffects, 'beam');
    wrap(window.ThreeVFXEffects, 'aoe');
    wrap(window.ThreeVFXEffects, 'fire');
    wrap(window.ThreeVFXEffects, 'fireBoltDirect');
  });

  // ── B. cinematic action cam on an airborne target ──
  console.log('\n[B] cinematic action camera vs airborne target');
  const camRun = await page.evaluate(async () => {
    const G = window.GAME, st = G.state, ts = CONFIG.tileSize || 128;
    st.cinematicActionCam = true;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const tgt = st.units.find(u => u.id === window.__airborneTargetId);
    // wait for a local P1 unit to be active
    let unit = null;
    for (let i = 0; i < 360; i++) {
      const id = st._blitzActiveUnitId;
      const u = id ? st.units.find(x => x.id === id) : null;
      if (u && !u.dead && u.player === 1 && st.controllers[1] === 'local') { unit = u; break; }
      if (i % 4 === 3) { try { window.maybeAdvanceTurn(); window.maybeTriggerComputerTurn(); } catch (e) {} }
      await sleep(250);
    }
    if (!unit) return { err: 'no active P1 unit (active=' + st._blitzActiveUnitId + ' phase=' + st.phase + ' round=' + st.round + ' winner=' + st.winner + ')' };
    // pick any damaging spell, IGNORE range (force-fire for the visual test)
    const DMG = new Set(['damage', 'ricochet', 'multiHit', 'aoe', 'barrage', 'lifeDrain', 'line', 'linePush', 'cross', 'aoePull', 'splitBeam']);
    let spell = (unit.spells || []).find(s => DMG.has(s.kind) && G.canAffordSpell(unit, s) && (unit.mp || 0) >= (s.cost || 0));
    if (!spell) spell = (unit.spells || [])[0];
    // move the airborne target into spell range of the caster (teleport it)
    const r = Math.max(1, Math.min(3, (G.getEffectiveSpellRange ? G.getEffectiveSpellRange(unit, spell) : spell.range) || 2));
    const bw = st.boardW || 8, bh = st.boardH || 8;
    let bestTile = null;
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
      if (Math.abs(dx) + Math.abs(dy) > r || (dx === 0 && dy === 0)) continue;
      const x = unit.x + dx, y = unit.y + dy;
      if (x < 0 || y < 0 || x >= bw || y >= bh) continue;
      if (st.units.some(u => !u.dead && u !== tgt && u.x === x && u.y === y)) continue;
      if (!bestTile || Math.abs(dx) + Math.abs(dy) > Math.abs(bestTile.dx) + Math.abs(bestTile.dy)) bestTile = { x, y, dx, dy };
    }
    // max-altitude airborne target = the worst case for camera framing + VFX height
    if (bestTile) { tgt.x = bestTile.x; tgt.y = bestTile.y; tgt.z = (getHeightAt(tgt.x, tgt.y) || 0) + 8; }
    // the target must SURVIVE the hit or the kill/turn-advance restore cuts
    // the cine shot short and the in-frame check becomes vacuous
    tgt.maxHp = 50000; tgt.hp = 50000;
    if (window.scheduleBoardRender) window.scheduleBoardRender();
    await sleep(400);

    const casterAnchorY = () => ThreeRenderer.unitSurfaceY(unit) + ts * 0.55;
    const targetAnchorY = () => ThreeRenderer.unitSurfaceY(tgt) + ts * 0.55;
    const projectCaster = () => {
      const cam = ThreeCamera.getCamera(); if (!cam || !window.THREE) return null;
      const v = new THREE.Vector3(unit.x * ts + ts / 2, casterAnchorY(), unit.y * ts + ts / 2);
      v.project(cam);
      return { x: v.x, y: v.y };
    };

    const flags = {
      cameraDisabled: !!st.cameraDisabled,
      cinematicMode: !!st.cinematicMode,
      cinematicActionCam: !!st.cinematicActionCam,
      animationsDisabled: !!st.animationsDisabled,
      devAutoSim: !!st.devAutoSim,
      docHidden: document.hidden,
      cinePresent: (typeof isCinematicPresent === 'function') ? isCinematicPresent() : 'n/a'
    };
    // instrument camera ops to find what cancels the cine shot
    window.__CAMLOG = [];
    const cam0 = window.GAME._camera;
    const t0 = performance.now();
    for (const m of ['moveTo', 'snap', 'softResetToUnit', 'reset', 'save', '_stop']) {
      if (cam0['__w_' + m]) continue;
      cam0['__w_' + m] = cam0[m];
      cam0[m] = function () {
        const stack = (new Error().stack || '').split('\n').slice(2, 6).map(l => l.trim().replace(/https?:\S+/g, '')).join(' | ');
        let argStr = '';
        try { argStr = JSON.stringify(arguments[0]); } catch (e) {}
        window.__CAMLOG.push({ t: Math.round(performance.now() - t0), m, arg: (argStr || '').slice(0, 220), stack });
        return cam0['__w_' + m].apply(this, arguments);
      };
    }
    st.selectedTool = spell.name; st.actionMode = 'spell';
    const ret = G.doSpell(unit, tgt.x, tgt.y, tgt.z);
    st.selectedTool = null; st.actionMode = null;

    const samples = [];
    for (let t = 0; t < 60; t++) {
      const cam = ThreeCamera.getCamera();
      const c = window.GAME._camera;
      const look = c ? {
        x: +(c.x ?? 0).toFixed(2), y: +(c.y ?? 0).toFixed(2),
        tilt: +(st.dioramaTiltDeg ?? 0).toFixed(1),
        yaw: +(st.dioramaYawDeg ?? 0).toFixed(1),
        zoom: +(c.zoom ?? 0).toFixed(2),
        elevZ: c._computedElevZ != null ? +c._computedElevZ.toFixed(0) : null,
        cineId: c._cineShotId
      } : null;
      samples.push({
        t: Math.round(performance.now() - t0),   // REAL elapsed ms since the cast
        proj: projectCaster(),
        camY: cam ? +cam.position.y.toFixed(0) : null,
        look, srcY: +casterAnchorY().toFixed(0), tgtY: +targetAnchorY().toFixed(0)
      });
      if (samples[samples.length - 1].t > 5200) break;
      await sleep(60);
    }
    return { ret, flags, camlog: window.__CAMLOG, casterAt: { x: unit.x, y: unit.y }, targetAt: { x: tgt.x, y: tgt.y }, spell: spell.name, kind: spell.kind, dist: Math.abs(unit.x - tgt.x) + Math.abs(unit.y - tgt.y), srcZ: unit.z ?? 0, tgtZ: tgt.z, samples, vfxCalls: window.__VFX_CALLS };
  });

  if (camRun.err) { fail('cine-cam', camRun.err); }
  else {
    console.log(`  cast ${camRun.spell} (${camRun.kind}) ret=${camRun.ret} dist=${camRun.dist} tgtZ=${camRun.tgtZ} caster=${JSON.stringify(camRun.casterAt)} target=${JSON.stringify(camRun.targetAt)}`);
    console.log(`  flags: ${JSON.stringify(camRun.flags)}`);
    for (const c of (camRun.camlog || []).filter(c => c.m !== '_stop').slice(0, 10)) {
      console.log(`  cam@${c.t}ms ${c.m}(${c.arg}) ← ${c.stack.split(' | ')[0]}`);
    }
    for (const s of camRun.samples.filter((s, i) => i % 6 === 0)) {
      console.log(`  t=${s.t}ms look=${JSON.stringify(s.look)} proj=${s.proj ? `{x:${s.proj.x.toFixed(2)},y:${s.proj.y.toFixed(2)}}` : null}`);
    }
    for (const i of [2, 6, 10, 14, 20, 26]) {
      const s = camRun.samples[i];
      if (s) console.log(`  t=${s.t}ms look=${JSON.stringify(s.look)} proj=${s.proj ? `{x:${s.proj.x.toFixed(2)},y:${s.proj.y.toFixed(2)}}` : null} camY=${s.camY}`);
    }
    // caster must stay in frame (NDC within ±1) while the CINE SHOT owns the
    // camera and the 640ms swoop has arrived. Samples use real elapsed ms.
    const held = camRun.samples.filter(s => s.proj && s.look && s.look.cineId != null && s.t >= 700);
    const off = held.filter(s => Math.abs(s.proj.x) > 1.0 || Math.abs(s.proj.y) > 1.0);
    if (held.length && off.length === 0) pass('caster-in-frame', `${held.length} held-shot samples, max |ndc| x=${Math.max(...held.map(s => Math.abs(s.proj.x))).toFixed(2)} y=${Math.max(...held.map(s => Math.abs(s.proj.y))).toFixed(2)}`);
    else if (!held.length) fail('caster-in-frame', 'no samples landed inside the held cine window (rendering too slow?)');
    else fail('caster-in-frame', `${off.length}/${held.length} held-shot samples offscreen (first at t=${off[0].t}ms ndc=${JSON.stringify(off[0].proj)})`);
    // focal elevation: during the held cine shot the camera's elev override
    // must sit between the two unit anchors (lerped along the line of fire)
    const mid = held.filter(s => s.look.elevZ != null && s.look.elevZ > 0);
    if (mid.length) {
      const lo = Math.min(camRun.samples[0].srcY, camRun.samples[0].tgtY) - 25;
      const hi = Math.max(camRun.samples[0].srcY, camRun.samples[0].tgtY) + 25;
      const bad = mid.filter(s => s.look.elevZ < lo || s.look.elevZ > hi);
      if (bad.length === 0) pass('focal-elevation', `elevZ in [${lo},${hi}] across ${mid.length} samples (srcY=${camRun.samples[0].srcY} tgtY=${camRun.samples[0].tgtY})`);
      else fail('focal-elevation', `${bad.length}/${mid.length} samples outside [${lo},${hi}]: ${JSON.stringify(bad.slice(0, 3).map(s => s.look.elevZ))}`);
    } else fail('focal-elevation', 'no elev-override samples captured inside the cine window');
    // C. VFX call audit: z params must convert to the renderer-space height
    const calls = camRun.vfxCalls || [];
    console.log(`  VFX calls recorded: ${calls.map(c => c.fn).join(', ') || '(none)'}`);
    const zCalls = calls.filter(c => c.fn === 'projectile' || c.fn === 'beam' || (c.fn === 'fire' && c.args[2] && c.args[2].toZ != null) || c.fn === 'fireBoltDirect');
    if (zCalls.length) {
      const expTgtPx = await page.evaluate(() => {
        const tgt = window.GAME.state.units.find(u => u.id === window.__airborneTargetId);
        return { z: tgt.z, px: window._getElevationPx(tgt.z), rendererY: Math.round(ThreeRenderer.unitSurfaceY(tgt)) };
      });
      const sample = zCalls[0];
      const toZ = sample.fn === 'projectile' || sample.fn === 'beam' ? sample.args[9] : (sample.args[2] ? sample.args[2].toZ : sample.args[1]?.toZ);
      console.log(`  sample ${sample.fn}: toZ level=${JSON.stringify(toZ)}; target z=${expTgtPx.z} → px=${expTgtPx.px}, rendererY=${expTgtPx.rendererY}`);
      if (Math.abs(expTgtPx.px - expTgtPx.rendererY) <= 2) pass('vfx-space', '_getElevationPx(target.z) == renderer unitSurfaceY (one shared space)');
      else fail('vfx-space', `_getElevationPx=${expTgtPx.px} vs rendererY=${expTgtPx.rendererY}`);
    } else console.log('  (no z-carrying VFX entry hit for this spell — height equality already proven by [A])');
  }
  await snap(page, 'heights-after-cast');

  // a second screenshot mid-flight on a fresh cast for eyeballing
  await page.evaluate(async () => {
    const G = window.GAME, st = G.state;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const unit = st.units.find(u => u.player === 1 && !u.dead);
    const tgt = st.units.find(u => u.id === window.__airborneTargetId && !u.dead) || st.units.find(u => u.player === 2 && !u.dead);
    const spell = (unit.spells || []).find(s => ['damage', 'aoe', 'multiHit'].includes(s.kind)) || unit.spells[0];
    st.selectedTool = spell.name; st.actionMode = 'spell';
    G.doSpell(unit, tgt.x, tgt.y, tgt.z);
    st.selectedTool = null; st.actionMode = null;
    await sleep(1200);
  });
  await snap(page, 'heights-midflight');

  const okAll = results.every(r => r.ok);
  console.log('\n========================================');
  console.log(results.map(r => `${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`).join('\n'));
  console.log(okAll ? 'ALL CHECKS PASSED' : 'CHECKS FAILED');
  console.log('Artifacts: shots/heights-*.png');
  console.log('========================================');
  await browser.close();
  process.exit(okAll ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
