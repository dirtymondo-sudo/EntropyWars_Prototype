// Entropy Wars — CUSTOM TDM 4v4 playtest with FULL 8-spell loadouts.
// Strategy: mirror the proven base-harness navigation EXACTLY (no pre-seal state
// mutation, which can wedge startMatch), then once the battle has begun, force
// every Player-1 unit to carry a full 8-slot spell loadout (native school + a
// secondary job's school + damage fillers). Units themselves are the game's
// random auto-fill ("random units"). Plays P1 with real tactics, then reports.
const { chromium } = require('playwright');
const fs = require('fs');
const MODE = 'tdm';
const SHOTS = __dirname + '/shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
async function snap(page, name) { try { await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 7000, animations: 'disabled' }); } catch (e) {} }

// Injected once on window: builds a full 8-spell loadout for a class (+secondary).
const LOADOUT_BUILDER = `
  (function(){
    var DMG = new Set(['damage','ricochet','multiHit','aoe','barrage','lifeDrain','line','linePush','cross','aoePull','splitBeam','displacement','pull','dash','skyDrop','skyThrow','skySlam','leapStrike']);
    var LIB = window.SPELL_LIBRARY || [];
    window.__eligCache = window.__eligCache || {};
    function elig(cls){ if(!cls) return []; if(!window.__eligCache[cls]){ try { window.__eligCache[cls] = (window.getEligibleSpellsForClass(cls) || []); } catch(e){ window.__eligCache[cls] = []; } } return window.__eligCache[cls]; }
    function pickSecondary(cls){ var all = Object.keys(window.CLASS_TEMPLATES||{}); var opts = all.filter(function(c){return c && c!==cls;}); return opts[Math.floor(Math.random()*opts.length)] || ''; }
    window.__buildLoadout = function(cls, secondary){
      secondary = secondary || pickSecondary(cls);
      var seen = new Set(), out = [];
      function push(sp){ if(sp && sp.id && !seen.has(sp.id)){ seen.add(sp.id); out.push(sp); } }
      var nat = elig(cls), sec = elig(secondary);
      nat.filter(function(s){return DMG.has(s.kind);}).forEach(push); // native offense first
      sec.filter(function(s){return DMG.has(s.kind);}).forEach(push); // secondary offense
      nat.forEach(push); sec.forEach(push);                            // utility/heal/buff
      LIB.filter(function(s){return DMG.has(s.kind);}).forEach(push);  // pad to guarantee 8
      return { secondary: secondary, spells: out.slice(0,8) };
    };
  })();
`;

// Force every live P1 unit to carry a full 8-spell loadout. Returns a report.
const FORCE_SPELLS_FN = () => {
  const st = window.GAME.state;
  const p1 = st.units.filter(u => u.player === 1).sort((a, b) => a.id - b.id);
  const report = [];
  p1.forEach(u => {
    const built = window.__buildLoadout(u.cls, null);
    u.spells = built.spells.map(s => ({ ...s }));
    if (u.maxMp) u.mp = u.maxMp; else u.mp = Math.max(u.mp || 0, 130);
    report.push({ unit: u.name || u.cls, cls: u.cls, secondary: built.secondary, slots: u.spells.length, hp: u.maxHp, spells: u.spells.map(s => `${s.name}[${s.kind} c${s.cost}]`) });
  });
  return report;
};

// One active P1 unit's turn (same tactics as base harness).
const TURN_FN = () => {
  const G = window.GAME, st = G.state;
  window.__FLAGS = window.__FLAGS || [];
  if (!st || st.phase !== 'battle') return { status: 'not-battle' };
  if (st.winner != null) return { status: 'done', winner: st.winner };
  const id = st._blitzActiveUnitId;
  if (!id) return { status: 'no-active' };
  const unit = st.units.find(u => u.id === id);
  if (!unit || unit.dead) return { status: 'no-unit' };
  if (st.controllers[unit.player] !== 'local') return { status: 'ai-turn', player: unit.player };
  const DMG = new Set(['damage','ricochet','multiHit','aoe','barrage','lifeDrain','line','linePush','cross','aoePull','splitBeam','displacement','pull','dash','skyDrop','skyThrow','skySlam','leapStrike']);
  const D = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const enemies = () => st.units.filter(u => u.player !== unit.player && !u.dead && u.hp > 0);
  const logsSince = n => st.logEntries.slice(n).map(e => typeof e === 'string' ? e : e.m);
  const acted = [];
  for (let iter = 0; iter < 6; iter++) {
    if (unit.dead) break;
    let cast = false;
    try {
      const spells = (unit.spells || []).filter(s => DMG.has(s.kind) && G.canAffordSpell(unit, s) && (unit.mp || 0) >= (s.cost || 0) && !G.unitHasStatus(unit, 'silence'));
      for (const spell of spells) {
        const range = G.getSpellRangeTiles(unit, spell) || [];
        let pick = null;
        for (const t of range) { const tg = G.unitAt(t.x, t.y, t.z); if (tg && tg.player !== unit.player && !tg.dead) { if (!pick || tg.hp < pick.tg.hp) pick = { t, tg }; } }
        if (!pick) continue;
        st.selectedTool = spell.name; st.actionMode = 'spell';
        const L0 = st.logEntries.length;
        const ret = G.doSpell(unit, pick.t.x, pick.t.y, pick.t.z);
        const logs = logsSince(L0);
        st.selectedTool = null; st.actionMode = null;
        const blocked = logs.find(m => /Terrain blocks the spell path|out of range|hidden in the fog/i.test(m));
        if ((ret === 0 || ret === false) && blocked) {
          window.__FLAGS.push({ type: 'spell-rejected', spell: spell.name, kind: spell.kind, msg: blocked, round: st.round, unit: unit.name || unit.cls });
          acted.push(`🐞 ${spell.name} REJECTED → "${blocked}"`); continue;
        }
        if (ret && ret !== 0) { acted.push(`✨ ${spell.name} (${spell.kind}) on ${pick.tg.name || pick.tg.cls}`); cast = true; break; }
      }
    } catch (e) { acted.push('spellErr:' + e.message); }
    if (cast) break;
    let attacked = false;
    try {
      if (G.canUnitAct(unit)) {
        const tiles = G.getAttackTiles(unit) || []; let best = null;
        for (const t of tiles) { const tg = G.unitAt(t.x, t.y, t.z); if (tg && tg.player !== unit.player && !tg.dead) { if (!best || tg.hp < best.tg.hp) best = { t, tg }; } }
        if (best) { G.doAttack(unit, best.t.x, best.t.y, best.t.z); acted.push(`⚔ ${best.tg.name || best.tg.cls}`); attacked = true; }
      }
    } catch (e) { acted.push('atkErr:' + e.message); }
    if (attacked) break;
    let moved = false;
    try {
      if (G.canUnitMove(unit)) {
        const es = enemies();
        if (es.length) {
          let ne = es[0]; for (const e of es) if (D(unit, e) < D(unit, ne)) ne = e;
          const tiles = G.getMoveTiles(unit) || []; let bt = null, bd = D(unit, ne);
          for (const t of tiles) { const d = Math.abs(t.x - ne.x) + Math.abs(t.y - ne.y); if (d < bd) { bd = d; bt = t; } }
          if (bt) {
            const px = unit.x, py = unit.y, L0 = st.logEntries.length;
            const ret = G.doMove(unit, bt.x, bt.y, bt.z); const logs = logsSince(L0);
            if (ret === false || (unit.x === px && unit.y === py)) {
              const inval = logs.find(m => /Invalid move|already (acted|used)/i.test(m)) || '(silently refused)';
              if (/Invalid move|silently/i.test(inval)) { window.__FLAGS.push({ type: 'move-rejected', from: { x: px, y: py }, to: { x: bt.x, y: bt.y, cost: bt.cost }, ap: unit.ap, msg: inval, round: st.round, unit: unit.name || unit.cls }); acted.push(`🐞 move (${bt.x},${bt.y}) REJECTED → "${inval}"`); }
            } else { acted.push(`➡ (${bt.x},${bt.y})`); moved = true; }
          }
        }
      }
    } catch (e) { acted.push('mvErr:' + e.message); }
    if (!moved) break;
  }
  unit.ap = 0; try { window.endUnitIfDone(unit); } catch (e) {}
  return { status: 'played', name: unit.name || unit.cls || ('u' + id), acted, flags: window.__FLAGS.length };
};

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox','--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0]));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 });
  await sleep(9000);
  console.log('Game loaded. Custom TDM 4v4 vs CPU (full 8-spell loadouts)...');
  // --- navigation IDENTICAL to base harness (no pre-seal state mutation) ---
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);
  const picked = await page.evaluate(() => { const rx = /death\s*match/i; const el = [...document.querySelectorAll('.ms-mode-card')].find(b => rx.test(b.innerText || '')); if (el) { el.click(); return el.innerText.replace(/\s+/g, ' ').slice(0, 30); } return null; });
  console.log('Mode card:', picked);
  await sleep(1200);
  await page.evaluate(() => { const b = document.querySelector('.ms-btn-primary') || [...document.querySelectorAll('button')].find(x => /CONFIRM/i.test(x.innerText)); if (b) b.click(); });
  await sleep(2500);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => /SEAL YOUR FATE/i.test(x.innerText)); if (b) b.click(); }); await sleep(1500); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  for (let i = 0; i < 30; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'ai' }; });
  console.log('[stage] battle started.');

  // --- now (post-start) force full 8-spell loadouts on every P1 unit ---
  await page.evaluate(LOADOUT_BUILDER);
  const forced = await page.evaluate(FORCE_SPELLS_FN);
  console.log('\nP1 loadouts (all slots forced to 8):');
  forced.forEach(u => console.log(`  ${u.cls} "${u.unit}" (hp ${u.hp}, 2nd job ${u.secondary}) — ${u.slots} slots:\n      ${u.spells.join(', ')}`));
  console.log(`  >> all 8 slots filled on every unit: ${forced.every(u => u.slots === 8) ? 'YES' : 'NO'}`);

  const meta = await page.evaluate(() => { const st = window.GAME.state, mp = window.getActiveMultiplayerMode ? window.getActiveMultiplayerMode() : {}; const team = p => st.units.filter(u => u.player === p).map(u => `${u.cls}`); const bw = window.GAME.bw(), bh = window.GAME.bh(); const cols = st.boardHeights ? st.boardHeights.length : null, rows = (st.boardHeights && st.boardHeights[0]) ? st.boardHeights[0].length : null; return { mode: mp.id, roundLimit: mp.roundLimit || st.matchClock?.roundLimit, p1: team(1), p2: team(2), board: `${bw}x${bh}`, actualGrid: `${cols}x${rows}` }; });
  console.log(`\nMode=${meta.mode} roundLimit=${meta.roundLimit} board(config)=${meta.board} board(actual grid)=${meta.actualGrid}\n  P1 classes: ${meta.p1.join(', ')}\n  P2 classes: ${meta.p2.join(', ')}\n`);
  if (meta.board !== '8x8') console.log('  ⚠ board is NOT 8x8 — TDM may force its own size; see analysis.');

  let lastRound = -1, shots = 0, stalls = 0, winner = null;
  const start = Date.now();
  while (Date.now() - start < 540000) {
    const r = await page.evaluate(TURN_FN);
    const st = await page.evaluate(() => { const s = window.GAME.state; const a = p => s.units.filter(u => u.player === p && !u.dead && u.hp > 0).length; return { round: s.round, winner: s.winner, p1: a(1), p2: a(2), kills: s.matchKills }; });
    if (st.winner != null) { winner = st.winner; break; }
    if (st.round !== lastRound) { lastRound = st.round; console.log(`\n── Round ${st.round}/${meta.roundLimit} ── alive me:${st.p1} cpu:${st.p2} kills:${JSON.stringify(st.kills)}`); if (shots < 10) { await snap(page, `${MODE}-custom-r${String(st.round).padStart(2, '0')}`); shots++; } }
    if (r.status === 'played') { if (r.acted.length) console.log(`  ${r.name}: ${r.acted.join(' | ')}`); stalls = 0; await sleep(120); }
    else if (r.status === 'ai-turn') { await page.evaluate(() => { try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(160); stalls = 0; }
    else { await page.evaluate(() => { try { window.maybeAdvanceTurn(); } catch (e) {} try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(180); if (++stalls > 120) { console.log('(stalled — stopping)'); break; } }
  }

  await sleep(1200); await snap(page, `${MODE}-custom-result`);
  const fin = await page.evaluate(() => { const st = window.GAME.state; const log = (st._fullLogEntries || st.logEntries || []).map(e => typeof e === 'string' ? e : e.m); const a = p => st.units.filter(u => u.player === p && !u.dead && u.hp > 0).length; return { winner: st.winner, round: st.round, p1: a(1), p2: a(2), kills: st.matchKills, log, flags: window.__FLAGS || [] }; });
  fs.writeFileSync(`${SHOTS}/${MODE}-custom-combat-log.txt`, fin.log.join('\n'));
  fs.writeFileSync(`${SHOTS}/${MODE}-custom-flags.json`, JSON.stringify(fin.flags, null, 2));
  fs.writeFileSync(`${SHOTS}/${MODE}-custom-loadouts.json`, JSON.stringify(forced, null, 2));
  console.log('\n========================================');
  const who = fin.winner === 1 ? '🏆 I WIN (P1)' : fin.winner === 2 ? '💀 CPU wins' : fin.winner === 0 ? '⚖️ Draw/No-contest' : `stopped (winner=${fin.winner})`;
  console.log(`${who} — round ${fin.round}, kills ${JSON.stringify(fin.kills)}, alive me:${fin.p1} cpu:${fin.p2}`);
  console.log(`🐞 Bugs flagged: ${fin.flags.length}`);
  console.log('========================================');
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
