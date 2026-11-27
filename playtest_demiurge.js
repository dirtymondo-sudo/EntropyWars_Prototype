// playtest_demiurge.js — THE DEMIURGE PROBE (2026-11-27, repo-only dev tooling, never uploaded to R2).
// A real VS CPU match on a real map with both Demiurge forms on P1. Both seats are taken (no AI turn runs), the form
// that owns the spell is stood in range of a knot of three enemies and casts it through the real GAME.doSpell (cast
// animation, staging beats, action camera, numbers). One picture per mark in TIMES (c1200 = 1200 ms after the cast, h400 = 400 ms after the hit; a fresh cast per
// picture, because a held screenshot stops the frame loop but not the spell's timers). Needs the server (npm start).
// Never run two probes at once.
//   MAP=prebuilt_downtown_delta SPELLS=dmTesseract,dmGoldenSpiral TIMES=c800,c1500,h150,h600 TAG=a node playtest_demiurge.js
//   SPELLS=all · FIN=1 adds the finisher (the target is brought to 1 HP) · FLAGS=EW_NO_DEMI_VFX (the old looks)
//   -> shots/demi/<TAG>_<spell>_<ms>.png + <TAG>.json (frame times, the live signature count)
// Notes: docs/notes/spells-vfx.md "THE DEMIURGE'S CATACLYSMS".
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const OUT = path.join(__dirname, 'shots', 'demi'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'run';
const MAP = process.env.MAP || '';
const FLAGS = (process.env.FLAGS || '').split(',').filter(Boolean);
const ALL = ['dmSerpentStrike', 'dmCompassSweep', 'dmCornerstone', 'dmGoldenSpiral', 'dmVoidGaze', 'dmFractalBloom', 'dmAsAbove', 'dmTesseract'];
const SPELLS = (!process.env.SPELLS || process.env.SPELLS === 'all') ? ALL : process.env.SPELLS.split(',');
const TIMES = (process.env.TIMES || 'c700,c1500,h150,h500,h1100').split(',');
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* stand the caster and three enemies, hand over the spell, cast it. Returns what doSpell returned (its ms) or why not. */
const CAST = (a) => {
  const st = GAME.state, spellId = a.spellId;
  const sp0 = SPELL_BY_ID[spellId]; if (!sp0) return { err: 'no spell ' + spellId };
  const form = a.form || ((RACE_GENDER_SPELLS.demiurge.female.indexOf(spellId) >= 0) ? 'female' : 'male');
  const caster = st.units.find(u => u.player === 1 && u.race === 'demiurge' && (u.gender || 'male') === form);
  if (!caster) return { err: 'no ' + form + ' demiurge' };
  const foes = st.units.filter(u => u.player === 2).slice(0, 3);
  st.controllers = { 1: 'local', 2: 'local' };
  st.units.forEach(u => { u.dead = false; u._dying = false; u.maxHp = Math.max(u.maxHp, 6000); u.hp = u.maxHp; u.status = []; u.statuses && (u.statuses.length = 0); });
  const P = window.__dmSpots;
  const put = (u, x, y) => { u.x = x; u.y = y; try { u.z = getHeightAt(x, y); } catch (e) {} };
  /* the caster's distance: next to them for the sweep, else what the range allows (2 to 4) */
  const self = !!sp0.aoeOriginSelf, d = self ? 1 : Math.max(1, Math.min(3, (sp0.range || 2)));
  put(foes[0], P.x, P.y); if (foes[1]) put(foes[1], P.x, P.y + 1); if (foes[2]) put(foes[2], P.x, P.y - 1);
  put(caster, P.x - d, P.y);
  { let k = 0; st.units.forEach(u => { if (u !== caster && foes.indexOf(u) < 0) put(u, P.far.x + (u.player === 1 ? 0 : 1), P.far.y + (k++ % 3)); }); }   /* a real square: a body sent to NaN never comes back */
  if (a.fin) { foes[0].hp = 1; }
  try { ThreeRenderer.invalidateUnits(); GAME.markDirty(); GAME.renderIfDirty && GAME.renderIfDirty(); } catch (e) {}
  /* PIECE=1: the Unmade set piece alone on its own clock (no banner, no finisher): the cloud's 2 fps cannot keep a whole
     execution in step, so the folds and the lift are checked here */
  if (a.piece) {
    try { camera.moveTo({ x: foes[0].x, y: foes[0].y, zoom: (typeof getCloseZoom === 'function' ? getCloseZoom() : 1.4) * (a.zoom || 0.8), duration: 0, _fogAllowed: true }); } catch (e) {}
    const t00 = performance.now() - 2;
    const ok = window.ThreeVFXEffects.sigUnmade3D(caster.x, caster.y, foes[0].x, foes[0].y, { ms: 7400, cubeAt: 100, cageAt: 1000, foldAt: 2000, liftAt: 3400, hitAt: 4200 });
    return { ms: ok ? 1 : 0, form, at: t00 };
  }
  /* UNMADE=1: the finisher itself (the gauge is filled, the real doFinisher runs) */
  if (a.unmade) {
    foes[0].hp = 1;   /* a kill: the execution's whole ending */
    caster.ap = 9; st._blitzActiveUnitId = caster.id; st.aiThinking = false; st.currentPlayer = 1; st._actionExecuting = false;
    st.entropyGauge = st.entropyGauge || {}; st.entropyGauge[1] = 99999;
    let ok = false; try { ok = window.doFinisher(caster, foes[0].id); } catch (e) { return { err: 'finisher threw ' + e.message }; }
    return { ms: ok === false ? 0 : 1, form, at: performance.now(), fin: JSON.stringify(window.getFinisherFor && window.getFinisherFor(caster)) };
  }
  const sp = JSON.parse(JSON.stringify(sp0));
  caster.spells = [sp]; caster._spellSlots = [spellId]; caster._raceAbilities = [];
  caster.ap = 9; caster.mp = caster.maxMp = 999; caster._spellCooldowns = {}; caster._spellsUsedThisTurn = {};
  st._blitzActiveUnitId = caster.id; st.aiThinking = false; st.currentPlayer = 1;
  st.actionMode = 'spell'; st.selectedTool = sp.name;
  let ms = 0;
  try { ms = GAME.doSpell(caster, self ? caster.x : foes[0].x, self ? caster.y : foes[0].y, self ? caster.z : foes[0].z) || 0; } catch (e) { return { err: 'threw ' + e.message }; }
  return { ms, form, at: performance.now(), impact: (window._EW_LAST_CAST_BEATS && window._EW_LAST_CAST_BEATS.spellId === spellId) ? window._EW_LAST_CAST_BEATS.impactMs : 1800, caster: [caster.x, caster.y], foe: [foes[0].x, foes[0].y] };
};

(async () => {
  const browser = await require(path.join(REPO, 'probe-fast.js')).launch(chromium, { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((flags) => { try { localStorage.setItem('ew_cinematicActionCam', '1'); } catch (e) {} for (const f of flags) { const [k, val] = f.split('='); window[k] = val === undefined ? true : (isNaN(+val) ? val : +val); } }, FLAGS);
  const page = await ctx.newPage();
  page.on('console', m => { const t = m.text(); if (/\[DMX\]|SIG3D|\[VFX\]/.test(t) || (m.type() === 'error' && !/Raycaster/.test(t) && !/Failed to load resource|ERR_/.test(t))) console.log('CON', t.slice(0, 240)); });
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0].slice(0, 240)));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 120; i++) { if (await page.evaluate(() => typeof window._goToVsCpu === 'function' && !!window.GAME).catch(() => false)) break; await sleep(1000); }
  await sleep(4000);
  console.log('build', await page.evaluate(() => JSON.stringify(window.EW_BUILD || null)));
  await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; });
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);
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
  /* both forms on P1, then start */
  const START = () => { const st = GAME.state; try { window.applyPartyBuild(false); } catch (e) {}
    st.partyMeta[1] = st.partyMeta[1] || [];
    st.partyMeta[1][0] = Object.assign({}, st.partyMeta[1][0], { race: 'demiurge', gender: 'male' }); delete st.partyMeta[1][0].customSpells; delete st.partyMeta[1][0].appearance;
    st.partyMeta[1][1] = Object.assign({}, st.partyMeta[1][1], { race: 'demiurge', gender: 'female' }); delete st.partyMeta[1][1].customSpells; delete st.partyMeta[1][1].appearance;
    st.teamLockedIn = true; try { window.startMatch(); } catch (e) { return 'err ' + e.message; } return 'started'; };
  console.log('start', await page.evaluate(START));
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  { let ok = 0; for (let i = 0; i < 90 && ok < 5; i++) { await sleep(1000); const ph = await page.evaluate(() => GAME.state.phase); if (ph === 'battle') ok++; else { ok = 0; if (i % 8 === 7) { console.log('restart (phase ' + ph + ')'); await page.evaluate(START); } } } }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'local' }; });
  const LOADING = () => { const vis = e => e && e.offsetParent && getComputedStyle(e).opacity > 0.1; return [...document.querySelectorAll('.ls-status, .ls-hint')].some(vis) || [...document.querySelectorAll('div,span')].some(e => e.childElementCount === 0 && /TAP TO SKIP/.test(e.textContent) && vis(e)); };
  for (let i = 0; i < 480; i++) { if (!(await page.evaluate(LOADING).catch(() => true))) break; if (i % 30 === 0) console.log('loading…'); await sleep(1000); }
  await sleep(6000);
  console.log('units', await page.evaluate(() => JSON.stringify(GAME.state.units.map(u => [u.id, u.player, u.race, u.gender, u.x, u.y]))));
  /* an open spot: the flattest 5 x 3 patch near the middle of the board, and a far corner for the bystanders */
  console.log('spot', await page.evaluate(() => {
    const bw = GAME.bw(), bh = GAME.bh(); let best = null, bs = 1e9;
    for (let y = 1; y < bh - 1; y++) for (let x = Math.min(5, bw >> 1); x < bw - 1; x++) {
      let hs = [], bad = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -4; dx <= 2; dx++) { const X = x + dx, Y = y + dy; if (!GAME.isInside(X, Y)) { bad += 5; continue; } hs.push(getHeightAt(X, Y) || 0); try { if (getObjectAt(X, Y)) bad += 2; if (typeof isWaterTile === 'function' && isWaterTile(X, Y)) bad += 3; } catch (e) {} }
      const s = (Math.max(...hs) - Math.min(...hs)) * 4 + bad + Math.hypot(x - bw / 2, y - bh / 2) * 0.3;
      if (s < bs) { bs = s; best = { x, y }; }
    }
    if (!best) best = { x: bw >> 1, y: bh >> 1 };
    best.far = { x: 0, y: 0 };
    window.__dmSpots = best; return JSON.stringify([bw, bh, best, bs]);
  }));
  await page.evaluate(() => { let n = 0, t0 = performance.now(); const f = () => { n++; const t = performance.now(); if (t - t0 >= 1000) { window.__dmFps = Math.round(n * 1000 / (t - t0)); n = 0; t0 = t; } (window.__ewRawRaf || requestAnimationFrame)(f); }; f(); });
  const rows = [];
  const list = SPELLS.slice(); if (process.env.FIN) list.push('FIN'); if (process.env.UNMADE) list.push('UNMADE'); if (process.env.PIECE) list.push('PIECE');
  for (const id of list) {
    for (const T of TIMES) {
      const fin = id === 'FIN';
      if (id === 'PIECE') await page.evaluate(() => { const V = window.ThreeVFXEffects; if (V && !V.__dmWrapped) { V.__dmWrapped = true; const f = V.sigUnmade3D; V.sigUnmade3D = function () { window.__dmU = { t: performance.now(), o: arguments[4] }; return f.apply(this, arguments); }; } });
      const r = await page.evaluate(CAST, id === 'PIECE' ? { spellId: 'dmCornerstone', piece: true, zoom: +(process.env.ZOOM || 0.8) } : id === 'UNMADE' ? { spellId: 'dmCornerstone', unmade: true, form: process.env.FORM || 'male' } : { spellId: fin ? (process.env.FINSPELL || 'dmCornerstone') : id, fin });
      if (id === 'UNMADE') console.log('finisher', r.fin);
      if (r.err || !r.ms) { console.log('CAST FAIL', id, JSON.stringify(r)); break; }
      /* 'c1200' = 1200 ms after the cast, 'h400' = 400 ms after the real hit. The page itself parks its frame loop at that
         moment (probe-fast's hold), so the picture is the frame of that instant however slow the round trip is. */
      const kind = String(T)[0], val = +String(T).slice(1);
      await page.evaluate((a) => {
        window.__dmHeld = 0;
        const hold = () => { window.__ewHold = true; window.__dmHeld = performance.now(); };
        if (a.kind === 'c') { setTimeout(hold, Math.max(0, a.val - (performance.now() - a.at))); return; }
        if (a.kind === 'u') {   /* 'u2400' = 2400 ms into the Unmade set piece (its own clock: el) */
          const V = window.ThreeVFXEffects; if (V && !V.__dmWrapped) { V.__dmWrapped = true; const f = V.sigUnmade3D; V.sigUnmade3D = function () { window.__dmU = { t: performance.now(), o: arguments[4] }; return f.apply(this, arguments); }; }
          const iu = setInterval(() => { const U = window.__dmU; if ((U && U.t > a.at) || performance.now() - a.at > 30000) { clearInterval(iu); setTimeout(hold, Math.max(0, a.val - (U && U.t > a.at ? performance.now() - U.t : 0))); } }, 8);
          return;
        }
        const iv = setInterval(() => { const s = window.__dmxStat && window.__dmxStat(); if ((s && s.hit > a.at) || performance.now() - a.at > 12000) { clearInterval(iv); setTimeout(hold, Math.max(0, a.val - (s && s.hit > a.at ? performance.now() - s.hit : 0))); } }, 8);
      }, { kind, val, at: r.at });
      for (let i = 0; i < 1600; i++) { if (await page.evaluate(() => window.__dmHeld > 0).catch(() => false)) break; await sleep(25); }
      const info = await page.evaluate((at) => ({ held: Math.round(window.__dmHeld - at), fps: window.__dmFps, shot: camera._cineShotId, dmx: (window.__dmxStat ? window.__dmxStat() : null), dir: (window.SpellDirector && SpellDirector.log.length ? SpellDirector.log[SpellDirector.log.length - 1].beats : null) }), r.at);
      if (kind === 'u') console.log('unmade clock', await page.evaluate(() => JSON.stringify(window.__dmU && window.__dmU.o)));
      const pic = `${TAG}_${id}_${T}.png`;
      /* the probe's own caster is the active unit, so its command menu is up; a real cast has closed it */
      await page.evaluate(() => { const hit = [...document.querySelectorAll('div,section,aside')].filter(e => e.childElementCount > 2 && /END TURN/.test(e.textContent || '') && e.getBoundingClientRect().width < innerWidth * 0.6); hit.forEach(e => { e.style.visibility = 'hidden'; }); });
      await page.screenshot({ path: `${OUT}/${pic}` });
      await page.evaluate(() => { if (window.__ewRelease) window.__ewRelease(); else window.__ewHold = false; });
      rows.push({ id, T, ms: r.ms, est: r.impact, hitAfter: info.dmx && info.dmx.hit > r.at ? Math.round(info.dmx.hit - r.at) : null, pic, info }); console.log('SHOT', id, T, 'est', r.impact, 'hitAfter', rows[rows.length - 1].hitAfter, 'heldAt', info.held, 'fps', info.fps, JSON.stringify(info.dir));
      /* let the cast end before the next one */
      await sleep(3200);
      for (let i = 0; i < 40; i++) { if (await page.evaluate(() => camera._cineShotId == null && !GAME.state._execActive)) break; await sleep(250); }
      if (id === 'PIECE') await sleep(6000);
      if (id === 'UNMADE') { for (let i = 0; i < 160; i++) { if (await page.evaluate(() => !GAME.state._actionExecuting && camera._cineShotId == null)) break; await sleep(250); } await sleep(3000); }
    }
  }
  fs.writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(rows, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
