// Entropy Wars — single FILLER BOT driver.
//
// Drives ONE headless browser client through the REAL online path (server.js +
// online.js from R2), exactly like one half of playtest_online.js, but against a
// human opponent instead of a second scripted browser:
//   • seeds a profile + server token into localStorage so the client logs in as a
//     real account (ranked ELO only counts when BOTH sockets are authenticated),
//   • announces itself to the server with `bot-hello` (so /api/queue-stats can tell
//     humans from bots),
//   • joins the ranked queue for one (teamSize, mode),
//   • on match-found, runs the ranked auto-start handshake (a single
//     applyPartyBuild — the host auto-starts once both sides have locked),
//   • plays its side until someone wins, the queue times out, or the opponent
//     leaves, then closes.
//
// Tactics reuse the proven loops from playtest_online.js / playtest_smart.js:
//   HOST (myPlayer 1, authoritative engine): full focus-fire + spells + heals,
//     executed engine-direct, then broadcasts state.
//   GUEST (myPlayer 2, thin client): focus-fire attack/move through the real
//     online emitters (selectUnit/setActionMode/clickTile/triggerEndTurn).
//
// This file exports runBot(); bots.js (the manager) calls it. It is dev tooling
// like the other playtest_*.js scripts — NOT part of the R2 game bundle.

const { chromium } = require('playwright');
const { installAssetCache } = require('./asset_cache');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── in-page: a comparable digest of the live game state ──
const DIGEST_FN = () => {
  const st = window._gameState || (window.GAME && window.GAME.state);
  if (!st) return null;
  const alive = p => (st.units || []).filter(u => u.player === p && !u.dead && u.hp > 0).length;
  return {
    phase: st.phase, round: st.round, activePlayer: st.activePlayer,
    winner: st.winner, kills: st.matchKills, p1: alive(1), p2: alive(2),
  };
};

// ── in-page: NET status ──
const NET_FN = () => {
  const N = window._NET || {};
  return {
    online: !!N.online, connected: !!N.connected, role: N.role, myPlayer: N.myPlayer,
    roomCode: N.roomCode, ranked: !!N.ranked,
    socketConnected: !!(N.socket && N.socket.connected),
    autoStartFired: !!N._autoStartFired,
  };
};

// ── in-page: HOST turn (authoritative). Plays at a given `skill` ∈ [0,1]: at
//    skill 1 it's the full focus-fire + spells + heal play (≈ a strong human);
//    as skill drops it casts fewer spells, stops securing kills, picks worse
//    targets, wanders, and sometimes ends early — the levers the game's own AI
//    weights govern (kill bonus, focus, support). Then it broadcasts. ──
const HOST_TURN = (skill) => {
  const G = window.GAME, st = window._gameState || (G && G.state);
  if (!st || st.phase !== 'battle' || st.winner != null) return { s: 'done' };
  if (st.activePlayer !== 1) return { s: 'not-mine', ap: st.activePlayer };
  const id = st._blitzActiveUnitId;
  if (!id) return { s: 'no-active' };
  const unit = st.units.find(u => u.id === id);
  if (!unit || unit.dead || unit.player !== 1) return { s: 'no-unit' };

  const R = Math.random;
  const sk = typeof skill === 'number' ? skill : 0.8;
  // per-activation skill rolls — what THIS unit bothers to do well this turn
  const useSpells = R() < (0.15 + 0.85 * sk);   // weak bots mostly basic-attack
  const focusFire = R() < (0.20 + 0.80 * sk);   // else hit a random valid target
  const secureKills = R() < (0.30 + 0.70 * sk); // else ignore the kill opportunity
  const doSupport = sk > 0.45;                   // revive/heal only at decent skill

  const DMG = new Set(['damage','ricochet','multiHit','aoe','barrage','lifeDrain','line','linePush','cross','aoePull','splitBeam','displacement','pull','dash','skyDrop','skyThrow','skySlam','leapStrike']);
  const HEALER = new Set(['White Mage','Psychic','Harvester']);
  const D = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const enemies = () => st.units.filter(u => u.player !== 1 && !u.dead && u.hp > 0);
  const allies = () => st.units.filter(u => u.player === 1 && u.id !== unit.id);
  const acted = [];

  const baseDmg = sp => sp.dmg || (sp.hitDamages ? sp.hitDamages.reduce((a, b) => a + b, 0) : 0) || (sp.kind === 'barrage' || sp.kind === 'aoe' ? 120 : 90);
  const mult = (tg, sp) => { try { return window.getTypeDamageMultiplier(unit, tg, sp.spellType) || 1; } catch (e) { return 1; } };
  const estSpell = (tg, sp) => baseDmg(sp) * mult(tg, sp) * (sp.guaranteedCrit ? 1.5 : 1);
  const estAtk = tg => (unit.atk || 60) * 1.6 * (() => { try { return window.getTypeDamageMultiplier(unit, tg, null) || 1; } catch (e) { return 1; } })();
  const scoreDmg = (tg, est) => {
    let s = est;
    if (secureKills && est >= tg.hp) s += 50000;
    s += (tg.maxHp - tg.hp) * 1.5;
    if (HEALER.has(tg.cls)) s += 4000;
    return s;
  };

  try {
    for (let iter = 0; iter < 8; iter++) {
      if (unit.dead || (unit.ap || 0) <= 0) break;
      // blunder: weaker bots sometimes quit early, wasting remaining AP
      if (iter > 0 && R() < (1 - sk) * 0.18) break;

      // 0) healer support: revive then heal a critical ally (skilled bots only)
      if (doSupport && HEALER.has(unit.cls)) {
        try {
          const revive = (unit.spells || []).find(s => s.kind === 'revive' && G.canAffordSpell(unit, s) && (unit.mp || 0) >= (s.cost || 0));
          if (revive) {
            const dead = st.units.filter(u => u.player === 1 && (u.dead || u.hp <= 0));
            const range = G.getSpellRangeTiles(unit, revive) || [];
            for (const d of dead) { if (range.some(t => t.x === d.x && t.y === d.y)) { st.selectedTool = revive.name; st.actionMode = 'spell'; const r = G.doSpell(unit, d.x, d.y, d.z); st.selectedTool = null; st.actionMode = null; if (r) { acted.push('REVIVE'); break; } } }
          }
          const heal = (unit.spells || []).find(s => (s.kind === 'heal' || s.kind === 'healAll') && G.canAffordSpell(unit, s) && (unit.mp || 0) >= (s.cost || 0));
          if (heal) {
            const hurt = allies().filter(a => !a.dead && a.hp > 0 && a.hp < a.maxHp * 0.4).sort((x, y) => (x.hp / x.maxHp) - (y.hp / y.maxHp))[0];
            if (hurt) { const range = G.getSpellRangeTiles(unit, heal) || []; if (range.some(t => t.x === hurt.x && t.y === hurt.y)) { st.selectedTool = heal.name; st.actionMode = 'spell'; const r = G.doSpell(unit, hurt.x, hurt.y, hurt.z); st.selectedTool = null; st.actionMode = null; if (r) { acted.push('HEAL'); continue; } } }
          }
        } catch (e) {}
      }

      // 1) collect candidate damage actions (spells only if this unit bothers), then
      //    pick the best (focusFire) or a random one (sloppy play).
      let cands = [];
      try {
        if (useSpells) {
          const spells = (unit.spells || []).filter(s => DMG.has(s.kind) && G.canAffordSpell(unit, s) && (unit.mp || 0) >= (s.cost || 0) && !G.unitHasStatus(unit, 'silence'));
          for (const sp of spells) {
            const range = G.getSpellRangeTiles(unit, sp) || [];
            for (const t of range) { const tg = G.unitAt(t.x, t.y, t.z); if (tg && tg.player !== 1 && !tg.dead && tg.hp > 0) { const est = estSpell(tg, sp); cands.push({ kind: 'spell', sp, tg, t, est, score: scoreDmg(tg, est) }); } }
          }
        }
        if (G.canUnitAct(unit)) { for (const t of (G.getAttackTiles(unit) || [])) { const tg = G.unitAt(t.x, t.y, t.z); if (tg && tg.player !== 1 && !tg.dead && tg.hp > 0) { const est = estAtk(tg); cands.push({ kind: 'atk', tg, t, est, score: scoreDmg(tg, est) - 1 }); } } }
      } catch (e) {}

      let best = null;
      if (cands.length) best = focusFire ? cands.reduce((a, b) => b.score > a.score ? b : a) : cands[Math.floor(R() * cands.length)];

      if (best) {
        try {
          if (best.kind === 'spell') { st.selectedTool = best.sp.name; st.actionMode = 'spell'; const r = G.doSpell(unit, best.t.x, best.t.y, best.t.z); st.selectedTool = null; st.actionMode = null; if (r && r !== 0) { acted.push((secureKills && best.est >= best.tg.hp ? 'KILL ' : '') + best.sp.name); continue; } }
          else { G.doAttack(unit, best.t.x, best.t.y, best.t.z); acted.push((secureKills && best.est >= best.tg.hp ? 'KILL ' : '') + 'atk'); continue; }
        } catch (e) {}
      }

      // 2) no action in range → move toward the weakest enemy (focusFire) or wander
      let moved = false;
      try {
        if (G.canUnitMove(unit)) {
          const es = enemies();
          if (es.length) {
            const tiles = G.getMoveTiles(unit) || [];
            let bt = null;
            if (focusFire) {
              const goal = es.slice().sort((a, b) => a.hp - b.hp)[0];
              let bd = D(unit, goal);
              for (const t of tiles) { const d = Math.abs(t.x - goal.x) + Math.abs(t.y - goal.y); if (d < bd) { bd = d; bt = t; } }
            } else if (tiles.length) {
              bt = tiles[Math.floor(R() * tiles.length)]; // wander
            }
            if (bt) { const px = unit.x, py = unit.y; const r = G.doMove(unit, bt.x, bt.y, bt.z); if (r !== false && !(unit.x === px && unit.y === py)) { acted.push('move'); moved = true; } }
          }
        }
      } catch (e) {}
      if (!moved) break;
    }
  } catch (e) { acted.push('err:' + e.message); }

  unit.ap = 0;
  try { window.triggerEndTurn(); } catch (e) { try { window.endUnitIfDone(unit); } catch (e2) {} }
  try { window._broadcastState(); } catch (e) {}
  return { s: 'played', name: unit.name || unit.cls, acted };
};

// ── in-page: GUEST turn (thin client) via real online emitters. Same `skill`
//    knob as the host: at high skill it focus-fires the weakest reachable enemy;
//    at low skill it picks a random target and wanders. (Guest plays basic
//    attack/move — the proven relay path; spells stay host-side in v1.) ──
const GUEST_TURN = (skill) => {
  const G = window.GAME, st = window._gameState || (G && G.state);
  if (!st || st.phase !== 'battle' || st.winner != null) return { s: 'done' };
  if (st.activePlayer !== 2) return { s: 'not-mine', ap: st.activePlayer };
  let id = st.selectedUnitId || st._blitzActiveUnitId;
  let u = st.units.find(x => x.id === id && !x.dead && x.player === 2 && (x.ap || 0) > 0);
  if (!u) u = st.units.find(x => x.player === 2 && !x.dead && (x.ap || 0) > 0);
  if (!u) return { s: 'no-unit' };
  const R = Math.random;
  const sk = typeof skill === 'number' ? skill : 0.8;
  const focusFire = R() < (0.20 + 0.80 * sk);
  const D = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const en = st.units.filter(x => x.player !== 2 && !x.dead && x.hp > 0);
  const acted = [];
  try {
    window.selectUnit(u.id);
    const atks = (G.getAttackTiles(u) || []).map(t => ({ t, tg: G.unitAt(t.x, t.y, t.z) })).filter(o => o.tg && o.tg.player !== 2 && !o.tg.dead);
    const atk = atks.length ? (focusFire ? atks.sort((a, b) => a.tg.hp - b.tg.hp)[0] : atks[Math.floor(R() * atks.length)]) : null;
    if (atk) { window.setActionMode('attack'); window.clickTile(atk.t.x, atk.t.y); acted.push('atk'); }
    else if (en.length && G.canUnitMove(u)) {
      const tiles = G.getMoveTiles(u) || []; let bt = null;
      if (focusFire) {
        let ne = en[0]; for (const e of en) if (D(u, e) < D(u, ne)) ne = e;
        let bd = D(u, ne);
        for (const t of tiles) { const d = Math.abs(t.x - ne.x) + Math.abs(t.y - ne.y); if (d < bd) { bd = d; bt = t; } }
      } else if (tiles.length) {
        bt = tiles[Math.floor(R() * tiles.length)];
      }
      if (bt) { window.setActionMode('move'); window.clickTile(bt.x, bt.y); acted.push('move'); }
    }
  } catch (e) { acted.push('err:' + e.message); }
  try { window.triggerEndTurn(); } catch (e) {}
  return { s: 'played', name: u.name || u.cls, acted };
};

async function waitFor(page, fn, ms, every = 500) {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { if (await page.evaluate(fn)) return true; } catch (e) {} await sleep(every); }
  return false;
}

// Map an ELO rating to a skill level ∈ [0.05, 1] for the play tactics, so a bot
// pinned near the player's rating actually plays at roughly that strength.
const SKILL_ELO_MIN = parseInt(process.env.BOT_SKILL_ELO_MIN, 10) || 500;
const SKILL_ELO_MAX = parseInt(process.env.BOT_SKILL_ELO_MAX, 10) || 1800;
function eloToSkill(elo) {
  if (typeof elo !== 'number' || !isFinite(elo)) return 0.6;
  return Math.max(0.05, Math.min(1, (elo - SKILL_ELO_MIN) / (SKILL_ELO_MAX - SKILL_ELO_MIN)));
}

// Run one filler bot to completion. Returns a small result summary.
//   opts: { serverUrl, teamSize, mode, account:{id,token,username,elo},
//           elo (for skill if unauthenticated), skill (override 0..1),
//           queueTimeoutMs, matchTimeoutMs, headless, useAssetCache, log }
async function runBot(opts = {}) {
  const serverUrl = opts.serverUrl || 'http://localhost:3000';
  const teamSize = opts.teamSize || 4;
  const mode = opts.mode || 'arena';
  const account = opts.account || null; // unauthenticated if null (no ELO, fine for testing)
  const queueTimeoutMs = opts.queueTimeoutMs || 60000;
  const matchTimeoutMs = opts.matchTimeoutMs || 25 * 60 * 1000;
  const headless = opts.headless !== false;
  const useAssetCache = opts.useAssetCache !== false;
  const tag = (account && account.username) || 'bot';
  const log = opts.log || ((...a) => console.log(`[${tag}]`, ...a));
  // Strength scales with the rating the bot is playing at (its synced ELO, or
  // the human's ELO if running unauthenticated), unless an explicit skill given.
  const playElo = (account && typeof account.elo === 'number') ? account.elo
                : (typeof opts.elo === 'number') ? opts.elo : 1200;
  const skill = (typeof opts.skill === 'number') ? opts.skill : eloToSkill(playElo);

  const result = { tag, mode, teamSize, skill: +skill.toFixed(2), playElo, matched: false, started: false, finished: false, winner: null, myPlayer: null, reason: '' };
  let browser = null;
  try {
    browser = await chromium.launch({
      headless,
      args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage'],
    });
    const ctx = await browser.newContext({ viewport: { width: 900, height: 640 }, ignoreHTTPSErrors: true });
    if (useAssetCache) { try { await installAssetCache(ctx); } catch (e) {} }

    // Seed login credentials + an active profile BEFORE any page script runs.
    if (account) {
      await ctx.addInitScript((c) => {
        try {
          localStorage.setItem('ew-profile-0', JSON.stringify({
            version: 1, username: c.username, createdAt: new Date().toISOString(),
            elo: c.elo || 1000, peakElo: c.elo || 1000,
          }));
          localStorage.setItem('ew-active-profile', '0');
          if (c.id && c.token) {
            localStorage.setItem('ew-server-id', c.id);
            localStorage.setItem('ew-server-token', c.token);
          }
        } catch (e) {}
      }, account);
    }

    const page = await ctx.newPage();
    page.on('pageerror', e => log('PAGEERR', (e.message || '').split('\n')[0]));

    log(`loading ${serverUrl} …`);
    await page.goto(serverUrl + '/', { waitUntil: 'commit', timeout: 120000 });
    const ready = await waitFor(page, () => !!(window._NET && window.lobbyJoinQueue && window.applyPartyBuild && (window._gameState || (window.GAME && window.GAME.state))), 240000, 1500);
    if (!ready) { result.reason = 'engine-load-failed'; log('engine did not load'); return result; }

    // ── join the queue ──
    log(`queueing ${teamSize}v${teamSize} ${mode} …`);
    await page.evaluate(({ ts, md }) => {
      // _queueTeamSize/_queueMode are module-scoped closure vars; these public
      // setters (used by the lobby UI) are the only way to drive them.
      try { if (window.lobbySetQueueSize) window.lobbySetQueueSize(ts); } catch (e) {}
      try { if (window.lobbySetQueueMode) window.lobbySetQueueMode(md); } catch (e) {}
      window.lobbyJoinQueue();
    }, { ts: teamSize, md: mode });

    // announce ourselves as a bot once the socket exists (retro-tagged server-side)
    await waitFor(page, () => !!(window._NET && window._NET.socket && window._NET.socket.connected), 15000);
    await page.evaluate(() => { try { window._NET.socket.emit('bot-hello'); } catch (e) {} });

    // ── wait for a match (or give up so we don't idle the queue forever) ──
    const matched = await waitFor(page, () => window._NET && window._NET.online === true, queueTimeoutMs, 800);
    if (!matched) {
      result.reason = 'queue-timeout';
      log('no match within queue window — leaving');
      await page.evaluate(() => { try { window._NET.socket.emit('queue-leave'); } catch (e) {} });
      return result;
    }
    result.matched = true;
    await sleep(2500); // _enterOnlineMode runs ~1.5s after room-full
    const net = await page.evaluate(NET_FN);
    result.myPlayer = net.myPlayer;
    log(`matched — I am Player ${net.myPlayer} (${net.role})`);

    // ── ranked auto-start handshake: one applyPartyBuild locks us in; the host
    //    auto-starts once both sides have locked. Retry the lock a few times in
    //    case the opponent is still loading. ──
    let started = false;
    for (let i = 0; i < 30 && !started; i++) {
      await page.evaluate(() => { try { const s = window._gameState; if (s) s.teamLockedIn = true; window.applyPartyBuild(false); } catch (e) {} });
      started = await waitFor(page, () => { const s = window._gameState; return s && s.phase === 'battle'; }, 4000, 700);
    }
    if (!started) { result.reason = 'match-start-failed'; log('match never started'); return result; }
    result.started = true;
    log(`battle started — playing at skill ${skill.toFixed(2)} (ELO ~${playElo})`);

    // ── play loop ──
    const myP = net.myPlayer;
    const turnFn = myP === 1 ? HOST_TURN : GUEST_TURN;
    let lastRound = -1, stalls = 0, hostIdle = 0;
    const start = Date.now();
    while (Date.now() - start < matchTimeoutMs) {
      const d = await page.evaluate(DIGEST_FN);
      if (!d) { // page reloaded (opponent disconnect path reloads the client)
        if (++stalls > 20) { result.reason = 'state-lost'; break; }
        await sleep(1000); continue;
      }
      if (d.winner != null) { result.finished = true; result.winner = d.winner; log(`match over — winner P${d.winner}`); break; }
      if (d.round !== lastRound) { lastRound = d.round; log(`round ${d.round} (alive ${d.p1}v${d.p2}, kills ${JSON.stringify(d.kills)})`); }

      let r = { s: 'idle' };
      if (d.activePlayer === myP) r = await page.evaluate(turnFn, skill);

      if (r && r.s === 'played') { stalls = 0; hostIdle = 0; }
      else {
        stalls++;
        // The engine broadcasts each turn-handoff once; if the opponent missed
        // that single packet the match deadlocks with no resend (the known
        // "missed-broadcast" bug, PLAYTEST_NOTES). The host is authoritative, so
        // whenever it isn't making progress — whether it's idle waiting on the
        // remote player OR wedged on a finished unit — nudge the blitz pointer
        // and force a re-broadcast of the true state so a stuck opponent recovers.
        if (myP === 1 && (++hostIdle % 5 === 0)) {
          await page.evaluate(() => {
            try { window.maybeAdvanceTurn && window.maybeAdvanceTurn(); } catch (e) {}
            try { window._NET.lastSyncJson = ''; window._broadcastState(); } catch (e) {}
          });
        }
        if (stalls > 120) { result.reason = 'stalled'; log('stalled — stopping'); break; }
      }
      await sleep(myP === 1 ? 350 : 600);
    }
    if (!result.finished && !result.reason) result.reason = 'match-timeout';
    return result;
  } catch (e) {
    result.reason = 'exception:' + (e && e.message ? e.message.split('\n')[0] : e);
    return result;
  } finally {
    try { if (browser) await browser.close(); } catch (e) {}
  }
}

module.exports = { runBot };

// Allow `node bot_client.js [mode] [teamSize]` for a one-off manual test
// (unauthenticated — joins a queue and plays whoever it matches).
if (require.main === module) {
  const mode = process.argv[2] || 'arena';
  const teamSize = parseInt(process.argv[3], 10) || 4;
  runBot({ mode, teamSize, headless: true, queueTimeoutMs: 120000 })
    .then(r => { console.log('RESULT', JSON.stringify(r)); process.exit(0); })
    .catch(e => { console.error('FATAL', e); process.exit(1); });
}
