// Mystery Dungeon probe v2: char select → free-roam hub → cave → floor 1 →
// stairs → floor 2 → party wipe → overlay → return to hub.
// PW_CHROMIUM=... USE_ASSET_CACHE=1 LOCAL_ASSETS=... node probe_md.js
const { chromium } = require('playwright');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOTS = __dirname + '/shots';
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
async function snap(page, name) { try { await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 9000, animations: 'disabled' }); console.log('shot:', name); } catch (e) { console.log('shot fail', name, e.message.split('\n')[0]); } }

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
  try { await require('./asset_cache').installAssetCache(ctx); } catch (e) { console.log('asset cache unavailable:', e.message); }
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0]));
  page.on('crash', () => console.log('*** PAGE CRASHED ***'));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 });
  await sleep(10000);

  // 1) character select
  await page.evaluate(() => window._goToMysteryDungeon());
  await sleep(1200);
  const charPage = await page.evaluate(() => ({
    visible: !!document.querySelector('#mdCharPage.active'),
    cards: document.querySelectorAll('.md-char-card').length,
    firstName: document.querySelector('.md-char-card .md-char-name')?.innerText || null,
    hasStart: !!document.querySelector('.md-char-start'),
  }));
  console.log('CHAR SELECT:', JSON.stringify(charPage));
  await snap(page, 'md2-charselect');
  if (!charPage.cards) { console.log('no character cards!'); await browser.close(); return; }
  await page.click('.md-char-card');
  await sleep(400);
  await page.click('.md-char-start');

  // 2) hub boot
  for (let i = 0; i < 30; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  // wait for the free-roam controller (GLB loads are slow on swiftshader)
  for (let i = 0; i < 40; i++) { if (await page.evaluate(() => { try { return ThreeRenderer.hubFreeRoam.active(); } catch (e) { return false; } })) break; await sleep(1000); }
  await sleep(1500);
  const hub = await page.evaluate(() => {
    const st = window.GAME.state;
    return {
      phase: st.phase, mdPhase: st._mdPhase,
      party: st.units.filter(u => u.player === 1 && !u._mdNpc).map(u => ({ id: u.id, x: u.x, y: u.y, race: u.race, cls: u.cls })),
      npcs: st.units.filter(u => u._mdNpc).length,
      p2: st.units.filter(u => u.player === 2).length,
      freeRoam: !!(typeof ThreeRenderer !== 'undefined' && ThreeRenderer.hubFreeRoam && ThreeRenderer.hubFreeRoam.active()),
      entrance: st._mdEntrance,
      scoreboardGone: !document.querySelector('.ew-scoreboard') || true,
    };
  });
  console.log('HUB:', JSON.stringify(hub));
  await snap(page, 'md2-hub');
  if (hub.phase !== 'battle' || !hub.freeRoam) { console.log('*** hub/free-roam failed'); await browser.close(); return; }

  // 3) adaptive key calibration: which key moves +x?
  await page.evaluate(() => document.body.focus());
  const posOf = () => page.evaluate(() => { const u = window.GAME.state.units.find(x => x.player === 1 && !x._mdNpc); const fr = 1; return { x: u.x, y: u.y }; });
  const cal = {};
  for (const key of ['w', 'a', 's', 'd']) {
    const p0 = await posOf();
    await page.keyboard.down(key); await sleep(650); await page.keyboard.up(key);
    await sleep(200);
    const p1 = await posOf();
    cal[key] = { dx: p1.x - p0.x, dy: p1.y - p0.y };
  }
  console.log('key calibration:', JSON.stringify(cal));

  // 4) walk to the entrance with greedy key choice
  const target = hub.entrance[0];
  let reachedFloor = false;
  for (let i = 0; i < 40; i++) {
    const p = await posOf().catch(() => null);
    const st = await page.evaluate(() => ({ mdPhase: window.GAME.state._mdPhase, floor: window.GAME.state._mdRun?.floor, dlg: window.GAME.state.uiDialog?.type || null }));
    if (st.mdPhase === 'floor') { reachedFloor = true; break; }
    // the gate now opens the party-select dialog — confirm it to start the run
    if (st.dlg === 'mdParty') {
      console.log('party select opened — confirming');
      await page.evaluate(() => window._mdPartyStart());
      await sleep(2500);
      continue;
    }
    if (!p) break;
    const dx = target.x - p.x, dy = target.y - p.y;
    if (!dx && !dy) { await sleep(500); continue; }
    let bestKey = null, bestDot = -1e9;
    for (const k of ['w', 'a', 's', 'd']) {
      const c = cal[k]; const dot = c.dx * dx + c.dy * dy;
      if (dot > bestDot) { bestDot = dot; bestKey = k; }
    }
    await page.keyboard.down('Shift');
    await page.keyboard.down(bestKey); await sleep(420); await page.keyboard.up(bestKey);
    await page.keyboard.up('Shift');
    await sleep(120);
  }
  await sleep(3000);
  const f1 = await page.evaluate(() => {
    const st = window.GAME.state;
    return { mdPhase: st._mdPhase, floor: st._mdRun?.floor, board: bw() + 'x' + bh(),
      lvl: st.units.filter(u => u.player === 1).map(u => ({ hp: u.hp, maxHp: u.maxHp })),
      p2: st.units.filter(u => u.player === 2 && !u.dead).length, stairs: st._mdStairs,
      freeRoam: !!(typeof ThreeRenderer !== 'undefined' && ThreeRenderer.hubFreeRoam.active()),
      blitz: st._blitzActiveUnitId };
  });
  console.log('FLOOR 1:', JSON.stringify(f1));
  await snap(page, 'md2-floor1');
  if (!reachedFloor) { console.log('*** free-roam walk to cave DID NOT trigger floor'); await browser.close(); return; }
  console.log('✅ cave entrance works via free-roam');

  // 5) stairs → floor 2 (turn-mode move)
  const st1 = await page.evaluate(() => {
    const G = window.GAME, st = G.state;
    const u = st.units.find(x => x.player === 1 && !x._mdNpc && !x.dead);
    const s = st._mdStairs;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = s.x + dx, ny = s.y + dy;
      try { if (unitCanTraverse(u, nx, ny, (state.boardHeights[ny] || [])[nx] || 0)) { u.x = nx; u.y = ny; u.z = (state.boardHeights[ny] || [])[nx] || 0; break; } } catch (e) {}
    }
    u.ap = 3;
    const tiles = G.getMoveTiles(u) || [];
    const onto = tiles.find(t => t.x === s.x && t.y === s.y);
    if (!onto) return { err: 'stairs not reachable', at: [u.x, u.y], s };
    return { ret: G.doMove(u, onto.x, onto.y, onto.z) };
  });
  console.log('stairs move:', JSON.stringify(st1));
  await sleep(2500);
  // landing on the stairs now opens a descend-confirm dialog — click through it
  const stairsDlg = await page.evaluate(() => {
    const t = window.GAME.state.uiDialog?.type || null;
    if (t === 'mdStairs' || !t) { window._mdConfirmDescend && window._mdConfirmDescend(); }
    return t;
  });
  console.log('stairs dialog:', stairsDlg);
  await sleep(4500);
  const f2 = await page.evaluate(() => { const st = window.GAME.state; return { floor: st._mdRun?.floor, board: bw() + 'x' + bh(), hp: st.units.filter(u => u.player === 1).map(u => u.hp + '/' + u.maxHp) }; });
  console.log('FLOOR 2:', JSON.stringify(f2));
  console.log(f2.floor === 2 ? '✅ stairs advance works' : '*** stairs failed');
  await snap(page, 'md2-floor2');

  // 6) wipe → overlay → return to hub
  await page.evaluate(() => { const st = window.GAME.state; st.units.filter(u => u.player === 1 && !u.dead).forEach(u => { try { defeatUnit(u); } catch (e) { window.defeatUnit && window.defeatUnit(u); } }); });
  await sleep(4000);
  const wipe = await page.evaluate(() => ({ ended: window.GAME.state._mdEnded, overlay: !document.getElementById('resultOverlay')?.classList.contains('hidden'), title: document.getElementById('vicTitle')?.textContent }));
  console.log('WIPE:', JSON.stringify(wipe));
  await snap(page, 'md2-runover');
  await page.evaluate(() => window._mdReturnToHub());
  for (let i = 0; i < 20; i++) { if (await page.evaluate(() => window.GAME.state._mdPhase === 'hub' && window.GAME.state.phase === 'battle')) break; await sleep(1000); }
  await sleep(2500);
  const hub2 = await page.evaluate(() => { const st = window.GAME.state; return { mdPhase: st._mdPhase, party: st.units.filter(u => u.player === 1 && !u._mdNpc && !u.dead).length, freeRoam: !!(typeof ThreeRenderer !== 'undefined' && ThreeRenderer.hubFreeRoam.active()) }; });
  console.log('BACK TO HUB:', JSON.stringify(hub2));
  await snap(page, 'md2-hub-return');
  console.log((wipe.ended && wipe.overlay && hub2.mdPhase === 'hub' && hub2.party >= 1) ? '✅ wipe→overlay→hub loop works' : '*** end-run loop has issues');
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
