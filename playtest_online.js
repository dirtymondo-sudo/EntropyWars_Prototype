// Entropy Wars — ONLINE (two-browser) playtest harness.
//
// Unlike playtest.js (solo vs CPU), this drives TWO real browser clients through
// the actual multiplayer path in server.js + online.js (loaded from R2):
//   HOST  = Player 1 = authoritative engine
//   GUEST = Player 2 = thin client (sends game-action intents, applies state-sync)
//
// It exercises the relay/matchmaking code that nothing else tests, and — the
// headline check — after every action it compares the HOST vs GUEST game state
// and flags any DESYNC (the class of bug the user knows exists).
//
// Usage:  node playtest_online.js [friendly|ranked]   (default: friendly room-code)
// Requires: server on :3000, Playwright + chromium installed.
//
// Artifacts in shots/: online-host.png, online-guest.png, online-log.txt,
//   online-flags.json (desyncs + console/page errors + lifecycle issues).

const { chromium } = require('playwright');
const fs = require('fs');

const MODE = (process.argv[2] || 'friendly').toLowerCase(); // friendly | ranked
const SHOTS = __dirname + '/shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

const LOG = [];
const FLAGS = [];
function log(...a) { const s = a.join(' '); LOG.push(s); console.log(s); }
function flag(type, detail) { FLAGS.push({ type, ...detail, t: Date.now() }); log(`  🐞 FLAG[${type}] ${JSON.stringify(detail).slice(0, 300)}`); }
async function snap(page, name) { try { await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 7000, animations: 'disabled' }); } catch (e) {} }

// ── runs IN-PAGE: a compact, comparable digest of the authoritative game state ──
const DIGEST_FN = () => {
  const st = window._gameState || (window.GAME && window.GAME.state);
  if (!st) return null;
  const units = (st.units || []).map(u => ({
    id: u.id, p: u.player, hp: Math.round(u.hp || 0), x: u.x, y: u.y,
    dead: !!u.dead, ap: u.ap, mp: u.mp
  })).sort((a, b) => (a.id < b.id ? -1 : 1));
  return {
    phase: st.phase, round: st.round, activePlayer: st.activePlayer,
    active: st._blitzActiveUnitId, winner: st.winner,
    kills: st.matchKills, units
  };
};

// in-page NET status probe
const NET_FN = () => {
  const N = window._NET || {};
  return {
    online: !!N.online, connected: !!N.connected, role: N.role,
    myPlayer: N.myPlayer, roomCode: N.roomCode,
    socketConnected: !!(N.socket && N.socket.connected),
    socketId: N.socket && N.socket.id,
    lock: N._lockState || null
  };
};

// Compare two digests; return list of human-readable diffs (ignoring nothing).
function diffDigests(h, g) {
  const out = [];
  if (!h || !g) return ['missing-state(host=' + !!h + ',guest=' + !!g + ')'];
  for (const k of ['phase', 'round', 'activePlayer', 'active', 'winner']) {
    if (JSON.stringify(h[k]) !== JSON.stringify(g[k])) out.push(`${k}: host=${JSON.stringify(h[k])} guest=${JSON.stringify(g[k])}`);
  }
  if (JSON.stringify(h.kills) !== JSON.stringify(g.kills)) out.push(`kills: host=${JSON.stringify(h.kills)} guest=${JSON.stringify(g.kills)}`);
  const hm = new Map(h.units.map(u => [u.id, u]));
  const gm = new Map(g.units.map(u => [u.id, u]));
  for (const [id, hu] of hm) {
    const gu = gm.get(id);
    if (!gu) { out.push(`unit ${id} missing on guest`); continue; }
    for (const f of ['hp', 'x', 'y', 'dead', 'ap', 'mp', 'p']) {
      if (hu[f] !== gu[f]) out.push(`unit ${id}.${f}: host=${hu[f]} guest=${gu[f]}`);
    }
  }
  for (const id of gm.keys()) if (!hm.has(id)) out.push(`unit ${id} extra on guest`);
  return out;
}

// Wait until predicate(page-eval result) is true, polling.
async function waitFor(page, fn, ms, every = 400) {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await sleep(every); }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage'] });
  const mk = async (tag) => {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 720 }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => { const m = e.message.split('\n')[0]; log(`[${tag}] PAGEERR ${m}`); flag('pageerror', { who: tag, msg: m }); });
    page.on('console', m => { const t = m.text(); if (/error|undefined is not|cannot read|desync|NaN/i.test(t)) log(`[${tag}] console: ${t.slice(0, 160)}`); });
    return { ctx, page };
  };

  const HOST = await mk('HOST');
  const GUEST = await mk('GUEST');
  const host = HOST.page, guest = GUEST.page;

  log(`\n=== Entropy Wars ONLINE playtest — mode=${MODE} ===`);
  log('Loading both clients…');
  await Promise.all([
    host.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 }),
    guest.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 }),
  ]);
  await sleep(10000);
  // Sanity: did the engine load from R2?
  const loaded = await Promise.all([host, guest].map(p => p.evaluate(() => !!(window._NET && window.startMatch && window._gameState))));
  log(`Engine loaded — host:${loaded[0]} guest:${loaded[1]}`);
  if (!loaded[0] || !loaded[1]) { flag('load-failure', { loaded }); }

  // ── 1) MATCHMAKING / ROOM ──
  if (MODE === 'ranked') {
    log('\n— Ranked queue: both clients join the 4v4 queue —');
    await host.evaluate(() => { window._queueTeamSize = 4; window._queueMode = 'arena'; window.lobbyJoinQueue && window.lobbyJoinQueue(); });
    await sleep(800);
    await guest.evaluate(() => { window._queueTeamSize = 4; window._queueMode = 'arena'; window.lobbyJoinQueue && window.lobbyJoinQueue(); });
  } else {
    log('\n— Friendly room: host creates, guest joins by code —');
    await host.evaluate(() => window.lobbyCreateRoom && window.lobbyCreateRoom());
    const gotCode = await waitFor(host, () => !!(window._NET && window._NET.roomCode), 15000);
    if (!gotCode) { flag('no-room-code', {}); }
    const code = await host.evaluate(() => window._NET && window._NET.roomCode);
    log(`Host room code: ${code}`);
    if (code) {
      await guest.evaluate((c) => {
        let i = document.getElementById('lobbyJoinInput');
        if (!i) { i = document.createElement('input'); i.id = 'lobbyJoinInput'; document.body.appendChild(i); }
        i.value = c;
        window.lobbyJoinRoom && window.lobbyJoinRoom();
      }, code);
    }
  }

  // ── 2) ROOM-FULL / ENTER ONLINE MODE ──
  const hOnline = await waitFor(host, () => window._NET && window._NET.online === true, 20000);
  const gOnline = await waitFor(guest, () => window._NET && window._NET.online === true, 20000);
  log(`room-full processed — host.online:${hOnline} guest.online:${gOnline}`);
  if (!hOnline || !gOnline) flag('room-full-failed', { hOnline, gOnline, hostNet: await host.evaluate(NET_FN), guestNet: await guest.evaluate(NET_FN) });
  await sleep(3000); // _enterOnlineMode runs ~1.5s after room-full

  log('NET host: ' + JSON.stringify(await host.evaluate(NET_FN)));
  log('NET guest:' + JSON.stringify(await guest.evaluate(NET_FN)));

  // ── 3) LOCK PARTIES + START ──
  log('\n— Locking parties (guest first → host → start) —');
  // Guest locks + sends its party to the host (sets host.guestPartyReceived).
  await guest.evaluate(() => { const s = window._gameState; if (s) s.teamLockedIn = true; try { window.applyPartyBuild(false); } catch (e) {} });
  await sleep(1800);
  // Host locks its own party.
  await host.evaluate(() => { const s = window._gameState; if (s) s.teamLockedIn = true; try { window.applyPartyBuild(false); } catch (e) {} });
  await sleep(1800);
  // Diagnose host pre-start state and capture any startMatch error.
  const diag = await host.evaluate(() => {
    const s = window._gameState, N = window._NET;
    const out = { phase: s && s.phase, teamLockedIn: s && s.teamLockedIn, lock: N && N._lockState,
      friendlyConfig: N && N.friendlyConfig, teamSize: (typeof CONFIG !== 'undefined') && CONFIG.teamSize,
      units: s && (s.units || []).length, p1build: s && (s.partyBuilds && s.partyBuilds[1]),
      p2build: s && (s.partyBuilds && s.partyBuilds[2]), activeMode: window.activeMultiplayerMode };
    try {
      const L = N && N._lockState; if (L) { L.host = true; L.guestPartyReceived = true; }
      if (s) s.teamLockedIn = true;
      window.startMatch();
      out.startMatchErr = null;
    } catch (e) { out.startMatchErr = (e && e.message) + ' | ' + (e && e.stack || '').split('\n').slice(0, 3).join(' / '); }
    out.phaseAfter = s && s.phase;
    return out;
  });
  log('Host pre-start diag: ' + JSON.stringify(diag).slice(0, 600));
  if (diag.startMatchErr) flag('startMatch-threw', { err: diag.startMatchErr });
  await sleep(2500);
  const inBattle = await waitFor(host, () => { const s = window._gameState; return s && s.phase === 'battle'; }, 20000);
  await waitFor(guest, () => { const s = window._gameState; return s && s.phase === 'battle'; }, 25000);
  log(`Battle started — host inBattle:${inBattle}`);
  if (!inBattle) { flag('match-start-failed', { hostNet: await host.evaluate(NET_FN) }); }
  await host.evaluate(() => { try { window._NET.socket.emit('match-started'); } catch (e) {} });
  await snap(host, 'online-host'); await snap(guest, 'online-guest');

  // ── 4) PLAY LOOP with desync detection ──
  // Host drives P1 units (authoritative, broadcasts). Guest drives P2 units
  // through the REAL emitters (selectUnit/setActionMode/clickTile/triggerEndTurn).
  const HOST_TURN = () => {
    const G = window.GAME, st = G.state;
    if (!st || st.phase !== 'battle' || st.winner != null) return { s: 'done' };
    if (st.activePlayer !== 1) return { s: 'not-mine', ap: st.activePlayer };
    const id = st._blitzActiveUnitId; const u = st.units.find(x => x.id === id);
    if (!u || u.dead || u.player !== 1) return { s: 'no-unit' };
    const D = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    const en = st.units.filter(x => x.player !== 1 && !x.dead && x.hp > 0);
    const acted = [];
    try {
      // attack if possible
      const atk = (G.getAttackTiles(u) || []).map(t => ({ t, tg: G.unitAt(t.x, t.y, t.z) })).filter(o => o.tg && o.tg.player !== 1 && !o.tg.dead).sort((a, b) => a.tg.hp - b.tg.hp)[0];
      if (atk) { G.doAttack(u, atk.t.x, atk.t.y, atk.t.z); acted.push('atk ' + (atk.tg.name || atk.tg.cls)); }
      else if (en.length && G.canUnitMove(u)) {
        let ne = en[0]; for (const e of en) if (D(u, e) < D(u, ne)) ne = e;
        const tiles = G.getMoveTiles(u) || []; let bt = null, bd = D(u, ne);
        for (const t of tiles) { const d = Math.abs(t.x - ne.x) + Math.abs(t.y - ne.y); if (d < bd) { bd = d; bt = t; } }
        if (bt) { G.doMove(u, bt.x, bt.y, bt.z); acted.push(`mv ${bt.x},${bt.y}`); }
      }
    } catch (e) { acted.push('err:' + e.message); }
    u.ap = 0;
    try { window.triggerEndTurn(); } catch (e) { try { window.endUnitIfDone(u); } catch (e2) {} }
    try { window._broadcastState(); } catch (e) {}
    return { s: 'played', name: u.name || u.cls, acted };
  };

  // Guest acts via the real online emitters (one unit, then ends turn).
  const GUEST_TURN = () => {
    const G = window.GAME, st = window._gameState;
    if (!st || st.phase !== 'battle' || st.winner != null) return { s: 'done' };
    if (st.activePlayer !== 2) return { s: 'not-mine', ap: st.activePlayer };
    const id = st._blitzActiveUnitId; const u = st.units.find(x => x.id === id);
    if (!u || u.dead || u.player !== 2) return { s: 'no-unit' };
    const D = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    const en = st.units.filter(x => x.player !== 2 && !x.dead && x.hp > 0);
    const acted = [];
    try {
      window.selectUnit(u.id); // emits selectUnit
      const atk = (G.getAttackTiles(u) || []).map(t => ({ t, tg: G.unitAt(t.x, t.y, t.z) })).filter(o => o.tg && o.tg.player !== 2 && !o.tg.dead).sort((a, b) => a.tg.hp - b.tg.hp)[0];
      if (atk) { window.setActionMode('attack'); window.clickTile(atk.t.x, atk.t.y); acted.push('atk@' + atk.t.x + ',' + atk.t.y); }
      else if (en.length && G.canUnitMove(u)) {
        let ne = en[0]; for (const e of en) if (D(u, e) < D(u, ne)) ne = e;
        const tiles = G.getMoveTiles(u) || []; let bt = null, bd = D(u, ne);
        for (const t of tiles) { const d = Math.abs(t.x - ne.x) + Math.abs(t.y - ne.y); if (d < bd) { bd = d; bt = t; } }
        if (bt) { window.setActionMode('move'); window.clickTile(bt.x, bt.y); acted.push(`mv@${bt.x},${bt.y}`); }
      }
    } catch (e) { acted.push('err:' + e.message); }
    try { window.triggerEndTurn(); } catch (e) {} // emits triggerEndTurn
    return { s: 'played', name: u.name || u.cls, acted };
  };

  log('\n— Playing (host=P1 local, guest=P2 via relay); checking sync each step —');
  let lastRound = -1, stalls = 0, desyncs = 0, steps = 0;
  const start = Date.now();
  while (Date.now() - start < 300000) {
    steps++;
    const hd = await host.evaluate(DIGEST_FN);
    if (hd && hd.winner != null) { log(`\nWinner = P${hd.winner}`); break; }
    if (hd && hd.round !== lastRound) { lastRound = hd.round; log(`\n── Round ${hd.round} ── activePlayer:${hd.activePlayer} kills:${JSON.stringify(hd.kills)}`); }

    let r;
    if (hd && hd.activePlayer === 1) r = await host.evaluate(HOST_TURN);
    else if (hd && hd.activePlayer === 2) r = await guest.evaluate(GUEST_TURN);
    else { r = { s: 'idle' }; }

    if (r && r.s === 'played') { stalls = 0; if (r.acted && r.acted.length) log(`  P${hd.activePlayer} ${r.name}: ${r.acted.join(' | ')}`); }
    else { if (++stalls > 60) { log('(stalled — stopping play loop)'); flag('stall', { lastDigest: hd }); break; } }

    await sleep(600); // let state-sync settle

    // ── DESYNC CHECK ──
    const [hg, gg] = await Promise.all([host.evaluate(DIGEST_FN), guest.evaluate(DIGEST_FN)]);
    const d = diffDigests(hg, gg);
    if (d.length) {
      desyncs++;
      if (desyncs <= 12) flag('DESYNC', { round: hg && hg.round, activePlayer: hg && hg.activePlayer, diffs: d.slice(0, 10) });
    }
  }

  // ── 5) DISCONNECT / REJOIN probe ──
  log('\n— Disconnect/rejoin probe: drop guest socket, expect 90s window + rejoin —');
  try {
    const beforeNet = await guest.evaluate(NET_FN);
    await guest.evaluate(() => { try { window._NET.socket.disconnect(); } catch (e) {} });
    await sleep(2500);
    const hostSawDC = await host.evaluate(() => !!(window._NET && window._NET.connected === false));
    log(`Host saw guest disconnect (connected=false): ${hostSawDC}`);
    // attempt rejoin
    await guest.evaluate(() => { try { window._NET.socket.connect(); } catch (e) {} });
    await sleep(3000);
    const afterNet = await guest.evaluate(NET_FN);
    log(`Guest after reconnect: ${JSON.stringify(afterNet)}`);
    if (!afterNet.socketConnected) flag('rejoin-failed', { beforeNet, afterNet });
  } catch (e) { log('disconnect probe error: ' + e.message); }

  // ── WRAP UP ──
  await snap(host, 'online-host'); await snap(guest, 'online-guest');
  const finalH = await host.evaluate(DIGEST_FN);
  log('\n========================================');
  log(`Steps:${steps}  Desyncs:${desyncs}  Flags:${FLAGS.length}`);
  log(`Final (host): round ${finalH && finalH.round}, winner ${finalH && finalH.winner}, kills ${JSON.stringify(finalH && finalH.kills)}`);
  const byType = {}; FLAGS.forEach(f => byType[f.type] = (byType[f.type] || 0) + 1);
  log('Flag breakdown: ' + JSON.stringify(byType));
  log('========================================');

  fs.writeFileSync(`${SHOTS}/online-log.txt`, LOG.join('\n'));
  fs.writeFileSync(`${SHOTS}/online-flags.json`, JSON.stringify(FLAGS, null, 2));
  await browser.close();
})().catch(e => { console.error('FATAL', e); try { fs.writeFileSync(`${SHOTS}/online-flags.json`, JSON.stringify(FLAGS, null, 2)); } catch (_) {} process.exit(1); });
