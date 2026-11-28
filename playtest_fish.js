// playtest_fish.js — THE DEEP SEA FISH PROBE (2026-11-28, repo-only dev tooling, never uploaded to R2). playtest_brain.js for the
// Deep Sea Fish in pieces: a real VS CPU match, the camera close on it; pictures of its idle, swim, bite, Lure, Abyss Jaws, a hit
// taken and its death, each with numbers read from the live rig (the jaw, the head, the lure, the jellyfish, a fin, two tail joints,
// the lure's tip and a barbel's tip against their roots). Needs the server (npm start). Never run two probes at once.
//   TAG=a SHOTS=4 GAP=900 ZOOM=5 node playtest_fish.js   -> shots/fish/<TAG>_*.png + <TAG>.json
// Notes: docs/notes/champions-combat.md "THE DEEP SEA FISH IN PIECES".
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const OUT = path.join(__dirname, 'shots', 'fish'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'run', MAP = process.env.MAP || '';
const FLAGS = (process.env.FLAGS || '').split(',').filter(Boolean);
const N = +(process.env.SHOTS || 8), GAP = +(process.env.GAP || 110), ZOOM = +(process.env.ZOOM || 6);
const ACTS = (process.env.ACTS || 'idle,walk,attack,sigLure,sigAbyssJaws,hit,death').split(',');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const READ = () => {
  const sc = ThreeRenderer.hq.dev.scene();
  if (!window.__dfN || !window.__dfN.jaw.parent) { let jaw = null; sc.traverse(n => { if (n.name === 'ewDfJaw' && n.parent && !jaw) { let v = true; for (let p = n; p; p = p.parent) if (p.visible === false) v = false; if (v) jaw = n; } });
    if (jaw) { let root = jaw; while (root.parent && root.name !== 'ewDfBody') root = root.parent; const g = n => root.getObjectByName(n);
      window.__dfN = { jaw, body: root, head: g('ewDfHead'), lure: g('ewDfLure'), jelly: g('ewDfJelly'), finL: g('ewDfFinL'), t3: g('ewDfTail3'), t8: g('ewDfTail8'), tip: g('ewsway_c0_5'), s0: g('ewsway_c0_0'), b6: g('ewsway_c1_6'), b0: g('ewsway_c1_0') }; } }
  const P = window.__dfN; if (!P) return { err: 'no rig' };
  const V = new THREE.Vector3(), W = new THREE.Vector3(), d = x => +(x * 57.3).toFixed(0), E = (o, k) => o ? d(new THREE.Euler().setFromQuaternion(o.quaternion, 'YXZ')[k]) : null;
  const u = GAME.state.units.find(x => x.player === 1 && x.race === 'deep sea fish');
  const rel = (a, b) => { if (!a || !b) return null; P.body.worldToLocal(a.getWorldPosition(V)); P.body.worldToLocal(b.getWorldPosition(W)); return [+(V.x - W.x).toFixed(3), +(V.y - W.y).toFixed(3), +(V.z - W.z).toFixed(3)]; };
  let mats = {}; P.body.parent.traverse(m => { if (m.isMesh || m.isSkinnedMesh) mats[(m.material && m.material.type) || '?'] = (mats[(m.material && m.material.type) || '?'] || 0) + 1; });
  return { jawOpen: E(P.jaw, 'x'), headNod: E(P.head, 'x'), lureOut: E(P.lure, 'x'), lureYaw: E(P.lure, 'y'), jelly: +P.jelly.scale.x.toFixed(2), finL: E(P.finL, 'y'), tail3: E(P.t3, 'y'), tail8: E(P.t8, 'y'), tail8curl: E(P.t8, 'x'),
    bodyY: +P.body.position.y.toFixed(3), bodyZ: +P.body.position.z.toFixed(3), bodyRoll: E(P.body, 'z'), lureTip: rel(P.tip, P.s0), barbelTip: rel(P.b6, P.b0), mats, hp: u && Math.round(u.hp), dead: u && !!u.dead };
};
(async () => {
  const browser = await require(path.join(REPO, 'probe-fast.js')).launch(chromium, { headless: !process.env.EW_PROBE_HEADFUL, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((flags) => { try { localStorage.setItem('ew_cinematicActionCam', '1'); } catch (e) {} for (const f of flags) { const [k, val] = f.split('='); window[k] = val === undefined ? true : (isNaN(+val) ? val : +val); } }, FLAGS);
  const page = await ctx.newPage();
  page.on('console', m => { const t = m.text(); if (/animation library|PropertyBinding|unit gear|\[3D\]/.test(t) || (m.type() === 'error' && !/Raycaster/.test(t) && !/Failed to load resource|ERR_/.test(t))) console.log('CON', t.slice(0, 300)); });
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0].slice(0, 240)));
  await page.goto('http://localhost:3000/' + (process.env.GPU ? '?ew_gpu=' + process.env.GPU : ''), { waitUntil: 'load', timeout: 120000 });
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
  const START = () => { const st = GAME.state; try { window.applyPartyBuild(false); } catch (e) {}
    st.partyMeta[1] = st.partyMeta[1] || [];
    st.partyMeta[1][0] = Object.assign({}, st.partyMeta[1][0], { race: 'deep sea fish', gender: 'male' }); delete st.partyMeta[1][0].customSpells; delete st.partyMeta[1][0].appearance;
    st.teamLockedIn = true; try { window.startMatch(); } catch (e) { return 'err ' + e.message; } return 'started'; };
  console.log('start', await page.evaluate(START));
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  { let ok = 0; for (let i = 0; i < 90 && ok < 5; i++) { await sleep(1000); const ph = await page.evaluate(() => GAME.state.phase); if (ph === 'battle') ok++; else { ok = 0; if (i % 8 === 7) { console.log('restart (phase ' + ph + ')'); await page.evaluate(START); } } } }
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
  const STAGE = (zoom) => { const st = GAME.state, P = window.__pgSpot, pg = st.units.find(u => u.player === 1 && u.race === 'deep sea fish'); if (!pg) return 'no deep sea fish: ' + st.units.map(u => u.race).join(',');
    const foe = st.units.find(u => u.player === 2), put = (u, x, y) => { u.x = x; u.y = y; try { u.z = getHeightAt(x, y); } catch (e) {} };
    st.units.forEach(u => { u.dead = false; u._dying = false; u.maxHp = Math.max(u.maxHp, 6000); u.hp = u.maxHp; u.status = []; });
    put(pg, P.x - 3, P.y); put(foe, P.x, P.y); let k = 0; st.units.forEach(u => { if (u !== pg && u !== foe) put(u, u.player === 1 ? 0 : 1, k++ % 4); });
    pg.facing = 'right'; st.controllers = { 1: 'local', 2: 'local' }; st._blitzActiveUnitId = pg.id; st.aiThinking = false; st.currentPlayer = 1; st._actionExecuting = false;
    try { ThreeRenderer.invalidateUnits(); GAME.markDirty(); GAME.renderIfDirty && GAME.renderIfDirty(); } catch (e) {}
    /* the battle camera frames the board by itself: the probe holds its own close view (CAM=0 leaves the game's) */
    clearInterval(window.__pgCam);
    if (zoom > 0) window.__pgCam = setInterval(() => { try { const u = GAME.state.units.find(q => q.id === pg.id), c = camera; c.x = c._tx = u.x + (window.__pgDx || 0); c.y = c._ty = u.y + (window.__pgDy || 0); c.zoom = c._tz = zoom; c.tilt = c._tt = window.__pgTilt || 40; } catch (e) {} }, 30);
    return 'staged ' + pg.id + ' at ' + pg.x + ',' + pg.y; };
  console.log(await page.evaluate(STAGE, ZOOM));
  await sleep(14000);   // the round banner goes
  const hideMenu = () => page.evaluate(() => { [...document.querySelectorAll('div,section,aside')].filter(e => e.childElementCount > 2 && /END TURN/.test(e.textContent || '') && e.getBoundingClientRect().width < innerWidth * 0.6).forEach(e => { e.style.visibility = 'hidden'; }); });
  const shot = async (name, waitMs) => {
    await page.evaluate((ms) => { window.__pgHeld = 0; setTimeout(() => { window.__ewHold = true; window.__pgHeld = performance.now(); }, ms); }, waitMs);
    for (let i = 0; i < 1600; i++) { if (await page.evaluate(() => window.__pgHeld > 0).catch(() => false)) break; await sleep(25); }
    const info = await page.evaluate(READ).catch(e => ({ err: e.message }));
    await hideMenu(); await page.screenshot({ path: `${OUT}/${TAG}_${name}.png` });
    await page.evaluate(() => { if (window.__ewRelease) window.__ewRelease(); else window.__ewHold = false; });
    console.log('SHOT', name, JSON.stringify(info)); return info;
  };
  const rows = [];
  for (const act of ACTS) {
    if (act === 'idle') { for (let i = 0; i < N; i++) rows.push([act, i, await shot('idle_' + i, 400 + i * GAP)]); continue; }
    console.log(await page.evaluate(STAGE, ZOOM)); await sleep(2500);
    const r = await page.evaluate((act) => { const st = GAME.state, pg = st.units.find(u => u.player === 1 && u.race === 'deep sea fish'), foe = st.units.find(u => u.player === 2 && u.x === window.__pgSpot.x);
      pg.ap = 9; pg.mp = pg.maxMp = 999; pg._spellCooldowns = {}; pg._spellsUsedThisTurn = {}; pg.movesLeft = 9; pg.hasMoved = false; pg.hasAttacked = false;
      try {
        if (act.indexOf('slot:') === 0) return 'slot ' + ThreeRenderer.strikeRT.playAnim(pg.id, [act.slice(5)]);
        if (act === 'hit') { foe.ap = 9; foe.hasAttacked = false; foe.x = pg.x + 1; foe.y = pg.y; ThreeRenderer.invalidateUnits(); st._blitzActiveUnitId = foe.id; st.currentPlayer = 2; st.actionMode = 'attack'; const f = GAME.doAttack || window.doAttack; return 'hit ' + (f ? f(foe, pg.x, pg.y, pg.z) : 'none'); }
        if (act === 'death') { foe.ap = 9; foe.hasAttacked = false; pg.hp = 1; foe.x = pg.x + 1; foe.y = pg.y; ThreeRenderer.invalidateUnits(); st._blitzActiveUnitId = foe.id; st.currentPlayer = 2; st.actionMode = 'attack'; const f = GAME.doAttack || window.doAttack; return 'death ' + (f ? f(foe, pg.x, pg.y, pg.z) : 'none'); }
        if (act === 'walk') { st.actionMode = 'move'; const f = GAME.doMove || window.doMove; return 'move ' + (f ? f(pg, pg.x + 2, pg.y, pg.z) : 'none'); }
        if (act === 'attack') { pg.x = foe.x - 1; ThreeRenderer.invalidateUnits(); st.actionMode = 'attack'; const f = GAME.doAttack || window.doAttack; return 'attack ' + (f ? f(pg, foe.x, foe.y, foe.z) : 'none'); }
        const sp = JSON.parse(JSON.stringify(SPELL_BY_ID[act])); pg.spells = [sp]; pg._spellSlots = [act]; st.actionMode = 'spell'; st.selectedTool = sp.name;
        pg.x = foe.x - Math.min(2, sp.range || 1); ThreeRenderer.invalidateUnits(); const self = !(sp.range > 0); return 'spell ' + GAME.doSpell(pg, self ? pg.x + 2 : foe.x, self ? pg.y : foe.y, foe.z);
      } catch (e) { return 'threw ' + e.message; } }, act);
    console.log('ACT', act, r);
    setTimeout(async () => { try { console.log('LOG', act, await page.evaluate(() => JSON.stringify(GAME.state.logEntries.slice(-3).map(e => String(e.text || e.msg || e.html || e).replace(/<[^>]+>/g, '').slice(0, 110))))); } catch (e) {} }, 2500);
    if (process.env.SERIES) { const ser = []; const t0 = Date.now(); while (Date.now() - t0 < +process.env.SERIES) { const q = await page.evaluate(READ).catch(() => null); if (q) ser.push([Date.now() - t0, q.jawOpen, q.lureOut, q.bodyZ, q.bodyRoll, q.jelly, q.tail8curl].join('/')); await sleep(40); } console.log('SERIES', act, 'ms/jaw/lure/bodyZ/roll/jelly/curl', ser.join(' ')); await sleep(2000); continue; }
    const marks = act.indexOf('slot:') === 0 ? (process.env.SMARKS || '150,350,550,750,950,1150').split(',').map(Number) : process.env.MARKS ? process.env.MARKS.split(',').map(Number) : (act === 'walk' ? [150, 300, 450, 600] : [350, 700, 1100, 1700]);
    let last = 0; for (const m of marks) { rows.push([act, m, await shot(act.replace(':', '_') + '_' + m, m - last)]); last = m; }
    await sleep(3500);
  }
  fs.writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(rows, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
