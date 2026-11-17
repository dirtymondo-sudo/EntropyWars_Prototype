// Spell VFX audit batch runner (visuals ON). node sv-run.js --ids ids.txt --out DIR [--gpu webgl2|webgl|webgpu] [--only a,b] [--race r]
// --dense = a frame every tick for the first 3 s (beams, fast projectiles).
// One headful llvmpipe page (WebGL2 node renderer by default), art + 3D models on, Playwright fake clock.
// Per spell: the real HUD path (ABILITIES -> spell row -> aim still -> CONFIRM) on the audit board, then the clock is
// stepped in 150 ms ticks and frames are drawn + saved at the windup, the hit and the aftermath.
// Writes DIR/records.jsonl + DIR/shots/<id>/NN_label.jpg + DIR/progress.log. Sheets/report: sv-report.js.
const fs = require('fs'), path = require('path'), http = require('http'); const { spawn } = require('child_process');
const HD = process.env.EW_HARNESS_DIR || '/tmp/ew-harness';
const { install, REPO } = require(HD + '/route.js');
const A = process.argv.slice(2); const F = (n, d) => { const i = A.indexOf('--' + n); return i < 0 ? d : A[i + 1]; };
const OUT = F('out', '/tmp/sv/out'), GPU = F('gpu', 'webgl2'), W = +F('w', 1280), H = +F('h', 720), RECYCLE = +F('recycle', 60);
const SVD = __dirname;
const LIBS = [fs.readFileSync(path.join(F('sa', SVD), 'sa-lib.js'), 'utf8'), fs.readFileSync(path.join(SVD, 'sv-lib.js'), 'utf8')];
const PAGEJS = fs.readFileSync(path.join(SVD, 'page.js'), 'utf8').replace('__DRAW__', 'demand');
const MENUJS = fs.readFileSync(path.join(SVD, 'menu.js'), 'utf8');
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms)); const PORT = +(process.env.PORT || 3000);
function up() { return new Promise(res => { const q = http.get({ host: 'localhost', port: PORT, path: '/', timeout: 2000 }, r => { r.resume(); res(r.statusCode < 500) }); q.on('error', () => res(false)); q.on('timeout', () => { q.destroy(); res(false) }); }); }
const log = (...a) => { const s = new Date().toISOString().slice(11, 19) + ' ' + a.join(' '); console.log(s); fs.appendFileSync(path.join(OUT, 'progress.log'), s + '\n'); };

const { loadGameData } = require(REPO + '/load-data.js'); const D = loadGameData();
let ids = [];
if (F('ids')) ids = fs.readFileSync(F('ids'), 'utf8').split(/[\s,]+/).filter(Boolean);
if (F('only')) ids = F('only').split(',');
const owner = {};
for (const [r, l] of Object.entries(D.RACE_ABILITIES)) for (const a of l) if (!owner[a.id]) owner[a.id] = r;
for (const r of Object.keys(D.RACE_BASE_STATS).sort()) { let p = []; try { p = D.raceFamilyPoolIds(r) || []; } catch (e) {} for (const id of p) if (!owner[id]) owner[id] = r; }
const recFile = path.join(OUT, 'records.jsonl'); const done = new Set();
if (fs.existsSync(recFile)) for (const l of fs.readFileSync(recFile, 'utf8').split('\n')) { try { const r = JSON.parse(l); if (r.ok || r.tries >= 2) done.add(r.id); } catch (e) {} }
const tries = {};
// per-spell setup for a re-shoot: --opts '{"id":{"pre":"js (c, sp, E, A, G)","dist":2,"wait":3000}}' (a JSON string or a .json file)
let OPTS = {}; if (F('opts')) { const o = F('opts'); OPTS = JSON.parse(fs.existsSync(o) ? fs.readFileSync(o, 'utf8') : o); }
const jobs = [];
for (const id of ids) { const sp = D.SPELL_BY_ID[id]; if (!sp) { log('unknown id', id); continue; } if (sp.kind === 'passive') continue; if (done.has(id)) continue; jobs.push({ id, race: F('race', null) || owner[id] || 'door agent' }); }
jobs.sort((a, b) => a.race.localeCompare(b.race) || a.id.localeCompare(b.id));
log('jobs', jobs.length, 'gpu', GPU);

(async () => {
  if (!await up()) { spawn(process.execPath, ['server.js'], { cwd: REPO, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore', detached: true }).unref(); for (let i = 0; i < 40 && !await up(); i++) await sleep(500); }
  const { chromium } = require(REPO + '/node_modules/playwright');
  let args = ['--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--js-flags=--max-old-space-size=4000'];
  let headless = true, env = { ...process.env };
  if (GPU === 'webgpu') args.push('--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader', '--use-webgpu-adapter=swiftshader', '--use-angle=swiftshader');
  else { if (!env.DISPLAY) { const d = ':' + (50 + Math.floor(Math.random() * 19)); spawn('Xvfb', [d, '-screen', '0', (W + 100) + 'x' + (H + 200) + 'x24', '-nolisten', 'tcp'], { stdio: 'ignore', detached: true }).unref(); await sleep(1500); env.DISPLAY = d; } headless = false; args.push('--use-gl=angle', '--use-angle=gl'); }
  process.env.EW_PROBE_NO_HOLD='1'; const browser = await require(REPO + '/probe-fast.js').launch(chromium, { headless, env, executablePath: '/opt/pw-browsers/chromium', args: args.filter(a=>!/use-gl|use-angle/.test(a)), proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined });
  let ctx, page, race = null, n = 0, pageErrs = [], badReq = [];
  async function newPage() {
    if (ctx) { try { await ctx.close(); } catch (e) {} }
    ctx = await browser.newContext({ viewport: { width: W, height: H }, ignoreHTTPSErrors: true });
    await install(ctx);
    await ctx.route(/\.(mp3|ogg|wav|m4a|mp4|webm)(\?|$)/i, r => r.fulfill({ status: 404, body: '' }));
    await ctx.addInitScript(() => { if (window.GPUTexture) { const o = GPUTexture.prototype.createView; GPUTexture.prototype.createView = function (d) { if (d && d.swizzle) { d = Object.assign({}, d); delete d.swizzle; } return o.call(this, d); }; } window.EW_DISABLE_INTRO_CINE = true; window._tutWeatherOff = true; });
    // every rAF loop runs at 20 fps of FAKE time (the game caps a frame's step at 0.05 s, so motion keeps real speed): 3x fewer logic frames per stepped second
    await ctx.addInitScript(() => { const st = window.setTimeout, ct = window.clearTimeout; window.requestAnimationFrame = function (cb) { return st(function () { cb(performance.now()); }, 50); }; window.cancelAnimationFrame = function (id) { ct(id); }; });
    await ctx.addInitScript(PAGEJS);
    await ctx.clock.install();
    page = await ctx.newPage(); race = null; n = 0;
    page.on('pageerror', e => pageErrs.push('ERR ' + e.message.split('\n')[0].slice(0, 200)));
    page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/Failed to load resource/.test(t)) pageErrs.push('CE ' + t.slice(0, 200)); });
    page.on('response', r => { const u = r.url(); if (r.status() >= 400 && !/\.(mp3|ogg|wav|m4a)|fonts\.|cdnjs/.test(u)) badReq.push(r.status() + ' ' + u.slice(0, 160)); });
    page.on('requestfailed', r => { const u = r.url(); if (!/\.(mp3|ogg|wav|m4a)|fonts\.|cdnjs/.test(u)) badReq.push('FAIL ' + u.slice(0, 160)); });
    await page.goto('http://localhost:' + PORT + '/?ew_gpu=' + (GPU === 'webgl' ? 'webgl' : GPU), { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(() => window.GAME && typeof window.startMatch === 'function' && typeof ThreeRenderer !== 'undefined', null, { timeout: 300000 });
    for (const L of LIBS) await page.evaluate(js => { (0, eval)(js); }, L);
  }
  const ev = (fn, a) => page.evaluate(fn, a);
  let paused = false;
  async function pause() { for (const ah of [300, 1500, 5000]) { const t = await ev(() => Date.now()); try { await ctx.clock.pauseAt(t + ah); paused = true; return; } catch (e) { if (!/past/.test(e.message)) throw e; } } throw new Error('could not pause the clock'); }
  async function resume() { if (paused) { await ctx.clock.resume(); paused = false; } }
  async function run(ms) { await ctx.clock.runFor(ms); }
  async function shot(file) {
    await ev(() => { __ph.draw.frames = 3; });
    if (paused) await run(150); else for (let i = 0; i < 50; i++) { if ((await ev(() => __ph.draw.frames)) <= 0) break; await sleep(100); }
    await page.screenshot({ path: file, type: 'jpeg', quality: 80, timeout: 120000 });
    await ev(() => { __ph.draw.frames = 0; });
  }
  const menu = () => ev(new Function(MENUJS));
  async function waitMenu(pred, ms) { const t0 = Date.now(); let m = []; while (Date.now() - t0 < ms) { m = await menu(); const hit = m.find(pred); if (hit) return { hit, m }; if (paused) await run(200); else await sleep(250); } return { hit: null, m }; }
  const frameInfo = () => ev(() => { const r = SV.status(); let cam = null; try { cam = getCameraSnapshot(); } catch (e) {} const box = id => { try { const b = ThreeRenderer.unitScreenBox(id); return b ? [Math.round(b.x), Math.round(b.y), Math.round(b.h)] : null; } catch (e) { return null; } };
    const c = SA.caster(); const tid = SV.lastTargetId; let hp = {}; for (const u of state.units) hp[u.id] = u.hp;
    return { t: r.t, busy: r.busy, cam: cam && { yaw: cam.yaw, tilt: cam.tilt, zoom: +(cam.camZoom || 0).toFixed(2), fx: cam.focalX, fy: cam.focalY }, caster: box(c.id), target: tid ? box(tid) : null, hp, logN: r.log.length, mp: c.mp }; });

  // click a board tile the way a player does: the 3D canvas, a point that really picks that tile and isn't under the HUD
  async function clickTile(onlyEmpty) {
    const pts = await ev(oe => {
      const c = document.querySelector('canvas#threeCanvas') || [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
      const r = c.getBoundingClientRect(); const out = [];
      for (const t of SV.cands.slice(0, 8)) {
        if (oe && state.units.some(u => !u.dead && u.x === t.x && u.y === t.y)) continue;
        const w = ThreeRenderer.worldToScreen(t.x, t.y, 0); if (!w) continue;
        const x = Math.round(r.left + w.x), y = Math.round(r.top + w.y);
        const pk = ThreeRenderer.pickAtScreen ? ThreeRenderer.pickAtScreen(x, y) : null; const top = document.elementFromPoint(x, y);
        if (top === c && (!pk || (pk.tileX === t.x && pk.tileY === t.y))) out.push({ x, y, t: [t.x, t.y] });
      }
      return out;
    }, !!onlyEmpty);
    return pts;
  }
  const castSig = () => ev(() => ({ mp: SA.caster().mp, busy: GAME.boardBusy(), u: state.units.map(u => u.id + ':' + u.x + ',' + u.y + ':' + u.hp).join(';') }));
  const sigDiff = (a, b) => a.mp !== b.mp || a.u !== b.u || b.busy;
  async function doSpell(j) {
    const dir = path.join(OUT, 'shots', j.id); fs.mkdirSync(dir, { recursive: true });
    const rec = { id: j.id, race: j.race, ok: false, frames: [] }; const T0 = Date.now();
    pageErrs = []; badReq = [];
    await resume();
    if (j.race !== race) {
      const b = await ev(async r => { if (state.phase === 'battle') { state._spellLabMode = false; try { await backToMainMenu(); } catch (e) {} await SA.sleep(400); } const b = await SA.boot({ casterRace: r }); state.devAutoSim = false; return b; }, j.race);
      race = j.race; log('boot', race, b.marks, (b.leaked || []).join(','));
      await sleep(1500);
    }
    const JO = OPTS[j.id] || {};
    const P = await ev(([id, o]) => SV.prep(id, o), [j.id, JO]);
    if (JO.wait) await sleep(JO.wait);
    Object.assign(rec, { name: P.name, kind: P.kind, element: P.el, vfxElement: P.vfx, aimPlan: P.aim });
    const sp = D.SPELL_BY_ID[j.id]; rec.desc = sp.desc; rec.tier = sp.tier; rec.range = sp.range; rec.type = sp.type;
    if (P.err) { rec.err = P.err; return rec; }
    await ev(() => { try { if (typeof _softResetCameraToUnit === 'function') _softResetCameraToUnit(SA.caster()); } catch (e) {} });
    await sleep(1200);
    // --- the HUD path ---
    let pathUsed = 'direct';
    const ab = await waitMenu(e => /ABILITIES/.test(e[2]) && /hrlg-blade/.test(e[3]), 15000);
    if (ab.hit) {
      await page.mouse.click(ab.hit[0], ab.hit[1]);
      const nm = (P.name || '').toUpperCase();
      // the caster holds only this spell, so the sub menu has one row (an icon may lead its name)
      const row = await waitMenu(e => /hrlg-blade/.test(e[3]) && !/trow/.test(e[3]) && (/brows|catc/.test(e[3]) || e[2].toUpperCase().includes(nm)), 5000);
      if (row.hit && !/dead/.test(row.hit[3])) {
        await page.mouse.click(row.hit[0], row.hit[1]);
        const isCf = e => /CONFIRM/.test(e[2]) && !/trow/.test(e[3]) || (/CONFIRM/.test(e[2]) && /confirm-inline|cfm/.test(e[3]) && !/trow/.test(e[3]));
        let cf = await waitMenu(isCf, 4000);
        if (!cf.hit) {
          // a tile-placed spell (teleport / zone / summon / AoE placement): click the aim tile on the board, then CONFIRM
          const s0 = await castSig();
          for (const pt of await clickTile(false)) {
            await page.mouse.move(pt.x, pt.y); await sleep(400); await page.mouse.click(pt.x, pt.y); rec.tileClick = pt.t;
            cf = await waitMenu(isCf, 2500);
            if (cf.hit) break;
            if (sigDiff(s0, await castSig())) { rec.note = 'cast on the tile click (no CONFIRM step; the clock was running ~0.4 s)'; pathUsed = 'hud-tile'; await pause(); await ev(() => { SV.t0 = performance.now() - 400; }); break; }
          }
        }
        rec.menuAfterRow = cf.m.map(e => e[2]).slice(0, 8);
        if (pathUsed === 'direct') { await sleep(900); await shot(path.join(dir, '00_aim.jpg')); rec.frames.push(Object.assign({ label: 'aim' }, await frameInfo())); }
        if (cf.hit && pathUsed === 'direct') {
          await pause();
          // a cast = MP spent, the board busy, a unit added/moved or HP changed (a log line alone can be a prompt like "Choose an empty tile")
          const sig = () => ev(() => ({ mp: SA.caster().mp, busy: GAME.boardBusy(), u: state.units.map(u => u.id + ':' + u.x + ',' + u.y + ':' + u.hp).join(';') }));
          const before = await sig();
          await page.mouse.click(cf.hit[0], cf.hit[1]);
          await run(120);
          const after = await sig();
          if (after.mp !== before.mp || after.u !== before.u || after.busy) { pathUsed = 'hud'; await ev(() => { SV.t0 = performance.now() - 120; }); }
          else {
            // two-step spells (Deploy Turret, Tunnel Network: CONFIRM, then pick an empty tile)
            await resume();
            for (const pt of await clickTile(true)) {
              await page.mouse.move(pt.x, pt.y); await sleep(400); await page.mouse.click(pt.x, pt.y); rec.tileClick = pt.t;
              const cf2 = await waitMenu(isCf, 2000);
              if (cf2.hit) { await pause(); const b2 = await castSig(); await page.mouse.click(cf2.hit[0], cf2.hit[1]); await run(120); if (sigDiff(b2, await castSig())) { pathUsed = 'hud'; await ev(() => { SV.t0 = performance.now() - 120; }); break; } await resume(); continue; }
              if (sigDiff(before, await castSig())) { await pause(); pathUsed = 'hud-tile'; rec.note = 'second step = tile click'; await ev(() => { SV.t0 = performance.now() - 400; }); break; }
            }
          }
        } else if (pathUsed === 'direct') rec.note = 'no CONFIRM after the row' + (rec.tileClick ? ' or the tile click' : '') + ' (' + (cf.m.map(e => e[2]).join(' | ').slice(0, 160)) + ')';
      } else rec.note = row.hit ? 'row greyed out: ' + row.hit[2] : 'spell row not found (' + row.m.map(e => e[2]).join(' | ').slice(0, 200) + ')';
    } else rec.note = 'ABILITIES not found';
    if (pathUsed === 'direct') {
      await resume();
      // back out of the HUD with its own buttons (Escape with nothing armed opens the pause menu)
      for (let q = 0; q < 3; q++) { const m = await menu(); const b = m.find(e => /CANCEL|^‹ BACK|◂ BACK|◀ BACK/.test(e[2])); if (!b) break; await page.mouse.click(b[0], b[1]); await sleep(500); }
      await ev(() => SV.unpause());
      await ev(([id, o]) => SV.prep(id, o), [j.id, JO]); if (JO.wait) await sleep(JO.wait);
      if (!rec.frames.length) { await sleep(600); await shot(path.join(dir, '00_pre.jpg')); rec.frames.push(Object.assign({ label: 'pre' }, await frameInfo())); }
      await pause();
      const c = await ev(() => SV.cast()); rec.direct = c;
      if (c.rejected) { rec.rejected = true; }
    }
    rec.path = pathUsed;
    await ev(() => { const t = SV.cands[SV.ci] || SV.cands[0]; const u = t && state.units.find(x => !x.dead && x.x === t.x && x.y === t.y); SV.lastTargetId = u ? u.id : (t && t.targetId) || null; });
    // --- step the clock and shoot ---
    const hp0 = (await frameInfo()).hp; let hitAt = null, k = 1, t = 0, idle = 0, lastShot = -9999;
    // fixed cadence: a frame every 400 ms up to 3.2 s, then every 1 s while the board is busy (max 9 s); the first frame
    // after the first HP change / log line is labelled 'hit' (HP can move at the cast for heals/teleports, so it is a hint)
    const MAXT = 9000; let next = 250; let changeAt = null;
    const DENSE = A.includes('--dense');   // --dense: a frame every 150 ms tick for the first 3 s (a beam lives 0.3-0.5 s: the normal cadence misses it)
    while (t < MAXT && k < (DENSE ? 26 : 15)) {
      await run(150); t += 150;
      const fi = await frameInfo();
      const hpChanged = Object.keys(hp0).some(id => fi.hp[id] !== hp0[id]);
      if (changeAt == null && (hpChanged || fi.logN > 0)) changeAt = t;
      if (fi.busy === false && t > 600) idle += 150; else idle = 0;
      if (t >= next) {
        const label = (changeAt != null && hitAt == null) ? 'chg' : (t < 400 ? 'windup' : 'mid');
        if (label === 'chg') hitAt = t;
        const f = path.join(dir, String(k).padStart(2, '0') + '_' + label + '_' + t + 'ms.jpg');
        await shot(f); rec.frames.push(Object.assign({ label, ms: t }, fi)); k++; t += 150; lastShot = t;
        next = DENSE && t < 3000 ? t : (t < 3200 ? t + 250 : t + 850);
      }
      if (idle >= 600 && t > 2000 && (changeAt == null || t - changeAt > 1200)) break;
    }
    rec.changeAt = changeAt;
    await run(500);
    const fe = await frameInfo(); await shot(path.join(dir, String(k).padStart(2, '0') + '_end.jpg')); rec.frames.push(Object.assign({ label: 'end', ms: t + 500 }, fe));
    // a sky throw / two-step spell: the second pick
    try { const g = await ev(() => { const c = SA.caster(); return c._skyThrowGrab ? 1 : 0; }); if (g) rec.note = (rec.note ? rec.note + '; ' : '') + 'two-step spell: second pick not shot'; } catch (e) {}
    rec.log = await ev(() => SA.logSince(SV.snap0 ? SV.snap0.log : 0).slice(0, 12));
    rec.errs = pageErrs.slice(0, 10).concat(await ev(() => SA.errs.slice(SV.e0 || 0, (SV.e0 || 0) + 8)));
    rec.badReq = [...new Set(badReq)].slice(0, 10);
    rec.hitAt = hitAt; rec.ms = Date.now() - T0; rec.ok = true;
    await resume();
    return rec;
  }

  await newPage();
  for (const j of jobs) {
    let rec;
    tries[j.id] = (tries[j.id] || 0) + 1;
    try { rec = await Promise.race([doSpell(j), sleep(240000).then(() => { throw new Error('spell timeout 240s'); })]); }
    catch (e) { rec = { id: j.id, race: j.race, ok: false, err: String(e.message).split('\n')[0] }; log('fail', j.id, rec.err); try { await newPage(); } catch (e2) { log('reload failed', e2.message); } }
    rec.tries = tries[j.id];
    fs.appendFileSync(recFile, JSON.stringify(rec) + '\n');
    log(j.id, rec.ok ? 'ok' : 'FAIL', rec.path || '', (rec.ms / 1000 | 0) + 's', rec.frames ? rec.frames.length + 'f' : '', rec.note || '');
    if (++n >= RECYCLE) { log('recycle page'); await newPage(); }
  }
  await browser.close(); log('done'); process.exit(0);
})().catch(e => { console.error(e); process.exit(1) });
