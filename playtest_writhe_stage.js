// playtest_writhe_stage.js — THE WRITHING TENTACLES, close up (2026-11-28; repo-only dev tooling, never uploaded to R2). The party
// builder's 3D stage (EWCharViewer) on a big box over the title page, no match: each race in RACES idles (several frames, to see the
// tentacles move by themselves), walks, and plays its attack, from the front, the side and the back (a drag turns the stage).
// GPU=webgpu (with EW_PROBE_HEADFUL=1 EW_PROBE_GL=webgpu xvfb-run -a) draws on WebGPU. FLAGS=EW_DISABLE_SWAY,... sets window flags first. Needs the server (npm start). LOCAL=<cdn url>=<local file>,... serves a model from disk before it is uploaded.
//   TAG=a RACES="octopus girl:female,kraken:male" node playtest_writhe_stage.js   -> shots/writhe/stage_<TAG>_*.png
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'shots', 'writhe'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'a';
const RACES = (process.env.RACES || 'octopus girl:female,kraken:male').split(',').map(x => x.split(':'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await require(path.join(__dirname, 'probe-fast.js')).launch(chromium, { headless: !process.env.EW_PROBE_HEADFUL, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((flags) => { for (const f of flags) { const [k, val] = f.split('='); window[k] = val === undefined ? true : (isNaN(+val) ? val : +val); } }, (process.env.FLAGS || '').split(',').filter(Boolean));
  const page = await ctx.newPage();
  for (const pair of (process.env.LOCAL || '').split(',').filter(Boolean)) { const [u, f] = pair.split('='); await page.route(u + '*', r => r.fulfill({ path: f, contentType: 'model/gltf-binary', headers: { 'Access-Control-Allow-Origin': '*' } })); }
  page.on('console', m => { const t = m.text(); if (/\[3D\]|sway|EW BUILD|WebGPU|renderer/i.test(t) || (m.type() === 'error' && !/Failed to load resource|ERR_|Raycaster/.test(t))) console.log('CON', t.slice(0, 260)); });
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0].slice(0, 240)));
  await page.goto('http://localhost:3000/' + (process.env.GPU ? '?ew_gpu=' + process.env.GPU : ''), { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 120; i++) { if (await page.evaluate(() => !!window.EWCharViewer && !!window.GAME).catch(() => false)) break; await sleep(1000); }
  await sleep(3000);
  if (process.env.EVAL) console.log('eval', await page.evaluate(process.env.EVAL));
  await page.evaluate(() => { const d = document.createElement('div'); d.id = 'wrStage'; d.style.cssText = 'position:fixed;left:190px;top:0;width:900px;height:900px;z-index:2147483000;background:#2b2f36'; document.body.appendChild(d); });
  const shot = async (name) => { await page.screenshot({ path: `${OUT}/stage_${TAG}_${name}.png`, clip: { x: 190, y: 0, width: 900, height: 900 } }); console.log('SHOT', name); };
  const turn = async (dx) => { await page.mouse.move(640, 450); await page.mouse.down(); for (let k = 1; k <= 10; k++) await page.mouse.move(640 + dx * k / 10, 450); await page.mouse.up(); };
  for (const [race, gender] of RACES) {
    const R = race.replace(/ /g, '_');
    console.log('mount', race, await page.evaluate(([r, g]) => { const d = document.getElementById('wrStage'); return window.EWCharViewer.isMounted() ? window.EWCharViewer.setCharacter(r, g) : window.EWCharViewer.mount(d, r, g); }, [race, gender]));
    for (let i = 0; i < 90; i++) { if (await page.evaluate(() => window.EWCharViewer.hasClips()).catch(() => false)) break; await sleep(1000); }
    await sleep(6000);
    for (let i = 0; i < 4; i++) { await shot(`${R}_idle_front_${i}`); await sleep(700); }
    await turn(131); await sleep(1500); for (let i = 0; i < 2; i++) { await shot(`${R}_idle_side_${i}`); await sleep(700); }
    await turn(131); await sleep(1500); for (let i = 0; i < 3; i++) { await shot(`${R}_idle_back_${i}`); await sleep(700); }
    await turn(-262); await sleep(800);
    console.log('walk', await page.evaluate(() => window.EWCharViewer.walk()));
    for (let i = 0; i < 3; i++) { await sleep(450); await shot(`${R}_walk_${i}`); }
    await page.evaluate(() => window.EWCharViewer.stopPreview()); await sleep(600);
    console.log('attack', await page.evaluate(() => window.EWCharViewer.play('attack', { full: true })));
    for (let i = 0; i < 3; i++) { await sleep(380); await shot(`${R}_attack_${i}`); }
    await sleep(2500);
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
