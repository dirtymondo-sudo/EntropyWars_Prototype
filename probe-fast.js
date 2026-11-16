// probe-fast.js — ONE browser launch for every probe / playtest harness (2026-11-16, "the probes run slow").
// Repo-only dev tooling (never uploaded to R2). What was slow, measured in the cloud container on the Disaster City:
//   1. THE RASTERISER. Chromium's SwiftShader drew a big room (7,000-9,000 draw calls, 1-2 M triangles) at 0.3-0.5
//      frames a second. Mesa's llvmpipe (already installed with Xvfb) draws the same room 2-4x faster. `launch`
//      starts its own Xvfb and runs the browser on llvmpipe; no llvmpipe / Xvfb = SwiftShader with the flags this
//      Chromium accepts (`--use-gl=swiftshader` is refused by Chromium 130+: the GPU process died three times on
//      every launch before falling back).
//   2. THE SCREENSHOT. page.screenshot makes ~10 round trips to a page whose main thread is inside a 2-3 s frame:
//      20-35 s per picture. The game loop is now HELD (requestAnimationFrame parked) for the capture: 0.2-0.5 s.
//   3. THE FIXED WAITS. A probe slept 45-150 s hoping the room had loaded. `roomReady` returns the moment the HQ
//      load gate says the room stands and the network has gone quiet.
// Use:   const fast = require('./probe-fast.js');
//        const browser = await fast.launch(chromium, { ...the usual launch options });
//        await fast.roomReady(page, { timeout: 240000 });     // after _hqEnter
//   4. THE WRONG CODE. Every context answers cdn.entropywars.net's game scripts from this checkout, so no harness
//      plays on the red CODE MISMATCH page (RULE #1d).
// Env:   EW_PROBE_GL=swiftshader|llvmpipe (default: llvmpipe when it is there) · EW_PROBE_NO_HOLD=1 (screenshots
//        without the hold) · EW_PROBE_DRAW_LOAD=1 (draw the room while it loads, as a player's machine does) ·
//        EW_PROBE_QUIET=1 (no [PROBE] lines).
const fs = require('fs'), path = require('path'), cp = require('child_process');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const say = (...a) => { if (!process.env.EW_PROBE_QUIET) console.log('[PROBE]', ...a); };
const which = (bin) => { try { return cp.execSync('command -v ' + bin, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return ''; } };
const EXE = [process.env.PW_CHROMIUM, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => p && fs.existsSync(p));

/* Mesa's software GL (llvmpipe) lives in libgallium / swrast_dri; it needs an X display, so an Xvfb */
function hasLlvmpipe() {
  if (process.platform !== 'linux' || !which('Xvfb')) return false;
  const dirs = ['/usr/lib/x86_64-linux-gnu', '/usr/lib/aarch64-linux-gnu', '/usr/lib64', '/usr/lib'];
  return dirs.some(d => { try { return fs.existsSync(d + '/dri/swrast_dri.so') || fs.readdirSync(d).some(f => /^libgallium/.test(f)); } catch (e) { return false; } });
}
async function startXvfb() {
  for (let n = 0; n < 20; n++) {
    const num = 200 + ((process.pid + n * 7) % 700), sock = '/tmp/.X11-unix/X' + num;
    if (fs.existsSync(sock) || fs.existsSync('/tmp/.X' + num + '-lock')) continue;
    const x = cp.spawn('Xvfb', [':' + num, '-screen', '0', '2560x1600x24', '-nolisten', 'tcp', '-ac'], { stdio: 'ignore' });
    let dead = false; x.on('exit', () => { dead = true; }); x.on('error', () => { dead = true; });
    for (let i = 0; i < 50 && !dead && !fs.existsSync(sock); i++) await sleep(100);
    if (!dead && fs.existsSync(sock)) { const kill = () => { try { x.kill('SIGKILL'); } catch (e) {} }; process.on('exit', kill); return { display: ':' + num, kill }; }
    try { x.kill('SIGKILL'); } catch (e) {}
  }
  return null;
}

/* THE HOLD: every requestAnimationFrame callback goes through here; while window.__ewHold is set the callbacks are
   parked (the game stops drawing, the last frame stays on the canvas) and __ewRelease hands them back. */
const HOLD_INIT = () => {
  if (window.__ewHoldInstalled) return; window.__ewHoldInstalled = true;
  const raw = window.requestAnimationFrame.bind(window); let parked = [];
  window.__ewHold = false; window.__ewRawRaf = raw;
  window.requestAnimationFrame = function (cb) { return raw(function (t) { if (window.__ewHold) parked.push(cb); else cb(t); }); };
  window.__ewRelease = function () { window.__ewHold = false; const p = parked; parked = []; p.forEach(function (cb) { raw(cb); }); };
};
function patchPage(page) {
  if (!page || page.__ewFast) return page; page.__ewFast = true;
  if (process.env.EW_PROBE_NO_HOLD) return page;
  const shot = page.screenshot.bind(page);
  page.screenshot = async (o) => {
    let held = false;
    /* park the loop, then two bare frames: the frame in flight ends and reaches the screen before the capture */
    try { held = await page.evaluate(() => { if (!window.__ewRawRaf) return false; window.__ewHold = true; return new Promise(r => window.__ewRawRaf(() => window.__ewRawRaf(() => r(true)))); }); } catch (e) {}
    try { return await shot(o); }
    finally { if (held) { try { await page.evaluate(() => { if (window.__ewRelease) window.__ewRelease(); }); } catch (e) {} } }
  };
  return page;
}
function patchContext(context) {
  if (!context || context.__ewFast) return context; context.__ewFast = true;
  context.on('page', patchPage);
  /* THE CHECKOUT'S OWN SCRIPTS: a game script asked from cdn.entropywars.net is answered from this checkout (RULE #1d: a
     harness that let the live R2 copy through played minutes on the red CODE MISMATCH page). A harness's own routes are
     added later, so they still go first; this is the answer for a harness that has none. */
  context.route(/^https?:\/\/cdn\.entropywars\.net\/[^\/?#]+\.(js|css)(\?|#|$)/, (route) => {
    try {
      const base = decodeURIComponent(new URL(route.request().url()).pathname.slice(1)), abs = path.join(__dirname, base);
      if (fs.existsSync(abs)) return route.fulfill({ status: 200, contentType: /\.css$/.test(base) ? 'text/css' : 'application/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(abs) });
    } catch (e) {}
    return route.fallback();
  }).catch(() => {});
  const np = context.newPage.bind(context);
  context.newPage = async (...a) => { if (!context.__ewInit) { context.__ewInit = true; await context.addInitScript(HOLD_INIT); } return patchPage(await np(...a)); };
  return context;
}
function patchBrowser(browser) {
  const nc = browser.newContext.bind(browser);
  browser.newContext = async (...a) => patchContext(await nc(...a));
  const np = browser.newPage.bind(browser);
  browser.newPage = async (...a) => { const ctx = await browser.newContext(...a); return ctx.newPage(); };
  return browser;
}

const GL_FLAG = /^--(use-gl|use-angle|enable-unsafe-swiftshader|disable-gpu)(=|$)/;
async function launch(chromium, opts) {
  opts = Object.assign({}, opts || {});
  const base = (opts.args || []).filter(a => !GL_FLAG.test(a));
  if (!opts.executablePath || !fs.existsSync(opts.executablePath)) { if (EXE) opts.executablePath = EXE; else delete opts.executablePath; }
  const want = String(process.env.EW_PROBE_GL || '').toLowerCase();
  if (want !== 'swiftshader' && hasLlvmpipe()) {
    const x = await startXvfb();
    if (x) {
      try {
        const browser = await chromium.launch(Object.assign({}, opts, {
          headless: false,
          env: Object.assign({}, process.env, opts.env || {}, { DISPLAY: x.display, LIBGL_ALWAYS_SOFTWARE: '1', GALLIUM_DRIVER: 'llvmpipe' }),
          args: base.concat(['--use-gl=angle', '--use-angle=gl', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-accelerated-2d-canvas', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding']),
        }));
        browser.on('disconnected', x.kill);
        say('renderer: Mesa llvmpipe on Xvfb ' + x.display);
        browser.__ewGL = 'llvmpipe';
        return patchBrowser(browser);
      } catch (e) { x.kill(); say('llvmpipe launch failed (' + String(e && e.message).split('\n')[0].slice(0, 120) + ') — SwiftShader'); }
    }
  }
  const browser = await chromium.launch(Object.assign({}, opts, { args: base.concat(['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-accelerated-2d-canvas']) }));
  say('renderer: SwiftShader');
  browser.__ewGL = 'swiftshader';
  return patchBrowser(browser);
}

/* THE ROOM STANDS: the HQ load gate reports ready (every file of the room is in and the card is going) and no request
   has been in flight for `quiet` ms (the props that stream in after the card). Returns { ok, ms, gate }. */
async function roomReady(page, o) {
  o = Object.assign({ timeout: 240000, quiet: 2500, poll: 500, log: true, draw: !!process.env.EW_PROBE_DRAW_LOAD }, o || {});
  let live = 0, lastNet = Date.now();
  const up = () => { live++; lastNet = Date.now(); }, down = () => { live = Math.max(0, live - 1); lastNet = Date.now(); };
  page.on('request', up); page.on('requestfinished', down); page.on('requestfailed', down);
  const t0 = Date.now(); let g = null, lastSay = 0, readyAt = 0;
  try {
    while (Date.now() - t0 < o.timeout) {
      try {
        g = await page.evaluate((noDraw) => {
          try {
            const g = ThreeRenderer.hq.gate(); if (!g) return null;
            /* THE LOAD WITHOUT THE DRAWING: under the load card the game still draws the whole room; on a software GPU
               that is 2-4 s a frame and the files (which land between frames) starve: the Disaster City sat at 4 / 719
               files after 70 s. Until every file has landed the renderer's render is a no-op; it is handed back for the
               room's settle (the shaders, the sheets), so the picture is drawn the normal way. */
            const r = ThreeRenderer.hq.dev && ThreeRenderer.hq.dev.renderer && ThreeRenderer.hq.dev.renderer();
            if (r) {
              const loading = noDraw && g.total > 0 && !g.ready;
              if (loading && !r.__ewRender) { r.__ewRender = r.render; r.render = function () {}; }
              else if (!loading && r.__ewRender) { r.render = r.__ewRender; r.__ewRender = null; }
            }
            return { done: g.done, total: g.total, pending: g.pending, landed: !!g.landed, ready: !!g.ready, settle: g.settle || '' };
          } catch (e) { return null; }
        }, !o.draw);
      } catch (e) { g = null; }
      if (g && g.ready) {
        if (!readyAt) readyAt = Date.now();
        if (live === 0 && Date.now() - lastNet >= o.quiet) { if (o.log) say('room ready in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s (' + g.done + ' / ' + g.total + ' files)'); return { ok: true, ms: Date.now() - t0, gate: g }; }
        if (Date.now() - readyAt > 60000 && Date.now() - lastNet >= o.quiet) break;   // a request that never settles must not hold the probe
      } else readyAt = 0;
      if (o.log && Date.now() - lastSay > 15000) { lastSay = Date.now(); if (g) say('loading ' + g.done + ' / ' + g.total + ' files' + (g.landed ? ' · setting the room' + (g.settle ? ' (' + g.settle + ')' : '') : '')); }
      await sleep(o.poll);
    }
  } finally { try { await page.evaluate(() => { const r = ThreeRenderer.hq.dev.renderer(); if (r && r.__ewRender) { r.render = r.__ewRender; r.__ewRender = null; } }); } catch (e) {} page.off('request', up); page.off('requestfinished', down); page.off('requestfailed', down); }
  const ok = !!(g && g.ready);
  if (o.log) say((ok ? 'room ready (the network never went quiet) after ' : 'ROOM NOT READY after ') + ((Date.now() - t0) / 1000).toFixed(1) + ' s' + (g ? ' (' + g.done + ' / ' + g.total + ' files)' : ''));
  return { ok, ms: Date.now() - t0, gate: g };
}

/* THE VIEW SETTLES: after a teleport, wait for `frames` drawn frames of the new view (the far props swap LOD, the sky
   turns) plus any request it set off; `ms` (a number) = a fixed pause, the old way. */
async function settle(page, ms, frames) {
  if (typeof ms === 'number' && ms > 0) return sleep(ms);
  try { await page.evaluate((n) => new Promise(r => { let i = 0; const f = () => { if (++i >= n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); setTimeout(r, 20000); }), frames || 3); } catch (e) {}
}

module.exports = { settle,  launch, roomReady, patchPage, patchContext, EXE, hasLlvmpipe };
