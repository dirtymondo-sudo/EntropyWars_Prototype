// playtest_deadtile.js — THE FALLEN ALLY'S SQUARE PROBE (2026-11-27, repo-only dev tooling, never uploaded to R2).
// A real VS CPU match: one P1 unit is killed by a real foe attack, then another P1 unit, the one acting, hovers, clicks and
// Inspects the square the body lies on with the real mouse. Each step checks the page still answers (a hang = HUNG).
//   TAG=a MAP=<id> node playtest_deadtile.js   -> shots/deadtile/<TAG>_*.png
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'shots', 'deadtile'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'run', MAP = process.env.MAP || '';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await require(path.join(__dirname, 'probe-fast.js')).launch(chromium, { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/Failed to load resource|ERR_|Raycaster/.test(t)) console.log('CON', t.slice(0, 400)); });
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n').slice(0, 4).join(' | ').slice(0, 600)));
  page.on('crash', () => console.log('PAGE CRASHED'));
  const alive = async (label) => {
    const r = await Promise.race([page.evaluate(() => ({ ph: GAME.state.phase, mode: GAME.state.actionMode, tile: JSON.stringify(GAME.state._tileActionTarget), sel: GAME.state.selectedUnitId, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null })).catch(e => 'ERR ' + e.message), sleep(30000).then(() => 'HUNG')]);
    console.log('ALIVE', label, JSON.stringify(r)); return r;
  };
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 120; i++) { if (await page.evaluate(() => typeof window._goToVsCpu === 'function' && !!window.GAME).catch(() => false)) break; await sleep(1000); }
  await sleep(4000);
  console.log('build', await page.evaluate(() => JSON.stringify(window.EW_BUILD || null)));
  await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; });
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);
  console.log('launch', await page.evaluate((id) => { try { const mi = id ? MS_MAP_LIST.findIndex(x => x.modeId === id || x.id === id) : -1; if (mi >= 0) _msSelectedMap = mi;
    const gi = MS_GAME_MODES.findIndex(x => x.id === 'tdm'); if (gi >= 0) _msSelectedGM = gi; window._msConfirm(); return 'ok ' + mi; } catch (e) { return 'err:' + e.message; } }, MAP));
  await sleep(2500);
  const START = () => { const st = GAME.state; try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) { return 'err ' + e.message; } return 'started'; };
  console.log('start', await page.evaluate(START));
  { let ok = 0; for (let i = 0; i < 120 && ok < 5; i++) { await sleep(1000); const ph = await page.evaluate(() => GAME.state.phase).catch(() => '?'); if (ph === 'battle') ok++; else { ok = 0; if (i % 10 === 9) await page.evaluate(START); } } }
  const LOADING = () => { const vis = e => e && e.offsetParent && getComputedStyle(e).opacity > 0.1; return [...document.querySelectorAll('.ls-status, .ls-hint')].some(vis); };
  for (let i = 0; i < 480; i++) { if (!(await page.evaluate(LOADING).catch(() => true))) break; await sleep(1000); }
  await sleep(8000);
  /* THE STORY SEAT (BAG=0 skips it): the party's one shared bag, bound the way a story fight's launch binds it (map.js
     _msConfirm sets state.partyBag, battle.js _partyBagBind hands every P1 body the SAME items object) */
  if (process.env.BAG !== '0') console.log('bag', await page.evaluate(() => { const st = GAME.state; st.partyBag = { seat: 1, items: { healPotion: 3, manaPotion: 2, panacea: 1 } };
    const n = window._partyBagBind(); const p1 = st.units.filter(u => u.player === 1); return 'bound ' + n + ' · shared ' + p1.every(u => u.items === st.partyBag.items); }));
  /* the kill: a P1 unit at 1 HP, a foe beside it attacks for real */
  console.log('kill', await page.evaluate(() => { const st = GAME.state; st.controllers = { 1: 'local', 2: 'local' };
    const p1 = st.units.filter(u => u.player === 1 && !u.dead), foe = st.units.find(u => u.player === 2 && !u.dead); if (p1.length < 2 || !foe) return 'not enough units';
    const victim = p1[1], put = (u, x, y) => { u.x = x; u.y = y; try { u.z = getHeightAt(x, y); } catch (e) {} };
    window.__dtVictim = victim.id; window.__dtActor = p1[0].id;
    put(foe, victim.x + 1, victim.y); foe.ap = 9; foe.hasAttacked = false; victim.hp = 1; ThreeRenderer.invalidateUnits();
    st._blitzActiveUnitId = foe.id; st.currentPlayer = 2; st.actionMode = 'attack';
    const r = (GAME.doAttack || window.doAttack)(foe, victim.x, victim.y, victim.z); return 'attack ' + r + ' victim ' + victim.id + ' @' + victim.x + ',' + victim.y; }));
  await sleep(6000);
  console.log('dead?', await page.evaluate(() => { const v = GAME.state.units.find(u => u.id === window.__dtVictim); return v ? JSON.stringify({ dead: v.dead, dying: v._dying, x: v.x, y: v.y, items: v.items }) : 'gone from units'; }));
  /* the actor stands beside the body, its turn, nothing armed */
  const STAGE = () => { const st = GAME.state, v = st.units.find(u => u.id === window.__dtVictim), a = st.units.find(u => u.id === window.__dtActor);
    const foe = st.units.find(u => u.player === 2 && !u.dead); if (foe) { foe.x = Math.max(0, v.x + 4); try { foe.z = getHeightAt(foe.x, foe.y); } catch (e) {} }
    a.x = v.x; a.y = v.y + 1; if (!GAME.isInside(a.x, a.y)) a.y = v.y - 1; try { a.z = getHeightAt(a.x, a.y); } catch (e) {}
    a.ap = 9; a.hasMoved = false; a.hasAttacked = false; a.movesLeft = 9; st._blitzActiveUnitId = a.id; st.activePlayer = 1; st.currentPlayer = 1; st.aiThinking = false; st._actionExecuting = false; st.actionMode = null;
    try { selectUnit(a.id); } catch (e) {} ThreeRenderer.invalidateUnits(); GAME.markDirty(); try { GAME.renderIfDirty(); } catch (e) {}
    return 'actor ' + a.id + ' @' + a.x + ',' + a.y + ' body @' + v.x + ',' + v.y; };
  console.log(await page.evaluate(STAGE));
  await sleep(4000);
  const screenOf = () => page.evaluate(() => { const v = GAME.state.units.find(u => u.id === window.__dtVictim); const p = ThreeRenderer.worldToScreen(v.x, v.y, 0); const c = document.getElementById('threeCanvas').getBoundingClientRect(); return p ? { x: p.x + c.left, y: p.y + c.top } : null; });
  let p = await screenOf(); console.log('body on screen', JSON.stringify(p));
  if (!p) p = { x: 640, y: 360 };
  await page.mouse.move(p.x - 30, p.y - 10); await sleep(300); await page.mouse.move(p.x, p.y, { steps: 5 }); await sleep(2500);
  await alive('hover'); await page.screenshot({ path: `${OUT}/${TAG}_1_hover.png` });
  await page.mouse.click(p.x, p.y); await sleep(3000);
  await alive('click no mode');
  /* the pointer's square may be the next one over (the body's model stands in front): the board's own click handler on the body's square */
  console.log('tile menu on', await page.evaluate(() => { const st = GAME.state, v = st.units.find(u => u.id === window.__dtVictim), t = st._tileActionTarget;
    if (!t || t.x !== v.x || t.y !== v.y) { st._tileActionTarget = null; clickTile(v.x, v.y, v.z); }
    return JSON.stringify(st._tileActionTarget); }));
  await sleep(2000); await alive('menu on the body'); await page.screenshot({ path: `${OUT}/${TAG}_2_click.png` });
  const menu = await page.evaluate(() => [...document.querySelectorAll('.hrlg-blade')].map(e => e.textContent.trim().slice(0, 40)).slice(0, 20)).catch(e => 'ERR ' + e.message);
  console.log('menu', JSON.stringify(menu));
  /* the menu's Inspect row, for real */
  const ins = await page.evaluate(() => { const b = [...document.querySelectorAll('.hrlg-blade')].find(e => /Inspect/.test(e.textContent)); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }).catch(() => null);
  console.log('inspect row', JSON.stringify(ins));
  if (ins) { const t0 = Date.now(); const done = await Promise.race([page.mouse.click(ins.x, ins.y).then(() => "clicked"), sleep(60000).then(() => "HUNG: the click did not come back in 60 s")]); console.log("INSPECT CLICK", done, (Date.now() - t0) + " ms"); if (/HUNG/.test(done)) { await browser.close().catch(() => {}); process.exit(2); } await sleep(2500); await alive('inspect row'); await page.screenshot({ path: `${OUT}/${TAG}_3_inspectrow.png` });
    p = (await screenOf()) || p; await page.mouse.move(p.x, p.y, { steps: 4 }); await sleep(1500); await alive('inspect hover'); await page.mouse.click(p.x, p.y); await sleep(4000); await alive('inspect click'); await page.screenshot({ path: `${OUT}/${TAG}_4_inspected.png` }); }
  else { console.log(await page.evaluate(() => { try { const a = GAME.state.units.find(u => u.id === window.__dtActor), v = GAME.state.units.find(u => u.id === window.__dtVictim); return 'doInspect ' + doInspect(a, v.x, v.y); } catch (e) { return 'threw ' + e.stack; } })); await sleep(3000); await alive('doInspect'); }
  console.log('log', JSON.stringify(await page.evaluate(() => (GAME.state.log || GAME.state.battleLog || []).slice(-6).map(l => l.text || l)).catch(() => null)));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
