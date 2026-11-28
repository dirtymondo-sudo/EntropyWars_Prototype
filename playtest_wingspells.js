// playtest_wingspells.js — THE WING SPELL PROBE (2026-11-28, repo-only dev tooling, never uploaded to R2).
// A real VS CPU board; Player 1's first unit is RACE (a winged unit), set on flat ground with a foe and a friend beside it, the
// camera held close. Each spell in ACTS is cast through the real doSpell and pictured at MARKS ms after the cast (the frame is held
// while the picture is taken). Built for the Harpy + the Moth Queen (their wing moves + looks). Needs the server (npm start).
//   RACE="moth queen" ACTS=mqScaleDust,mqPorchLight MARKS=400,900,1500,2200 ZOOM=5 TILT=35 TAG=mq node playtest_wingspells.js
//   -> shots/wingspells/<TAG>_<spell>_<ms>.png + <TAG>.json (the wing hinge's turn at each picture, the cast's log)
// POSE=mantle,beacon: no spell, the named wing moves alone (ThreeRenderer.wingAct, 4 s each) on the idle unit.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const OUT = path.join(REPO, 'shots', 'wingspells'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'ws', MAP = process.env.MAP || '', RACE = process.env.RACE || 'harpy', GENDER = process.env.GENDER || 'female';
const ACTS = (process.env.ACTS || '').split(',').filter(Boolean), POSE = (process.env.POSE || '').split(',').filter(Boolean);
const FLAGS = (process.env.FLAGS || '').split(',').filter(Boolean);
const ZOOM = +(process.env.ZOOM || 5), TILT = +(process.env.TILT || 35);
const MARKS = (process.env.MARKS || '400,900,1500,2200').split(',').map(Number);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const READ = () => {
  const u = GAME.state.units.find(x => x.id === window.__wsId); if (!u) return { err: 'no unit' };
  const d = x => +(x * 57.3).toFixed(0), out = { x: u.x, y: u.y, mp: u.mp, hp: u.hp };
  try { const e = ThreeRenderer.hq.dev.scene(); let L = null; const ent = window.__wsRoot && window.__wsRoot.parent ? window.__wsRoot : null;
    if (!ent) { e.traverse(n => { if (n.name === 'ewwing_L' && !L) { let v = true; for (let p = n; p; p = p.parent) if (p.visible === false) v = false; if (v) L = n; } }); window.__wsRoot = L; }
    const W = window.__wsRoot; if (W) { const E = new THREE.Euler().setFromQuaternion(W.quaternion, 'YZX'); out.hinge = [d(E.x), d(E.y), d(E.z)]; } } catch (e) { out.rerr = e.message; }
  try { out.anim = ThreeRenderer.debugUnitAnim ? ThreeRenderer.debugUnitAnim(u.id) : undefined; } catch (e) {}
  return out;
};
(async () => {
  const browser = await require(path.join(REPO, 'probe-fast.js')).launch(chromium, { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((flags) => { try { localStorage.setItem('ew_cinematicActionCam', flags.indexOf('NOCINE') >= 0 ? '0' : '1'); } catch (e) {} for (const f of flags) { const [k, val] = f.split('='); window[k] = val === undefined ? true : (isNaN(+val) ? val : +val); } }, FLAGS);
  const page = await ctx.newPage();
  page.on('console', m => { const t = m.text(); if (/animation library|PropertyBinding|unit gear|\[3D\]/.test(t) || (m.type() === 'error' && !/Raycaster/.test(t) && !/Failed to load resource|ERR_/.test(t))) console.log('CON', t.slice(0, 300)); });
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0].slice(0, 240)));
  await page.goto('http://localhost:3000/' + (process.env.QUERY || ''), { waitUntil: 'load', timeout: 120000 });
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
    st.partyMeta[1][0] = Object.assign({}, st.partyMeta[1][0], { race: window.__wsRace, gender: window.__wsGender }); delete st.partyMeta[1][0].customSpells; delete st.partyMeta[1][0].appearance;
    st.teamLockedIn = true; try { window.startMatch(); } catch (e) { return 'err ' + e.message; } return 'started'; };
  await page.evaluate(([r, g]) => { window.__wsRace = r; window.__wsGender = g; }, [RACE, GENDER]);
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
  /* the caster at the spot, one foe `gap` squares off (east), one friend two squares north, everybody else in a corner */
  const STAGE = ([zoom, tilt, gap, moon]) => { const st = GAME.state, P = window.__pgSpot, pg = st.units.find(u => u.player === 1 && u.race === window.__wsRace); if (!pg) return 'no ' + window.__wsRace + ': ' + st.units.map(u => u.race).join(',');
    window.__wsId = pg.id;
    const foes = st.units.filter(u => u.player === 2), pal = st.units.find(u => u.player === 1 && u !== pg), put = (u, x, y) => { u.x = x; u.y = y; try { u.z = getHeightAt(x, y); } catch (e) {} };
    st.units.forEach(u => { u.dead = false; u._dying = false; u.maxHp = Math.max(u.maxHp, 6000); u.hp = u.maxHp; u.status = {}; u._stHold = {}; delete u._moonSrcId; u.mp = u.maxMp = Math.max(u.maxMp || 0, 400); });
    put(pg, P.x - 3, P.y); put(foes[0], P.x - 3 + gap, P.y); if (foes[1]) put(foes[1], P.x - 3 + gap, P.y + 1); if (pal) { put(pal, P.x - 3, P.y - 2); pal.hp = Math.round(pal.maxHp * 0.6); }
    let k = 0; st.units.forEach(u => { if (u !== pg && u !== foes[0] && u !== foes[1] && u !== pal) put(u, u.player === 1 ? 0 : 1, k++ % 4); });
    if (moon) { try { applyStatusPayload(foes[0], { id: 'moonstruck', duration: 3 }, '', pg); if (foes[1]) applyStatusPayload(foes[1], { id: 'moonstruck', duration: 3 }, '', pg); } catch (e) { return 'moon err ' + e.message; } }
    pg.facing = 'right'; st.controllers = { 1: 'local', 2: 'local' }; st._blitzActiveUnitId = pg.id; st.aiThinking = false; st.currentPlayer = 1; st._actionExecuting = false;
    try { ThreeRenderer.invalidateUnits(); GAME.markDirty(); GAME.renderIfDirty && GAME.renderIfDirty(); } catch (e) {}
    clearInterval(window.__pgCam);
    if (zoom > 0) window.__pgCam = setInterval(() => { try { const u = GAME.state.units.find(q => q.id === pg.id), c = camera; c.x = c._tx = u.x + (window.__pgDx || 0); c.y = c._ty = u.y + (window.__pgDy || 0); c.zoom = c._tz = window.__wsZoom || zoom; c.tilt = c._tt = window.__wsTilt != null ? window.__wsTilt : tilt; if (window.__wsYaw != null) c.yaw = c._tyaw = window.__wsYaw; } catch (e) {} }, 30);
    return 'staged ' + pg.id + ' at ' + pg.x + ',' + pg.y + ' foe ' + foes[0].race + ' pal ' + (pal && pal.race); };
  console.log(await page.evaluate(STAGE, [ZOOM, TILT, 1, false]));
  await sleep(14000);   // the round banner goes
  const hideMenu = () => page.evaluate(() => { [...document.querySelectorAll('div,section,aside')].filter(e => e.childElementCount > 2 && /END TURN/.test(e.textContent || '') && e.getBoundingClientRect().width < innerWidth * 0.6).forEach(e => { e.style.visibility = 'hidden'; }); });
  const shot = async (name, waitMs, view, vo) => {
    await page.evaluate((ms) => { window.__pgHeld = 0; setTimeout(() => { window.__ewHold = true; window.__pgHeld = performance.now(); }, ms); }, waitMs);
    for (let i = 0; i < 1600; i++) { if (await page.evaluate(() => window.__pgHeld > 0).catch(() => false)) break; await sleep(25); }
    const info = await page.evaluate(READ).catch(e => ({ err: e.message }));
    if (view != null) console.log('VIEW', await page.evaluate(([yaw, shift, dist]) => { try {
      const r = ThreeRenderer.hq.dev.renderer(), sc = ThreeRenderer.hq.dev.scene(), W = window.__wsRoot; if (!W || !r) return 'no wing root';
      let model = W; while (model.parent && !(model.userData && model.userData.ewWings)) model = model.parent;
      const wp = W.getWorldPosition(new THREE.Vector3()), mp = model.getWorldPosition(new THREE.Vector3()), q = model.getWorldQuaternion(new THREE.Quaternion());
      const H = Math.max(0.2, wp.y - mp.y) / 0.78, f = new THREE.Vector3(0, 0, 1).applyQuaternion(q).setY(0).normalize(), rt = new THREE.Vector3(1, 0, 0).applyQuaternion(q).setY(0).normalize();
      const a = yaw * Math.PI / 180, c = new THREE.Vector3(wp.x, mp.y + H * 0.62, wp.z).addScaledVector(f, H * (shift || 0)), D = 3.4 * (dist || 1), cam = window.__wsCam || (window.__wsCam = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, H * 0.05, H * 400));
      cam.position.copy(c).addScaledVector(f, Math.cos(a) * H * D).addScaledVector(rt, Math.sin(a) * H * D); cam.position.y += H * 0.55 * (dist || 1) * (window.__wsHigh || 1); cam.lookAt(c); cam.updateMatrixWorld(true);
      r.setRenderTarget && r.setRenderTarget(null); r.render(sc, cam); return 'H ' + H.toFixed(2);
    } catch (e) { return 'view err ' + e.message; } }, [view, vo && vo.shift, vo && vo.dist]));
    await hideMenu(); await page.screenshot({ path: `${OUT}/${TAG}_${name}.png` });
    await page.evaluate(() => { if (window.__ewRelease) window.__ewRelease(); else window.__ewHold = false; });
    console.log('SHOT', name, JSON.stringify(info)); return info;
  };
  const rows = [];
  /* POSE=name[@yaw]: the move is started afresh for each picture (the picture at m ms = the move at m ms of 4 s), drawn from the
     probe's own camera in front of the unit (yaw 0 = straight on, 90 = from its side, 180 = from behind) */
  for (const pz of POSE) {
    const [pose, pyw] = pz.split('@');
    for (const m of (process.env.PMARKS || '1500').split(',').map(Number)) {
      const ok = await page.evaluate((n) => ThreeRenderer.wingAct(window.__wsId, n, 4000), pose);
      rows.push([pz, m, ok, await shot('pose_' + pz.replace(/@/g, '-') + '_' + m, m, +(pyw || 0))]); await sleep(300);
    }
  }
  /* FX=burst:hpSnatch,windup:hpQuillStorm,geom:hmCarry,self:hpShriek: a look fired by itself on the staged pair (the foe one square in
     front of her; `self:` = a burst on her own square), started afresh for each picture, from the probe's camera at her side */
  for (const fx of (process.env.FX || '').split(',').filter(Boolean)) {
    const [kind, id] = fx.split(':');
    for (const m of (process.env.FMARKS || '350,900').split(',').map(Number)) {
      const r = await page.evaluate(([kind, id]) => { try { const st = GAME.state, pg = st.units.find(u => u.id === window.__wsId), foe = st.units.filter(u => u.player === 2).sort((a, b) => Math.hypot(a.x - pg.x, a.y - pg.y) - Math.hypot(b.x - pg.x, b.y - pg.y))[0];
        const V = window.ThreeVFXEffects, T = kind === 'self' ? pg : foe, P = { tx: T.x, ty: T.y, sx: pg.x, sy: pg.y, uid: pg.id, holdMs: 700 };
        if (kind === 'geom') return 'geom ' + V.fireGeometry(id, kind === 'geom' && /Porch|Snatch/.test(id) ? pg.x : foe.x, kind === 'geom' && /Porch|Snatch/.test(id) ? pg.y : foe.y, 2, { owner: 1, uid: foe.id, from: /Snatch/.test(id) ? { x: foe.x, y: foe.y } : { x: foe.x + 2, y: foe.y }, qx: pg.x, qy: pg.y, ms: 500 });
        return kind + ' ' + V.fire(kind === 'self' ? 'burst' : kind, id, P); } catch (e) { return 'threw ' + e.message; } }, [kind, id]);
      rows.push([fx, m, r, await shot('fx_' + id + '_' + kind + '_' + m, m, +(process.env.FYAW || 90), { shift: kind === 'self' ? 0 : 0.5, dist: +(process.env.FDIST || 1.5) })]); await sleep(900);
    }
  }
  for (const act of ACTS) {
    const sp0 = await page.evaluate((a) => { const s = SPELL_BY_ID[a]; return s ? { range: s.range || 0, self: !!s.aoeOriginSelf || !!s.mqPorch, heal: s.type === 'heal', porch: !!s.mqPorch } : null; }, act);
    if (!sp0) { console.log('no spell', act); continue; }
    const gap = sp0.porch ? 4 : sp0.self ? 1 : Math.max(1, Math.min(3, sp0.range));
    await page.evaluate((g) => { window.__pgDx = g / 2; }, sp0.heal ? 0 : gap);
    console.log(await page.evaluate(STAGE, [ZOOM, TILT, gap, sp0.porch || /Eclipse/.test(act)])); await sleep(3000);
    const L0 = await page.evaluate(() => GAME.state.logEntries.length);
    const r = await page.evaluate(([act, heal, self]) => { const st = GAME.state, pg = st.units.find(u => u.id === window.__wsId), foe = st.units.filter(u => u.player === 2).sort((a, b) => Math.hypot(a.x - pg.x, a.y - pg.y) - Math.hypot(b.x - pg.x, b.y - pg.y))[0], pal = st.units.find(u => u.player === 1 && u !== pg && Math.abs(u.x - pg.x) + Math.abs(u.y - pg.y) <= 3);
      pg.ap = 9; pg._spellCooldowns = {}; pg._spellsUsedThisTurn = {}; pg.movesLeft = 9; pg.hasMoved = false; pg.hasAttacked = false;
      try { const sp = JSON.parse(JSON.stringify(SPELL_BY_ID[act])); pg.spells = [sp]; pg._spellSlots = [act]; st.actionMode = 'spell'; st.selectedTool = sp.name;
        const t = self ? pg : heal ? pal : foe; return 'spell ' + GAME.doSpell(pg, t.x, t.y, t.z) + ' on ' + t.race; } catch (e) { return 'threw ' + e.message; } }, [act, sp0.heal, sp0.self]);
    console.log('ACT', act, r);
    let last = 0; for (const m of MARKS) { rows.push([act, m, await shot(act + '_' + m, m - last, process.env.VIEW != null ? +process.env.VIEW : undefined)]); last = m; }
    await sleep(3500);
    const logs = await page.evaluate((n) => GAME.state.logEntries.slice(n).map(e => typeof e === 'string' ? e : e.m).slice(0, 10), L0);
    console.log('LOG', act, JSON.stringify(logs)); rows.push([act, 'log', logs, r]);
  }
  fs.writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify(rows, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
