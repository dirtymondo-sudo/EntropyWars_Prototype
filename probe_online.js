// Focused probe: start a friendly online match, reach the first P2 (guest) turn,
// and dump exactly what the host last broadcast vs. what the guest applied,
// to localize the "guest never learns the active unit" deadlock.
const { chromium } = require('playwright');
const { installAssetCache } = require('./asset_cache');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);

async function waitFor(page, fn, ms, every = 400) {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await sleep(every); }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage'] });
  const mk = async () => { const ctx = await browser.newContext({ viewport: { width: 1100, height: 720 }, ignoreHTTPSErrors: true }); await installAssetCache(ctx); return ctx.newPage(); };
  const host = await mk(), guest = await mk();
  host.on('pageerror', e => log('[HOST] ERR', e.message.split('\n')[0]));
  guest.on('pageerror', e => log('[GUEST] ERR', e.message.split('\n')[0]));

  await host.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 120000 });
  await sleep(2000);
  await guest.goto('http://localhost:3000/', { waitUntil: 'commit', timeout: 120000 });
  // engine loads ~35 R2 scripts; wait until the globals appear (slow under R2 throttling)
  const hOk = await waitFor(host, () => !!(window._NET && window.startMatch && window._gameState), 240000, 1500);
  const gOk = await waitFor(guest, () => !!(window._NET && window.startMatch && window._gameState), 240000, 1500);
  log('engine loaded host:', hOk, 'guest:', gOk);
  await sleep(3000);

  // room
  await host.evaluate(() => window.lobbyCreateRoom && window.lobbyCreateRoom());
  await waitFor(host, () => !!(window._NET && window._NET.roomCode), 15000);
  const code = await host.evaluate(() => window._NET && window._NET.roomCode);
  log('room code', code);
  await guest.evaluate((c) => {
    let i = document.getElementById('lobbyJoinInput');
    if (!i) { i = document.createElement('input'); i.id = 'lobbyJoinInput'; document.body.appendChild(i); }
    i.value = c; window.lobbyJoinRoom && window.lobbyJoinRoom();
  }, code);
  await waitFor(host, () => window._NET && window._NET.online === true, 20000);
  await waitFor(guest, () => window._NET && window._NET.online === true, 20000);
  await sleep(3000);

  // lock + start
  await guest.evaluate(() => { const s = window._gameState; if (s) s.teamLockedIn = true; try { window.applyPartyBuild(false); } catch (e) {} });
  await sleep(1800);
  await host.evaluate(() => { const s = window._gameState; if (s) s.teamLockedIn = true; try { window.applyPartyBuild(false); } catch (e) {} });
  await sleep(1800);
  await host.evaluate(() => {
    const N = window._NET; const L = N && N._lockState; if (L) { L.host = true; L.guestPartyReceived = true; }
    const s = window._gameState; if (s) s.teamLockedIn = true;
    try { window.startMatch(); } catch (e) {}
  });
  await waitFor(host, () => { const s = window._gameState; return s && s.phase === 'battle'; }, 20000);
  await waitFor(guest, () => { const s = window._gameState; return s && s.phase === 'battle'; }, 25000);
  log('battle started');

  // ── START-HANDOFF DIAGNOSTIC ──
  // Capture who has the first turn and whether the guest agrees, BEFORE anyone
  // plays. The full harness saw `activePlayer host=2 guest=1` when P2 won
  // initiative — i.e. the guest never learns the battle opened on its turn.
  await sleep(2500); // let the initial battle-start sync settle on the guest
  const SNAP = () => { const s = window._gameState; return { phase: s.phase, ap: s.activePlayer, blitz: s._blitzActiveUnitId, sel: s.selectedUnitId }; };
  let h0 = await host.evaluate(SNAP), g0 = await guest.evaluate(SNAP);
  log('start handoff — host:', JSON.stringify(h0), ' guest:', JSON.stringify(g0));
  if (h0.ap !== g0.ap) {
    log(`  ⚠ ACTIVEPLAYER DESYNC at start (host=${h0.ap} guest=${g0.ap}) — first-turn=${h0.ap === 2 ? 'P2/guest' : 'P1'}`);
    // Does a forced host re-broadcast (bypassing the dedup) recover the guest?
    await host.evaluate(() => { try { window._NET.lastSyncJson = ''; window._broadcastState(); } catch (e) {} });
    await sleep(2000);
    const g1 = await guest.evaluate(SNAP);
    log('  guest after forced host re-broadcast:', JSON.stringify(g1),
        g1.ap === h0.ap ? ' → RECOVERED (lost/deduped broadcast)' : ' → STILL DESYNCED (deeper)');
  } else {
    log('  start handoff OK (host & guest agree on activePlayer)');
  }

  // Host plays its P1 units (local/authoritative) until the turn flips to P2.
  const HOST_PLAY_P1 = () => {
    const G = window.GAME, st = G.state;
    if (!st || st.phase !== 'battle' || st.winner != null) return { s: 'done' };
    if (st.activePlayer !== 1) return { s: 'not-p1', ap: st.activePlayer };
    const u = st.units.find(x => x.id === st._blitzActiveUnitId);
    if (!u || u.dead || u.player !== 1) return { s: 'no-unit' };
    try {
      const atk = (G.getAttackTiles(u) || []).map(t => ({ t, tg: G.unitAt(t.x, t.y, t.z) })).filter(o => o.tg && o.tg.player !== 1 && !o.tg.dead)[0];
      if (atk) G.doAttack(u, atk.t.x, atk.t.y, atk.t.z);
    } catch (e) {}
    u.ap = 0;
    try { window.triggerEndTurn(); } catch (e) { try { window.endUnitIfDone(u); } catch (e2) {} }
    try { window._broadcastState(); } catch (e) {}
    return { s: 'played', id: u.id };
  };
  let reached = false;
  for (let i = 0; i < 30; i++) {
    const ap = await host.evaluate(() => window._gameState && window._gameState.activePlayer);
    if (ap === 2) { reached = true; break; }
    const r = await host.evaluate(HOST_PLAY_P1);
    await sleep(700);
    if (r && r.s === 'done') break;
  }
  log('reached P2 turn on host:', reached);
  await sleep(1500); // let the broadcast settle on the guest

  const PROBE_HOST = () => {
    const s = window._gameState, N = window._NET;
    let lastSync = null;
    try { lastSync = N && N.lastSyncJson ? JSON.parse(N.lastSyncJson) : null; } catch (e) { lastSync = 'parse-err'; }
    return {
      activePlayer: s.activePlayer,
      blitz: s._blitzActiveUnitId,
      lastSync_activePlayer: lastSync && lastSync.activePlayer,
      lastSync_blitz: lastSync && lastSync._blitzActiveUnitId,
      lastSync_hasBlitzKey: lastSync && Object.prototype.hasOwnProperty.call(lastSync, '_blitzActiveUnitId'),
      syncThrottle: !!(N && N.syncThrottle),
      syncPending: !!(N && N._syncPending),
      p2alive: s.units.filter(u => u.player === 2 && !u.dead && (u.ap || 0) > 0).map(u => u.id),
    };
  };
  const PROBE_GUEST = () => {
    const s = window._gameState;
    return {
      activePlayer: s.activePlayer,
      blitz: s._blitzActiveUnitId,
      prevActiveUnitId: s._guestPrevActiveUnitId,
      selectedUnitId: s.selectedUnitId,
      p2alive: s.units.filter(u => u.player === 2 && !u.dead && (u.ap || 0) > 0).map(u => u.id),
    };
  };

  log('\n=== HOST ===');  log(JSON.stringify(await host.evaluate(PROBE_HOST), null, 2));
  log('\n=== GUEST ==='); log(JSON.stringify(await guest.evaluate(PROBE_GUEST), null, 2));

  // CAN A HUMAN GUEST ACTUALLY PLAY? Drive the guest using the UI-selected
  // unit (state.selectedUnitId), not _blitzActiveUnitId, through the real emitters.
  log('\n— driving guest via selectedUnitId (simulating a human clicking) —');
  const GUEST_PLAY = () => {
    const G = window.GAME, st = window._gameState;
    if (st.activePlayer !== 2) return { s: 'not-p2', ap: st.activePlayer };
    const id = st.selectedUnitId || st._blitzActiveUnitId;
    const u = st.units.find(x => x.id === id && !x.dead && x.player === 2);
    if (!u) return { s: 'no-unit', sel: st.selectedUnitId };
    const acted = [];
    try {
      window.selectUnit(u.id);
      const atk = (G.getAttackTiles(u) || []).map(t => ({ t, tg: G.unitAt(t.x, t.y, t.z) })).filter(o => o.tg && o.tg.player !== 2 && !o.tg.dead)[0];
      if (atk) { window.setActionMode('attack'); window.clickTile(atk.t.x, atk.t.y); acted.push('atk'); }
      else {
        const en = st.units.filter(x => x.player !== 2 && !x.dead);
        if (en.length && G.canUnitMove(u)) {
          let ne = en[0]; for (const e of en) if (Math.abs(e.x-u.x)+Math.abs(e.y-u.y) < Math.abs(ne.x-u.x)+Math.abs(ne.y-u.y)) ne = e;
          const tiles = G.getMoveTiles(u) || []; let bt = null, bd = 1e9;
          for (const t of tiles) { const d = Math.abs(t.x-ne.x)+Math.abs(t.y-ne.y); if (d < bd) { bd = d; bt = t; } }
          if (bt) { window.setActionMode('move'); window.clickTile(bt.x, bt.y); acted.push('mv'); }
        }
      }
    } catch (e) { acted.push('err:' + e.message); }
    try { window.triggerEndTurn(); } catch (e) {}
    return { s: 'played', id: u.id, acted };
  };
  let p2turns = 0, p1seen = false;
  for (let i = 0; i < 24; i++) {
    const ap = await host.evaluate(() => window._gameState && window._gameState.activePlayer);
    if (ap === 1) { p1seen = true; await host.evaluate(HOST_PLAY_P1); await sleep(700); continue; }
    const r = await guest.evaluate(GUEST_PLAY);
    if (r.s === 'played') { p2turns++; log('  guest played', r.id, JSON.stringify(r.acted)); }
    else log('  guest', JSON.stringify(r));
    await sleep(900);
  }
  log(`\nRESULT: guest played ${p2turns} unit-turns; control returned to P1 at least once: ${p1seen}`);
  log('final host:', JSON.stringify(await host.evaluate(() => { const s = window._gameState; return { round: s.round, activePlayer: s.activePlayer, kills: s.matchKills, winner: s.winner }; })));

  await browser.close();
})().catch(e => { console.error('PROBE FATAL', e); process.exit(1); });
