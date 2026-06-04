// Validate ainew.js: inject it after ai.js, run an AI-vs-AI sim, and confirm
// (a) it loads without errors, (b) the high-ground boost is active, (c) units
// actually climb to elevated tiles, (d) the match progresses + kills happen.
// This uses dev auto-sim ON PURPOSE — we're testing the AI code, not UX.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const AINEW = fs.readFileSync(path.join(__dirname, 'ainew.js'), 'utf8');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox','--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const errs = [], logs = [];
  page.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  page.on('console', m => { const t = m.text(); if (/ainew|aiTakeTurn|focus|GAME API/i.test(t)) logs.push(t); });
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 });
  await sleep(9000);
  console.log('Game loaded. Validating ainew.js...');
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);
  await page.evaluate(() => { const el = [...document.querySelectorAll('.ms-map-card')].find(c => /8\s*[×xX]\s*8/.test(c.textContent || '')); if (el) el.click(); });
  await sleep(800);
  await page.evaluate(() => { const el = [...document.querySelectorAll('.ms-mode-card')].find(b => /death\s*match/i.test(b.textContent || '')); if (el) el.click(); });
  await sleep(800);
  await page.evaluate(() => { const b = document.querySelector('.ms-btn-primary') || [...document.querySelectorAll('button')].find(x => /CONFIRM/i.test(x.innerText)); if (b) b.click(); });
  await sleep(2200);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => /SEAL YOUR FATE/i.test(x.innerText)); if (b) b.click(); }); await sleep(1400); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  for (let i = 0; i < 30; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  console.log('[stage] battle started.');

  // Inject ainew.js AFTER ai.js is in place, then run AI vs AI.
  const injected = await page.evaluate((src) => {
    const hadBase = typeof window.aiTakeTurn === 'function';
    try { (0, eval)(src); } catch (e) { return { ok: false, err: e.message, hadBase }; }
    return { ok: true, hadBase, wrapped: !!(window.GAME && window.GAME.__claudeHeightWrap), overridden: typeof window.aiTakeTurn === 'function' };
  }, AINEW);
  console.log('Inject result:', JSON.stringify(injected));

  // Confirm the height-weight boost is live via GAME.getAIWeight.
  const weights = await page.evaluate(() => {
    const g = window.GAME; if (!g || !g.getAIWeight) return null;
    return { mvRanged: g.getAIWeight('moveHighGroundRanged_v1'), mvMelee: g.getAIWeight('moveHighGroundMelee_v1') };
  });
  console.log('High-ground weights after boost:', JSON.stringify(weights), '(stock was 0.3 / 0.5)');

  // Run AI vs AI for a while; sample max unit standing-height + kills each tick.
  await page.evaluate(() => { try { window.setDevAutoSim(true); } catch (e) {} });
  let maxH = 0, climbers = new Set();
  const start = Date.now();
  let last = -1;
  while (Date.now() - start < 150000) {
    const s = await page.evaluate(() => {
      const st = window.GAME.state, g = window.GAME;
      let mh = 0; const climbed = [];
      for (const u of st.units) { if (u.dead) continue; let h = 0; try { h = g.getUnitStandingHeight(u); } catch (e) {} if (h > mh) mh = h; if (h >= 2) climbed.push(u.cls + '@h' + h); }
      return { round: st.round, winner: st.winner, kills: st.matchKills, mh, climbed, alive1: st.units.filter(u => u.player === 1 && !u.dead).length, alive2: st.units.filter(u => u.player === 2 && !u.dead).length };
    }).catch(() => null);
    if (!s) { console.log('[renderer died during sim]'); break; }
    if (s.mh > maxH) maxH = s.mh;
    s.climbed.forEach(c => climbers.add(c));
    if (s.round !== last) { last = s.round; console.log(`R${s.round} kills=${JSON.stringify(s.kills)} alive ${s.alive1}v${s.alive2} maxStandH=${s.mh}`); }
    if (s.winner != null) { console.log('winner:', s.winner); break; }
    await sleep(1500);
  }

  console.log('\n==== ainew.js validation ====');
  console.log('Injected OK:', injected.ok, '| height-wrap active:', injected.wrapped);
  console.log('Max standing height reached by any unit:', maxH, '(>=2 means a unit grabbed real high ground)');
  console.log('Climbers seen:', [...climbers].slice(0, 10).join(', ') || 'none');
  console.log('[ainew] console logs:', logs.filter(l => /ainew/i.test(l)).slice(0, 4).join(' || ') || 'none');
  console.log('Page errors mentioning ai:', errs.filter(e => /ai|focus|height|GAME/i.test(e)).slice(0, 5).join(' || ') || 'none');
  console.log('Total page errors:', errs.length, errs.length ? '(first: ' + errs[0] + ')' : '');
  console.log('=============================');
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
