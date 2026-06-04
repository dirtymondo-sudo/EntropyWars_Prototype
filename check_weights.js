// Fast check: inject ainew.js right after the page loads (battle.js/ai.js present)
// and confirm the high-ground weight boost is live immediately — no match needed.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const AINEW = fs.readFileSync(path.join(__dirname, 'ainew.js'), 'utf8');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--no-sandbox','--disable-dev-shm-usage'] });
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 });
  await sleep(9000);
  const r = await page.evaluate((src) => {
    const g = window.GAME;
    const before = g && g.getAIWeight ? { r: g.getAIWeight('moveHighGroundRanged_v1'), m: g.getAIWeight('moveHighGroundMelee_v1'), jr: g.getAIWeight('jumpHighGroundRanged_v1') } : null;
    let injErr = null; try { (0, eval)(src); } catch (e) { injErr = e.message; }
    const after = g && g.getAIWeight ? { r: g.getAIWeight('moveHighGroundRanged_v1'), m: g.getAIWeight('moveHighGroundMelee_v1'), jr: g.getAIWeight('jumpHighGroundRanged_v1') } : null;
    return { injErr, wrapped: !!(g && g.__claudeHeightWrap), overridden: typeof window.aiTakeTurn === 'function', before, after };
  }, AINEW);
  console.log('Inject error:', r.injErr || 'none');
  console.log('aiTakeTurn overridden:', r.overridden, '| height-wrap active:', r.wrapped);
  console.log('moveHighGroundRanged_v1 : ', r.before && r.before.r, '→', r.after && r.after.r, '(stock 0.3)');
  console.log('moveHighGroundMelee_v1  : ', r.before && r.before.m, '→', r.after && r.after.m, '(stock 0.5)');
  console.log('jumpHighGroundRanged_v1 : ', r.before && r.before.jr, '→', r.after && r.after.jr, '(stock 12.756)');
  console.log('Page errors:', errs.length, errs.slice(0, 3).join(' | '));
  console.log(r.wrapped && r.after && r.after.r >= 3 ? '✅ BOOST LIVE' : '❌ boost NOT applied');
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
