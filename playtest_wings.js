// playtest_wings.js — THE WINGS PROBE (THE LOOSE WINGS EVERYWHERE; RACES=fairy:female,angel:male … one staged after another)
// from playtest_occulus.js — THE OCCULUS PROBE (2026-11-27, repo-only dev tooling, never uploaded to R2). playtest_brain.js with the
// Occulus on P1: pictures of its idle, walk, attack, its own spells, a hit and its death, each with the live rig's numbers (the
// eye's look, the lids, the wing hinge and its three joints). Needs the server (npm start). Never run two probes at once.
//   TAG=a SHOTS=6 GAP=700 ZOOM=5 node playtest_occulus.js   -> shots/occulus/<TAG>_*.png + <TAG>.json
// Notes: docs/notes/champions-combat.md "THE OCCULUS: LOOSE WINGS, A LIVING EYE".
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const OUT = path.join(__dirname, 'shots', 'wings'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'run', MAP = process.env.MAP || '';
const FLAGS = (process.env.FLAGS || '').split(',').filter(Boolean);
const N = +(process.env.SHOTS || 8), GAP = +(process.env.GAP || 110), ZOOM = +(process.env.ZOOM || 6); const FACE = process.env.FACE || 'right';   // FACE=left: the unit's back to the camera (hanging wings)
const ACTS = (process.env.ACTS || 'idle,walk,attack,hit,death').split(',');
const RACES = (process.env.RACES || 'angel:female').split(',').map(x => x.split(':'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const READ = () => {
  const sc = ThreeRenderer.hq.dev.scene(), out = [], d = x => +(x * 57.3).toFixed(0), E = new THREE.Euler();
  sc.traverse(n => { if (n.name !== 'ewLW1' || !n.isBone) return; let v = true, h = null; for (let p = n; p; p = p.parent) { if (p.visible === false) v = false; if (!h && /^(ewGearWing[LR]|ewUniWing[LR]|ewwing_[LR])$/.test(p.name || '')) h = p; } if (!v || !h) return;
    const js = [n]; let c = n; for (let k = 2; k <= 3; k++) { c = c && c.children.find(x => x.name === 'ewLW' + k); if (c) js.push(c); }
    const eu = o => { E.setFromQuaternion(o.quaternion, 'YZX'); return [d(E.x), d(E.y), d(E.z)]; };
    out.push(h.name + ' ' + (h.userData.ewBeat || '') + ' h' + JSON.stringify(eu(h)) + ' j' + JSON.stringify(js.map(eu))); });
  return out;
};
(async () => {
  const browser = await require(path.join(REPO, 'probe-fast.js')).launch(chromium, { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((flags) => { try { localStorage.setItem('ew_cinematicActionCam', '0'); } catch (e) {} for (const f of flags) { const [k, val] = f.split('='); window[k] = val === undefined ? true : (isNaN(+val) ? val : +val); } }, FLAGS);
  const page = await ctx.newPage();
  page.on('console', m => { const t = m.text(); if (/animation library|PropertyBinding|unit gear|\[3D\]/.test(t) || (m.type() === 'error' && !/Raycaster/.test(t) && !/Failed to load resource|ERR_/.test(t))) console.log('CON', t.slice(0, 300)); });
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
      const mi = id ? MS_MAP_LIST.findIndex(x => x.modeId === id || x.id === id) : -1; if (mi >= 0) _msSelectedMap = mi;
      const gi = MS_GAME_MODES.findIndex(x => x.id === 'tdm'); if (gi >= 0) _msSelectedGM = gi;
      if (typeof window._msConfirm === 'function') { window._msConfirm(); return 'confirm map ' + mi; }
    } catch (e) { return 'err:' + e.message; }
    return 'none';
  }, MAP));
  await sleep(2500);
  const START = (RACES) => { const st = GAME.state; try { window.applyPartyBuild(false); } catch (e) {}
    st.partyMeta[1] = st.partyMeta[1] || [];
    RACES.forEach((r, i) => { st.partyMeta[1][i] = Object.assign({}, st.partyMeta[1][i] || st.partyMeta[1][0], { race: r[0], gender: r[1] || 'male' }); delete st.partyMeta[1][i].customSpells; delete st.partyMeta[1][i].appearance; });
    st.teamLockedIn = true; try { window.startMatch(); } catch (e) { return 'err ' + e.message; } return 'started ' + JSON.stringify(st.partyMeta[1].map(p => p.race)); };
  console.log('start', await page.evaluate(START, RACES));
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  { let ok = 0; for (let i = 0; i < 90 && ok < 5; i++) { await sleep(1000); const ph = await page.evaluate(() => GAME.state.phase); if (ph === 'battle') ok++; else { ok = 0; if (i % 8 === 7) { console.log('restart (phase ' + ph + ')'); await page.evaluate(START, RACES); } } } }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'local' }; });
  const LOADING = () => { const vis = e => e && e.offsetParent && getComputedStyle(e).opacity > 0.1; return [...document.querySelectorAll('.ls-status, .ls-hint')].some(vis) || [...document.querySelectorAll('div,span')].some(e => e.childElementCount === 0 && /TAP TO SKIP/.test(e.textContent) && vis(e)); };
  for (let i = 0; i < 480; i++) { if (!(await page.evaluate(LOADING).catch(() => true))) break; if (i % 30 === 0) console.log('loading…'); await sleep(1000); }
  await sleep(6000);
  console.log('spot', await page.evaluate(() => {
    const bw = GAME.bw(), bh = GAME.bh(); let best = null, bs = 1e9;
    for (let y = 1; y < bh - 1; y++) for (let x = Math.min(5, bw >> 1); x < bw - 1; x++) {
      let hs = [], bad = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -4; dx <= 2; dx++) { const X = x + dx, Y = y + dy; if (!GAME.isInside(X, Y)) { bad += 5; continue; } hs.push(getHeightAt(X, Y) || 0); try { if (getObjectAt(X, Y)) bad += 2; if (typeof isWaterTile === 'function' && isWaterTile(X, Y)) bad += 3; } catch (e) {} }
      const s = (Math.max(...hs) - Math.min(...hs)) * 4 + bad + Math.hypot(x - bw / 2, y - bh / 2) * 0.3;
      if (s < bs) { bs = s; best = { x, y }; }
    }
    window.__pgSpot = best || { x: bw >> 1, y: bh >> 1 }; return JSON.stringify(window.__pgSpot);
  }));
  /* the Point Guard at the spot, one foe three squares off, everybody else in a corner */
  const STAGE = ([zoom, race, face]) => { const st = GAME.state, P = window.__pgSpot, pg = st.units.find(u => u.player === 1 && u.race === race); window.__wgRace = race; if (!pg) return 'no boltzmann brain: ' + st.units.map(u => u.race).join(',');
    const foe = st.units.find(u => u.player === 2), put = (u, x, y) => { u.x = x; u.y = y; try { u.z = getHeightAt(x, y); } catch (e) {} };
    st.units.forEach(u => { u.dead = false; u._dying = false; u.maxHp = Math.max(u.maxHp, 6000); u.hp = u.maxHp; u.status = []; });
    put(pg, P.x - 3, P.y); put(foe, P.x, P.y); let k = 0; st.units.forEach(u => { if (u !== pg && u !== foe) put(u, u.player === 1 ? 0 : 1, k++ % 6); });
    pg.facing = (face || 'right'); st.controllers = { 1: 'local', 2: 'local' }; st._blitzActiveUnitId = pg.id; st.aiThinking = false; st.currentPlayer = 1; st._actionExecuting = false;
    try { ThreeRenderer.invalidateUnits(); GAME.markDirty(); GAME.renderIfDirty && GAME.renderIfDirty(); } catch (e) {}
    /* the battle camera frames the board by itself: the probe holds its own close view (CAM=0 leaves the game's) */
    clearInterval(window.__pgCam);
    window.__wgId = pg.id; try { st.cinematicActionCam = false; localStorage.setItem('ew_cinematicActionCam', '0'); } catch (e) {}
    if (zoom > 0) window.__pgCam = setInterval(() => { try { const u = GAME.state.units.find(q => q.id === pg.id); camera.snap({ _force: true, x: u.x, y: u.y }); camera.snap({ _force: true, zoom: zoom }); } catch (e) {} }, 120);
    return 'staged ' + pg.id + ' at ' + pg.x + ',' + pg.y; };
  await sleep(8000);
  const hideMenu = () => page.evaluate(() => { [...document.querySelectorAll('div,section,aside')].filter(e => e.childElementCount > 2 && /END TURN/.test(e.textContent || '') && e.getBoundingClientRect().width < innerWidth * 0.6).forEach(e => { e.style.visibility = 'hidden'; }); });
  const shot = async (name, waitMs) => {
    await page.evaluate((ms) => { window.__pgHeld = 0; setTimeout(() => { window.__ewHold = true; window.__pgHeld = performance.now(); }, ms); }, waitMs);
    for (let i = 0; i < 1600; i++) { if (await page.evaluate(() => window.__pgHeld > 0).catch(() => false)) break; await sleep(25); }
    const info = await page.evaluate(READ).catch(e => ({ err: e.message }));
    const a = await page.evaluate(() => { try { const u = GAME.state.units.find(q => q.id === window.__wgId); return ThreeRenderer.worldToScreen(u.x, u.y, 0); } catch (e) { return null; } }).catch(() => null);
    const cw = 520, ch = 440, clip = a ? { x: Math.max(0, Math.min(1280 - cw, a.x - cw / 2)), y: Math.max(0, Math.min(720 - ch, a.y - ch * 0.72)), width: cw, height: ch } : undefined;
    await hideMenu(); await page.screenshot({ path: `${OUT}/${TAG}_${name}.png`, clip });
    await page.evaluate(() => { if (window.__ewRelease) window.__ewRelease(); else window.__ewHold = false; });
    console.log('SHOT', name, JSON.stringify(info).slice(0, 300)); return info;
  };
  const rows = [];
  for (const RC of RACES) { const R = RC[0], RT = R.replace(/ /g, '_'); console.log(await page.evaluate(STAGE, [ZOOM, R, FACE])); await sleep(6000);
  for (const act of ACTS) {
    if (act === 'idle') { for (let i = 0; i < N; i++) rows.push([act, i, await shot(RT + '_idle_' + i, 400 + i * GAP)]);
      console.log('TRACE', R, JSON.stringify(await page.evaluate((READ) => new Promise(res => { const f = eval('(' + READ + ')'), out = [], t0 = performance.now(); const iv = setInterval(() => { const r = f(); out.push(Math.round(performance.now() - t0) + ' ' + (r[0] || '')); if (out.length >= 14) { clearInterval(iv); res(out); } }, 160); }), READ.toString())).slice(0, 2400)); continue; }
    console.log(await page.evaluate(STAGE, [ZOOM, R, FACE])); await sleep(2500);
    const r = await page.evaluate((act) => { const st = GAME.state, pg = st.units.find(u => u.player === 1 && u.race === window.__wgRace), foe = st.units.find(u => u.player === 2 && u.x === window.__pgSpot.x);
      pg.ap = 9; pg.mp = pg.maxMp = 999; pg._spellCooldowns = {}; pg._spellsUsedThisTurn = {}; pg.movesLeft = 9; pg.hasMoved = false; pg.hasAttacked = false;
      try {
        if (act === 'hit') { foe.ap = 9; foe.hasAttacked = false; foe.x = pg.x + 1; foe.y = pg.y; ThreeRenderer.invalidateUnits(); st._blitzActiveUnitId = foe.id; st.currentPlayer = 2; st.actionMode = 'attack'; const f = GAME.doAttack || window.doAttack; return 'hit ' + (f ? f(foe, pg.x, pg.y, pg.z) : 'none'); }
        if (act === 'death') { foe.ap = 9; foe.hasAttacked = false; pg.hp = 1; foe.x = pg.x + 1; foe.y = pg.y; ThreeRenderer.invalidateUnits(); st._blitzActiveUnitId = foe.id; st.currentPlayer = 2; st.actionMode = 'attack'; const f = GAME.doAttack || window.doAttack; return 'death ' + (f ? f(foe, pg.x, pg.y, pg.z) : 'none'); }
        if (act === 'walk') { st.actionMode = 'move'; const f = GAME.doMove || window.doMove; return 'move ' + (f ? f(pg, pg.x + 2, pg.y, pg.z) : 'none'); }
        if (act === 'attack') { pg.x = foe.x - 2; ThreeRenderer.invalidateUnits(); st.actionMode = 'attack'; const f = GAME.doAttack || window.doAttack; return 'attack ' + (f ? f(pg, foe.x, foe.y, foe.z) : 'none'); }
        const sp = JSON.parse(JSON.stringify(SPELL_BY_ID[act])); pg.spells = [sp]; pg._spellSlots = [act]; st.actionMode = 'spell'; st.selectedTool = sp.name;
        const self = !(sp.range > 0); return 'spell ' + GAME.doSpell(pg, self ? pg.x + 2 : foe.x, self ? pg.y : foe.y, foe.z);
      } catch (e) { return 'threw ' + e.message; } }, act);
    console.log('ACT', act, r);
    if (process.env.TRACE) {   // no pictures: the eye's lids / swell / stare sampled every 60 ms for TRACE ms
      const tr = await page.evaluate((ms) => new Promise(res => { const P = window.__ocN, t0 = performance.now(), out = []; const g = P.root.getObjectByName('ewOccGaze');
        const iv = setInterval(() => { const t = performance.now() - t0; out.push([Math.round(t), +P.look.position.z.toFixed(2), +P.eye.scale.x.toFixed(2), +g.scale.x.toFixed(2)]); if (t > ms) { clearInterval(iv); res(out); } }, 60); }), +process.env.TRACE);
      const mov = tr.filter(x => x[3] > 0.01 || x[1] !== 1 || Math.abs(x[2] - 1) > 0.06);
      console.log('TRACE', act, 'kind', await page.evaluate(() => JSON.stringify(GAME.state._castAnimKind)), 'moving', mov.length ? mov[0][0] + '..' + mov[mov.length - 1][0] + ' ms' : 'never', JSON.stringify(mov.filter((x, i) => i % 3 === 0)).slice(0, 700));
      await sleep(2500); continue;
    }
    /* the game runs slow here and a cast waits for its camera: a spell's pictures count from the moment its clip starts (the stare goes up) */
    const marks = process.env.MARKS ? process.env.MARKS.split(',').map(Number) : (act === 'walk' ? [150, 300, 450, 600] : [350, 700, 1100, 1700]);
    let last = 0; for (const m of marks) { rows.push([act, m, await shot(RT + '_' + act + '_' + m, m - last)]); last = m; }
    await sleep(3500);
  }
  }
  fs.writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(rows, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
