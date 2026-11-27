// playtest_kit.js — THE KIT PROBE (2026-11-27, repo tooling, never uploaded). A race's whole kit cast in a row on one board, with
// the rule numbers read after each step (Revs, Cracks, HP, where the target went) and pictures of each cast. Built on
// playtest_spellcam.js (offline stand-ins: textures generated, GLBs 404). Needs `npm start`.
//   KIT=truck|nut|both TAG=x node playtest_kit.js  -> shots/kit/<TAG>_<step>_<ms>.png
// Notes: champions-combat.md "THE MONSTER TRUCK + THE NUTCRACKER".
// (header below copied from playtest_spellcam.js)
// Launches a Δ map offline (same stand-in routing as playtest_world.js: repo
// scripts, node_modules copies of three / React / socket.io / MeshLine,
// generated textures; GLBs / audio 404), takes both seats, TELEPORTS a caster
// and a dummy to the tiles you name, hands the caster one spell, casts it
// through the real doSpell pipeline with the action camera on, SAMPLES the
// camera every frame (controller numbers + the real three camera eye/look +
// the ground under the eye + the board top) and screenshots the beats.
//   node playtest_spellcam.js                                  (defaults below)
//   MAP=prebuilt_nuketown SPELL=raceLaserBeam CASTER=3,7 TARGET=13,7 \
//   SHOTS=400,1600,2400,3200,4200 TAG=edge node playtest_spellcam.js
// The verdict line prints the lowest eye height relative to the board top
// across the shot — negative = the camera went under the map.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const OUT = path.join(REPO, 'shots/kit'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NPM_MIRROR = [
  [/\/three\.js\/r128\/three\.min\.js$/, 'three/build/three.min.js'],
  [/\/three@0\.128\.0\/(examples\/js\/.+)$/, 'three/$1'],
  [/\/socket\.io\.min\.js$/, 'socket.io/client-dist/socket.io.min.js'],
  [/\/react\.production\.min\.js$/, 'react/umd/react.production.min.js'],
  [/\/react-dom\.production\.min\.js$/, 'react-dom/umd/react-dom.production.min.js'],
  [/\/THREE\.MeshLine\.js$/, 'three.meshline/src/THREE.MeshLine.js'],
];
const PAL = [
  [/deep_water|ocean/, [22, 60, 120]], [/water|river|lake|sea/, [40, 110, 170]], [/lava|magma/, [235, 90, 20]], [/scorch|ash|obsid/, [50, 36, 52]],
  [/grass|meadow|turf|forest|leaves|leaf/, [70, 140, 60]], [/purple/, [120, 70, 150]], [/desert|sand|dune/, [214, 186, 120]], [/dirt|soil|mud|wasteland/, [150, 120, 84]],
  [/cave_wall|rock_wall|rocks|cliff|mountain|stone/, [120, 112, 108]], [/cave_floor/, [128, 112, 140]], [/cloud/, [236, 236, 246]], [/ice|snow|frost/, [210, 232, 248]],
  [/marble/, [222, 218, 208]], [/moon/, [178, 180, 190]], [/mars/, [186, 110, 74]], [/wood|plank|bark/, [128, 90, 58]], [/brick/, [160, 84, 64]],
  [/urban|road|concrete|street|asphalt|tile/, [130, 130, 134]], [/metal|alu|gunmetal|steel/, [150, 158, 166]], [/carpet/, [190, 170, 100]], [/void|black/, [10, 10, 16]],
];
function colourFor(url) { const b = url.toLowerCase(); for (const [re, c] of PAL) if (re.test(b)) return c; return [140, 130, 150]; }
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const texCache = {};
function standIn(url) {
  const key = colourFor(url).join(',') + (/sprite|unit|portrait|icon|ui\//i.test(url) ? 'u' : 't');
  if (texCache[key]) return texCache[key];
  const w = 64, h = 64, c = colourFor(url), px = Buffer.alloc(w * h * 4);
  let seed = 1; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < w * h; i++) { const n = 0.82 + rnd() * 0.36; px[i * 4] = Math.min(255, c[0] * n); px[i * 4 + 1] = Math.min(255, c[1] * n); px[i * 4 + 2] = Math.min(255, c[2] * n); px[i * 4 + 3] = 255; }
  return (texCache[key] = png(w, h, px));
}
const CT = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
async function installRoutes(context, counters) {
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    const base = path.basename(u.pathname), ext = path.extname(base).toLowerCase();
    for (const [re, target] of NPM_MIRROR) { const m = re.exec(u.pathname); if (m) { const abs = path.join(REPO, 'node_modules', target.replace(/\$(\d)/g, (_, i) => m[Number(i)])); if (fs.existsSync(abs)) { counters.mirror++; return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(abs) }); } } }
    if (u.hostname === 'cdn.entropywars.net' && (ext === '.js' || ext === '.css') && fs.existsSync(path.join(REPO, base))) { counters.local++; return route.fulfill({ status: 200, contentType: CT[ext], headers: { 'Cache-Control': 'no-store' }, body: fs.readFileSync(path.join(REPO, base)) }); }
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp') { counters.tex++; return route.fulfill({ status: 200, contentType: 'image/png', body: standIn(u.pathname) }); }
    counters.miss++; return route.fulfill({ status: 404, body: '' });
  });
}

const MAP = process.env.MAP || 'prebuilt_stadium';
const KIT = process.env.KIT || 'both';
const TAG = process.env.TAG || 'kit';
const PICS = (process.env.PICS || '500,1300').split(',').map(Number);
/* a step: who casts what where; `move` = walk the caster there first (doMove, the real walk) */
const TRUCK = { race: 'monster truck', spells: ['mtChomp', 'mtRam', 'mtHydraulicSlam', 'mtBurnout'], at: [4, 7], foes: [[10, 7], [8, 8], [7, 6]], steps: [
  { name: 'drive', move: [7, 7] },
  { name: 'ram', spell: 'mtRam', at: 'foe0' },
  { name: 'chomp', spell: 'mtChomp', at: 'foe1near' },
  { name: 'slam', spell: 'mtHydraulicSlam', at: 'self' },
  { name: 'burnout', spell: 'mtBurnout', at: 'self' },
] };
const NUT = { race: 'nutcracker', spells: ['ncClack', 'ncQuickMarch', 'ncCrackOpen', 'ncNutcrackerSuite'], at: [4, 7], foes: [[5, 7], [7, 8], [6, 6]], steps: [
  { name: 'clack1', spell: 'ncClack', at: 'foe0' },
  { name: 'clack2', spell: 'ncClack', at: 'foe0' },
  { name: 'march', spell: 'ncQuickMarch', at: [4, 10], from: [4, 6] },
  { name: 'clack3', spell: 'ncClack', at: 'foe0', from: [4, 7] },
  { name: 'crackopen', spell: 'ncCrackOpen', at: 'foe0' },
  { name: 'suite', spell: 'ncNutcrackerSuite', at: 'self' },
] };
(async () => {
  const browser = await require(path.join(REPO, 'probe-fast.js')).launch(chromium, { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((flags) => { try { localStorage.setItem('ew_cinematicActionCam', '1'); } catch (e) {} for (const f of flags) { const [k, val] = f.split('='); window[k] = val === undefined ? true : (isNaN(+val) ? val : +val); } }, []);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e && e.message || e)));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/Raycaster/.test(t) && !/Failed to load resource|ERR_/.test(t)) console.log('CONERR', t.slice(0, 200)); });
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0].slice(0, 200)));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 120; i++) { if (await page.evaluate(() => typeof window._goToVsCpu === 'function' && !!window.GAME).catch(() => false)) break; await sleep(1000); }
  await sleep(4000);
  console.log('build', await page.evaluate(() => JSON.stringify(window.EW_BUILD || null)));
  await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; });
  {
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);
  const maps = await page.evaluate(() => { try { return MS_MAP_LIST.map((m, i) => i + ':' + (m.modeId || m.id) + ':' + (m.label || m.name || '')); } catch (e) { return 'err ' + e.message; } });
  if (process.env.LISTMAPS) { console.log(JSON.stringify(maps)); await browser.close(); return; }
  const launched = await page.evaluate((id) => {
    try {
      const mi = id ? MS_MAP_LIST.findIndex(x => x.modeId === id || x.id === id) : -1;
      if (mi >= 0) _msSelectedMap = mi;
      const gi = MS_GAME_MODES.findIndex(x => x.id === 'tdm'); if (gi >= 0) _msSelectedGM = gi;
      if (typeof window._msConfirm === 'function') { window._msConfirm(); return 'confirm map ' + mi; }
    } catch (e) { return 'err:' + e.message; }
    return 'none';
  }, MAP);
  console.log('launch', launched);
  await sleep(2500);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => /SEAL YOUR FATE/i.test(x.innerText)); if (b) b.click(); }); await sleep(1500); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'ai' }; });
  { let ok = 0; for (let i = 0; i < 90 && ok < 6; i++) { await sleep(1000); const ph = await page.evaluate(() => GAME.state.phase); if (ph === 'battle') ok++; else { ok = 0; if (i % 8 === 7) { console.log('restart match (phase ' + ph + ')'); await page.evaluate(() => { const st = GAME.state; try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} }); } } } }
  }
  const m = null;
  await page.evaluate(() => { const st = window.GAME.state; st.controllers = { 1: 'local', 2: 'local' }; st.autoPlayers = {}; });
  for (let i = 0, clear = 0; i < 60 && clear < 2; i++) {
    const left = await page.evaluate(() => { let n = 0; document.querySelectorAll('.ls-active, .ls-ready').forEach(el => { n++; el.click(); }); const h = document.querySelector('.vs-skip-hint'); if (h) { n++; h.click(); } return n; });
    if (left === 0) clear++; else clear = 0; await sleep(700);
  }
  await sleep(2500);
  const RAM = { race: 'monster truck', spells: ['mtRam'], at: [4, 7], foes: [[8, 7], [12, 12], [13, 12]], steps: [ { name: 'ram0', spell: 'mtRam', at: 'foe0' }, { name: 'drive', move: [5, 7] }, { name: 'ram1', spell: 'mtRam', at: 'foe0', from: [5, 7] } ] };
  if (process.env.CLOSE) await page.evaluate((c) => { window.__kitClose = c; }, JSON.parse(process.env.CLOSE));
  const kits = KIT === 'ram' ? [RAM] : KIT === 'truck' ? [TRUCK] : KIT === 'nut' ? [NUT] : [TRUCK, NUT];
  const report = [];
  for (const K of kits) {
    const staged = await page.evaluate((K) => {
      const st = window.GAME.state;
      const caster = st.units.find(u => u.player === 1 && !u.dead);
      const foes = st.units.filter(u => u.player === 2 && !u.dead).slice(0, K.foes.length);
      for (const u of st.units) if (!u.dead && u !== caster && !foes.includes(u)) { u.dead = true; u.hp = 0; }
      const put = (u, x, y) => { u.x = x; u.y = y; try { u.z = getHeightAt(x, y); } catch (e) { u.z = 0; } };
      caster.race = K.race; put(caster, K.at[0], K.at[1]);
      foes.forEach((f, i) => { put(f, K.foes[i][0], K.foes[i][1]); f.hp = f.maxHp = 9999; f.status = {}; delete f._cracks; });
      caster.status = {}; delete caster._revs;
      caster.spells = K.spells.map(id => { const d = (typeof RACE_ABILITY_BY_ID !== 'undefined' && RACE_ABILITY_BY_ID[id]) || SPELL_BY_ID[id]; const s = JSON.parse(JSON.stringify(d)); s.cost = 0; return s; });
      caster._spellSlots = K.spells.slice(); caster._raceAbilities = [];
      st.cinematicActionCam = true; st.fogOfWar = false; st.animationsDisabled = false;
      window.__kit = { caster: caster.id, foes: foes.map(f => f.id) };
      try { ThreeRenderer.invalidateUnits && ThreeRenderer.invalidateUnits(); GAME.markDirty(); } catch (e) {}
      return { caster: [caster.id, caster.race, caster.x, caster.y], foes: foes.map(f => [f.id, f.race, f.x, f.y]), missing: caster.spells.filter(s => !s).length };
    }, K);
    console.log('STAGED', K.race, JSON.stringify(staged));
    await sleep(1500);
    for (const S of K.steps) {
      const before = await page.evaluate(() => { const st = GAME.state, c = st.units.find(u => u.id === __kit.caster); return { revs: c._revs || 0, foes: __kit.foes.map(id => { const f = st.units.find(u => u.id === id); return [f.x, f.y, f.hp, f._cracks || 0]; }) }; });
      const res = await page.evaluate((S) => {
        const st = GAME.state, c = st.units.find(u => u.id === __kit.caster);
        const foes = __kit.foes.map(id => st.units.find(u => u.id === id));
        if (S.from) { c.x = S.from[0]; c.y = S.from[1]; try { c.z = getHeightAt(c.x, c.y); } catch (e) {} }
        c.ap = 9; c.maxAp = Math.max(c.maxAp || 0, 9); c.mp = 9999; c._spellCooldowns = {}; c._spellsUsedThisTurn = {}; c._movedThisTurn = false; c.hasMoved = false; c.moveUsed = 0;
        st._blitzActiveUnitId = c.id; st.activePlayer = 1; st.selectedUnitId = c.id;
        if (S.move) { try { return 'move ' + GAME.doMove(c, S.move[0], S.move[1], getHeightAt(S.move[0], S.move[1])); } catch (e) { return 'move threw ' + e.message; } }
        let tx, ty;
        if (S.at === 'self') { tx = c.x; ty = c.y; }
        else if (S.at === 'foe0') { tx = foes[0].x; ty = foes[0].y; }
        else if (S.at === 'foe1near') { const f = foes[1]; f.x = c.x + 1; f.y = c.y; if (st.units.some(u => u !== f && !u.dead && u.x === f.x && u.y === f.y)) { f.x = c.x; f.y = c.y + 1; } try { f.z = getHeightAt(f.x, f.y); } catch (e) {} tx = f.x; ty = f.y; }
        else { tx = S.at[0]; ty = S.at[1]; }
        if (window.__kitClose) { st.cinematicActionCam = false; try { camera.snap(Object.assign({ _force: true, x: c.x, y: c.y }, window.__kitClose)); } catch (e) {} }
        const sp = c.spells.find(s => s.id === S.spell);
        st.actionMode = 'spell'; st.selectedTool = sp.name;
        let why = null; try { why = (window.TargetQuery && TargetQuery.spellBlockReason) ? TargetQuery.spellBlockReason(c, sp) : null; } catch (e) { why = 'err ' + e.message; }
        let d; try { d = GAME.doSpell(c, tx, ty, getHeightAt(tx, ty)); } catch (e) { return 'threw ' + e.message; }
        return 'cast ' + sp.name + ' at ' + tx + ',' + ty + ' -> ' + d + (why ? ' (block: ' + why + ')' : '');
      }, S);
      const t0 = Date.now();
      for (const at of PICS) {
        const w = at - (Date.now() - t0); if (w > 0) await sleep(w);
        const f = path.join(OUT, `${TAG}_${K.race.replace(/ /g, '')}_${S.name}_${at}.png`);
        try { await page.screenshot({ path: f, timeout: 30000 }); } catch (e) { console.log('  ! shot failed', e.message.split('\n')[0]); }
      }
      await sleep(Math.max(0, 3200 - (Date.now() - t0)));
      const after = await page.evaluate(() => { const st = GAME.state, c = st.units.find(u => u.id === __kit.caster); return { at: [c.x, c.y], revs: c._revs || 0, foes: __kit.foes.map(id => { const f = st.units.find(u => u.id === id); return [f.x, f.y, f.hp, f._cracks || 0, Object.keys(f.status || {}).join('+')]; }), log: (st.logEntries || []).slice(-5).map(e => String((e && (e.text || e.msg || e.message)) || JSON.stringify(e)).slice(0, 160)) }; });
      console.log(`STEP ${K.race}/${S.name}: ${res}\n   before ${JSON.stringify(before)}\n   after  ${JSON.stringify(after)}`);
      report.push({ race: K.race, step: S.name, res, before, after });
    }
  }
  fs.writeFileSync(path.join(OUT, `${TAG}.json`), JSON.stringify(report, null, 1));
  console.log('ERRORS', JSON.stringify(errs.slice(0, 10)));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });
