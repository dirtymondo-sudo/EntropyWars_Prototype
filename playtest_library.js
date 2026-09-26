// playtest_library.js — SPELL LIBRARY v2 screenshot probe (repo tooling, SPELL_LIBRARY_PLAN.md §8, 2026-09-26).
// Boots the title with the LOCAL R2 files, enters the main menu → Settings → Developer → SPELL LIBRARY
// (window._goToSpellLibrary), then photographs the shell: the table, a two-key sort, a selected row +
// the inspector on every tab, THE GRID (a preset, a drawn cell, a mirror, clear) and THE LOOK (the stage, the
// animation search, a slot pick, a verb pick, back to auto), an edit through window._slbSetField (the row patches in place), the
// rail filters, the cards view, PASSIVES / FAMILIES / UPGRADES / POOLS / REPORT, the NEW ▾ menu, the
// EXPORT preview, the IMPORT diff and the palette → shots/library/<tag>_<moment>.png. Prints page
// errors, the table's window (rows rendered vs rows filtered) and the shell's geometry.
// The CDN is blocked in this sandbox: GLBs / audio never load, which the library does not need.
//   npm start   (server on :3000)
//   NODE_USE_ENV_PROXY=1 node playtest_library.js [tag]
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const crypto = require('crypto');
const LOCAL = new Set(['sprites.js', 'data.js', 'three-renderer.js', 'map.js', 'ui.js', 'battle.js', 'state.js', 'audio.js', 'hud.js', 'three-post.js',
  'styles-base.css', 'styles-hud.css', 'styles-cinematic.css', 'styles-animations.css', 'styles-editor.css']);
const HOSTS = new Set(['cdn.entropywars.net', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'cdn.socket.io', 'fonts.googleapis.com', 'fonts.gstatic.com']);
const CACHE = path.join(REPO, '.asset-cache'); fs.mkdirSync(CACHE, { recursive: true });
const CT = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.obj': 'text/plain', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
/* This environment's network policy blocks the CDNs outright (CONNECT 403), so the probe serves
   what it can from the repo + node_modules (three r128 + its examples, React UMD, socket.io from
   the server) and hands every blocked IMAGE a flat placeholder PNG (tinted by URL hash) so lit
   materials keep their colour instead of sampling an empty texture. GLBs/audio/video are aborted:
   the door shows its procedural stand-in and the Sedan is absent — verify those by position. */
const PNG1 = (() => {
  // 8x8 mid-grey PNG built by hand (zlib stored block)
  const zlib = require('zlib');
  const w = 8, h = 8, raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 150; raw[o + 1] = 150; raw[o + 2] = 150; } }
  const crc = (buf) => { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
})();
async function installNodeFetchCache(context) {
  let hits = 0, misses = 0, fails = 0, local = 0, stubs = 0;
  const NM = path.join(REPO, 'node_modules');
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    if (u.host === 'fonts.googleapis.com' || u.host === 'fonts.gstatic.com') return route.continue();
    const base = path.basename(u.pathname), ext = path.extname(base).toLowerCase();
    const ct = CT[ext] || 'application/octet-stream';
    const serve = (file) => { local++; return route.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(file) }); };
    if (u.host === 'cdn.entropywars.net' && fs.existsSync(path.join(REPO, base)) && /\.(js|css)$/.test(base)) return serve(path.join(REPO, base));
    // the five shared animation libraries have repo copies (CI reads them) — serve them so THE LOOK's RAW CLIPS list fills
    if (u.host === 'cdn.entropywars.net' && /^\/Assets\/Models\/(UAL\d_Standard|MAL\d_Sniper)\.glb$/.test(u.pathname)) {
      for (const f of [path.join(REPO, 'rigged_animations', 'Assets_Models_' + base), path.join(REPO, 'rigged_animations', base), path.join(REPO, base)]) if (fs.existsSync(f)) return serve(f);
    }
    if (u.host === 'cdn.entropywars.net' && base === 'react.production.min.js') return serve(path.join(NM, 'react/umd/react.production.min.js'));
    if (u.host === 'cdn.entropywars.net' && base === 'react-dom.production.min.js') return serve(path.join(NM, 'react-dom/umd/react-dom.production.min.js'));
    if (u.host === 'cdnjs.cloudflare.com' && base === 'three.min.js') return serve(path.join(NM, 'three/build/three.min.js'));
    if (u.host === 'cdn.jsdelivr.net' && /^\/npm\/three@0\.128\.0\//.test(u.pathname)) { const f = path.join(NM, 'three', u.pathname.replace(/^\/npm\/three@0\.128\.0\//, '')); if (fs.existsSync(f)) return serve(f); }
    if (u.host === 'cdn.socket.io') { try { const r = await fetch('http://localhost:3000/socket.io/socket.io.js'); local++; return route.fulfill({ status: 200, contentType: 'application/javascript', body: Buffer.from(await r.arrayBuffer()) }); } catch (e) {} }
    const key = crypto.createHash('md5').update(u.origin + u.pathname).digest('hex').slice(0, 12) + '_' + base;
    const file = path.join(CACHE, key);
    if (fs.existsSync(file)) { hits++; return route.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(file) }); }
    if (!HOSTS.has(u.host)) return route.abort();
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error('http ' + r.status);
      const buf = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(file, buf); misses++;
      return route.fulfill({ status: 200, contentType: ct, body: buf });
    } catch (e) {
      fails++;
      if (/\.(png|jpg|jpeg|webp)$/.test(ext)) { stubs++; return route.fulfill({ status: 200, contentType: 'image/png', body: PNG1 }); }
      return route.abort();
    }
  });
  return { stats: () => ({ hits, misses, fails, local, stubs }) };
}
const tag = process.argv[2] || 'lib';
const OUT = path.join(REPO, 'shots/library'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(exe) ? exe : undefined,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*', '--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: +(process.env.PW_W || 1600), height: +(process.env.PW_H || 900) } });
  const cache = await installNodeFetchCache(context);
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { const t = m.text(); if (/error/i.test(t) && !/net::|Failed to load resource/.test(t)) console.log('  console:', t.slice(0, 200)); });
  await page.addInitScript(() => { window.EW_DISABLE_DOOR_IDENT = true; window.EW_DISABLE_INTRO_CINE = true; try { localStorage.setItem('ew_hq', 'off'); localStorage.setItem('ew_menu3d', 'off'); localStorage.removeItem('ew_spell_mods'); } catch (e) {} });
  await page.goto('http://localhost:3000/?nohq&nomenu3d', { waitUntil: 'commit', timeout: 70000 });
  { const t0 = Date.now(); let ok = false;
    while (Date.now() - t0 < 180000) {
      let last = null;
      try { last = await page.evaluate(() => [document.readyState, typeof window._goToSpellLibrary, !!window.GAME]); } catch (e) { last = ['nav']; }
      if (last[0] === 'complete' && last[1] === 'function' && last[2]) { ok = true; break; }
      await sleep(1000);
    }
    if (!ok) { console.log('boot timed out'); await browser.close(); process.exit(1); } }
  await sleep(800);
  await page.evaluate(() => { try { window.enterGameFromTitle && window.enterGameFromTitle(); } catch (e) {} });
  await sleep(800);
  await page.evaluate(() => window._goToSpellLibrary());
  await sleep(1500);
  const shot = async (name) => { const f = path.join(OUT, `${tag}_${name}.png`); await page.screenshot({ path: f }); console.log('  shot', f); };
  const q = (sel, fn) => page.evaluate(([s, f]) => { const el = document.querySelector(s); if (!el) return null; return (new Function('el', 'return (' + f + ')(el)'))(el); }, [sel, fn.toString()]);
  const click = async (sel, opts) => { const h = await page.$(sel); if (!h) { console.log('  MISSING', sel); return false; } await h.click(opts || {}); return true; };
  const state = () => page.evaluate(() => ({
    page: [...document.querySelectorAll('.title-page.active')].map(p => p.id).join(','),
    shell: !!document.getElementById('slbShell'),
    rows: document.querySelectorAll('#slbTableBody .slb2-tr').length,
    count: (document.querySelector('#slbChips .slb2-count') || {}).textContent || null,
    sel: (document.querySelector('#slbInsHead .slb2-ins-name') || {}).value || (document.querySelector('#slbInsHead .slb2-ins-name') || {}).textContent || null,
    tab: (document.querySelector('.slb2-tab.on') || {}).textContent || null,
  }));
  console.log('state:', JSON.stringify(await state()));
  await shot('table');
  // a two-key sort: TIER ascending then DMG descending (shift-click)
  await click('#slbTableHead .slb2-th[data-key="tier"]'); await sleep(200);
  await click('#slbTableHead .slb2-th[data-key="dmg"]', { modifiers: ['Shift'] }); await sleep(200);
  await click('#slbTableHead .slb2-th[data-key="dmg"]', { modifiers: ['Shift'] }); await sleep(200);
  console.log('sort text:', await q('#slbChips .slb2-sorttxt', el => el.textContent));
  await shot('sorted');
  // select a row → the inspector
  await page.fill('#slbSearch', 'fire1'); await sleep(400); await click('#slbTableBody .slb2-tr[data-id="fire1"]'); await sleep(400); await page.fill('#slbSearch', ''); await sleep(300);
  console.log('state:', JSON.stringify(await state()));
  await shot('inspector_stats');
  for (const t of ['target', 'effects', 'upgrades', 'look', 'notes', 'raw']) {
    if (await click(`#slbInspector .slb2-itab[data-tab="${t}"]`)) { await sleep(250); await shot('inspector_' + t); }
  }
  // THE GRID (Phase 2): the TARGET tab's 7×7 editor — a preset, a drawn cell, a mirror, the readout
  await click('#slbInspector .slb2-itab[data-tab="target"]'); await sleep(250);
  console.log('grid before:', JSON.stringify(await page.evaluate(() => ({ cells: document.querySelectorAll('#slbInsBody .slb2-gcell').length, on: document.querySelectorAll('#slbInsBody .slb2-gcell.on').length, drawn: !!document.querySelector('#slbInsBody .slb2-gridwrap.drawn'), label: (document.querySelector('#slbInsBody .slb2-grid-l') || {}).textContent }))));
  await click('#slbInsBody [data-act="gridPreset"][data-preset="x2"]'); await sleep(350);
  await shot('grid_preset_x2');
  { const cell = await page.$('#slbInsBody .slb2-gcell[data-gx="2"][data-gy="0"]'); if (cell) { await cell.click(); await sleep(350); } }
  await click('#slbInsBody [data-act="gridXform"][data-op="mirrorY"]'); await sleep(350);
  console.log('grid after:', JSON.stringify(await page.evaluate(() => ({ on: document.querySelectorAll('#slbInsBody .slb2-gcell.on').length, drawn: !!document.querySelector('#slbInsBody .slb2-gridwrap.drawn'), label: (document.querySelector('#slbInsBody .slb2-grid-l') || {}).textContent, mask: JSON.stringify(window.SPELL_BY_ID.fire1.aoeMask), aoeRadius: window.SPELL_BY_ID.fire1.aoeRadius, lint: (typeof spellLint === 'function' ? spellLint(window.SPELL_BY_ID.fire1, spellLintContext()).map(h => h.rule) : null), foot: (typeof getSpellAoeFootprint === 'function' ? getSpellAoeFootprint(window.SPELL_BY_ID.fire1, 5, 5, { x: 2, y: 2 }).length : null), edits: (document.querySelector('#slbModCount') || {}).textContent }))));
  await shot('grid_drawn');
  await click('#slbInsBody [data-act="gridClear"]'); await sleep(300);
  console.log('grid cleared:', JSON.stringify(await page.evaluate(() => ({ mask: window.SPELL_BY_ID.fire1.aoeMask, on: document.querySelectorAll('#slbInsBody .slb2-gcell.on').length }))));
  // THE LOOK (Phase 2): the stage + the animation list — search, pick a slot, pick a verb, back to auto
  await click('#slbInspector .slb2-itab[data-tab="look"]'); await sleep(1500);
  console.log('look:', JSON.stringify(await page.evaluate(() => ({ stage: !!document.getElementById('slbLookStage'), canvas: !!document.querySelector('#slbLookStage canvas'), stageCls: (document.getElementById('slbLookStage') || {}).className, race: (document.querySelector('[data-input="lookRace"]') || {}).value, opts: document.querySelectorAll('#slbAnimList .slb2-anim-opt').length, groups: [...document.querySelectorAll('#slbAnimList .slb2-anim-grp')].map(g => g.textContent), pick: (document.getElementById('slbLookPick') || {}).textContent }))));
  await shot('look_stage');
  await page.fill('#slbInsBody .slb2-anim-search', 'thrust'); await sleep(300);
  await shot('look_search');
  await click('#slbAnimList .slb2-anim-opt[data-pick-kind="slot"][data-pick="castThrust"]'); await sleep(500);
  console.log('picked slot:', JSON.stringify(await page.evaluate(() => ({ animSlot: window.SPELL_BY_ID.fire1.animSlot, animVerb: window.SPELL_BY_ID.fire1.animVerb, kind: classifySpellAnimKind(window.SPELL_BY_ID.fire1), chain: window.ThreeRenderer && window.ThreeRenderer.castChainFor(classifySpellAnimKind(window.SPELL_BY_ID.fire1)), pick: (document.getElementById('slbLookPick') || {}).textContent, state: (document.getElementById('slbLookState') || {}).textContent }))));
  await shot('look_picked');
  await page.fill('#slbInsBody .slb2-anim-search', ''); await sleep(300);
  await click('#slbAnimList .slb2-anim-opt[data-pick-kind="verb"][data-pick="drain"]'); await sleep(400);
  console.log('picked verb:', JSON.stringify(await page.evaluate(() => ({ animSlot: window.SPELL_BY_ID.fire1.animSlot, animVerb: window.SPELL_BY_ID.fire1.animVerb, kind: classifySpellAnimKind(window.SPELL_BY_ID.fire1) }))));
  await click('#slbAnimList .slb2-anim-opt[data-pick-kind="auto"]'); await sleep(400);
  console.log('back to auto:', JSON.stringify(await page.evaluate(() => ({ animSlot: window.SPELL_BY_ID.fire1.animSlot, animVerb: window.SPELL_BY_ID.fire1.animVerb, kind: classifySpellAnimKind(window.SPELL_BY_ID.fire1), edits: (document.querySelector('#slbModCount') || {}).textContent }))));
  await click('#slbInspector .slb2-itab[data-tab="stats"]'); await sleep(200);
  // an edit through the Lab's contract → the row patches in place, the chrome shows 1 edit
  await page.evaluate(() => window._slbSetField('fire1', 'dmg', '55', 'num'));
  await sleep(400);
  console.log('after edit:', JSON.stringify(await page.evaluate(() => ({
    cell: (document.querySelector('#slbTableBody .slb2-tr[data-id="fire1"] .slb2-td-dmg') || {}).textContent,
    edits: (document.querySelector('#slbModCount') || {}).textContent,
    undo: !!document.querySelector('#slbTop [data-act="undo"]:not([disabled])'),
    mods: window.EWSpellMods && window.EWSpellMods.counts && window.EWSpellMods.counts(),
  }))));
  await shot('edited');
  await page.evaluate(() => window._slbUndo && window._slbUndo()); await sleep(300);
  console.log('after undo:', await q('#slbTableBody .slb2-tr[data-id="fire1"] .slb2-td-dmg', el => el.textContent));
  // the rail: a role chip + a tier chip
  await click('#slbRail .slb2-fchip[data-key="roles"][data-val="damage"]'); await sleep(250);
  await click('#slbRail .slb2-fchip[data-key="tiers"][data-val="3"]'); await sleep(250);
  console.log('filtered:', JSON.stringify(await state()));
  await shot('filtered');
  await click('#slbChips [data-act="clearFilters"]'); await sleep(250);
  // the search
  await page.fill('#slbSearch', 'wall of'); await sleep(400);
  console.log('search:', JSON.stringify(await state()));
  await shot('search');
  await page.fill('#slbSearch', ''); await sleep(300);
  // cards
  await click('#slbChips [data-act="view"][data-view="cards"]'); await sleep(400);
  await shot('cards');
  await click('#slbChips [data-act="view"][data-view="table"]'); await sleep(300);
  // the NEW ▾ menu
  if (await click('#slbChips [data-act="newMenu"]')) { await sleep(250); await shot('new_menu'); await page.keyboard.press('Escape'); await sleep(200); }
  // the top tabs
  for (const t of ['passives', 'families', 'upgrades', 'pools', 'report']) {
    if (await click(`#slbTop .slb2-tab[data-tab="${t}"]`)) { await sleep(500); await shot('tab_' + t); }
  }
  await click('#slbTop .slb2-tab[data-tab="spells"]'); await sleep(400);
  // EXPORT preview, IMPORT diff, the palette
  if (await click('#slbTop [data-act="export"]')) { await sleep(500); await shot('export'); await page.keyboard.press('Escape'); await sleep(200); }
  await page.setInputFiles('#slbImportFile', { name: 'probe.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 2, modified: { fire1: { dmg: 70 } }, added: { probeBolt: { name: 'Probe Bolt', kind: 'attack', element: 'plasma', tier: 2, dmg: 40, range: 4 } } })) });
  await sleep(700); await shot('import'); await page.keyboard.press('Escape'); await sleep(200);
  await page.keyboard.press('Control+k'); await sleep(300); await shot('palette'); await page.keyboard.press('Escape'); await sleep(200);
  // geometry + the narrow layout
  const geo = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; }; return { shell: r('#slbShell'), top: r('#slbTop'), rail: r('#slbRail'), center: r('#slbCenter'), table: r('#slbTableScroll'), inspector: r('#slbInspector'), scroll: (document.querySelector('#slbTableScroll') || {}).scrollHeight + '/' + (document.querySelector('#slbTableScroll') || {}).clientHeight }; });
  console.log('geometry:', JSON.stringify(geo));
  await page.setViewportSize({ width: 900, height: 700 }); await sleep(600);
  await shot('narrow');
  console.log('narrow:', JSON.stringify(await page.evaluate(() => ({ narrow: !!document.querySelector('#slbShell.narrow'), rows: document.querySelectorAll('#slbTableBody .slb2-tr').length }))));
  console.log('page errors:', errs.length ? errs : 'none');
  console.log('net:', JSON.stringify(cache.stats()));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
