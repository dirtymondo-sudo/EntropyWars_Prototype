// Entropy Wars — SMART ARENA 4v4 on an 8x8 map.
// Arena scores (matchScores) via: KILLS, CHANNELING/controlling the Nexus, and
// DAMAGING the enemy TOWER. Agent: focus-fire + kill-secure (type-aware via
// getTypeDamageMultiplier), dedicates the closest unit to channel the Nexus,
// pressures towers[2] when in range, and revives/heals on the White Mage.
const { chromium } = require('playwright');
const fs = require('fs');
const MODE = 'arena';
const SHOTS = __dirname + '/shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
async function snap(page, name) { try { await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 6000, animations: 'disabled' }); } catch (e) {} }

const LOADOUT_BUILDER = `
  (function(){
    var DMG = new Set(['damage','ricochet','multiHit','aoe','barrage','lifeDrain','line','linePush','cross','aoePull','splitBeam','displacement','pull','dash','skyDrop','skyThrow','skySlam','leapStrike']);
    var LIB = window.SPELL_LIBRARY || [];
    window.__eligCache = window.__eligCache || {};
    function elig(c){ if(!c) return []; if(!window.__eligCache[c]){ try{ window.__eligCache[c]=(window.getEligibleSpellsForClass(c)||[]);}catch(e){window.__eligCache[c]=[];} } return window.__eligCache[c]; }
    function pickSec(c){ var a=Object.keys(window.CLASS_TEMPLATES||{}).filter(function(x){return x&&x!==c;}); return a[Math.floor(Math.random()*a.length)]||''; }
    window.__buildLoadout=function(cls,sec){
      sec=sec||pickSec(cls);
      var seen=new Set(),out=[];
      function push(s){ if(s&&s.id&&!seen.has(s.id)){seen.add(s.id);out.push(s);} }
      var nat=elig(cls),se=elig(sec);
      nat.filter(function(s){return s.kind==='revive';}).slice(0,1).forEach(push);
      nat.filter(function(s){return s.kind==='heal'||s.kind==='healAll';}).slice(0,1).forEach(push);
      nat.filter(function(s){return DMG.has(s.kind);}).forEach(push);
      se.filter(function(s){return DMG.has(s.kind);}).forEach(push);
      nat.forEach(push); se.forEach(push);
      LIB.filter(function(s){return DMG.has(s.kind);}).forEach(push);
      return {secondary:sec,spells:out.slice(0,8)};
    };
  })();
`;
const FORCE_SPELLS_FN = () => {
  const st = window.GAME.state;
  const p1 = st.units.filter(u => u.player === 1).sort((a, b) => a.id - b.id);
  const rep = [];
  p1.forEach(u => { const b = window.__buildLoadout(u.cls, null); u.spells = b.spells.map(s => ({ ...s })); if (u.maxMp) u.mp = u.maxMp; else u.mp = Math.max(u.mp || 0, 140); rep.push({ unit: u.name || u.cls, cls: u.cls, types: u.types, slots: u.spells.length, spells: u.spells.map(s => s.name) }); });
  return rep;
};

const SMART_ARENA_TURN = () => {
  const G = window.GAME, st = G.state;
  window.__FLAGS = window.__FLAGS || [];
  if (!st || st.phase !== 'battle') return { status: 'not-battle' };
  if (st.winner != null) return { status: 'done', winner: st.winner };
  const id = st._blitzActiveUnitId;
  if (!id) return { status: 'no-active' };
  const unit = st.units.find(u => u.id === id);
  if (!unit || unit.dead) return { status: 'no-unit' };
  if (st.controllers[unit.player] !== 'local') return { status: 'ai-turn', player: unit.player };
  const myP = unit.player, foeP = myP === 1 ? 2 : 1;

  const DMG = new Set(['damage','ricochet','multiHit','aoe','barrage','lifeDrain','line','linePush','cross','aoePull','splitBeam','displacement','pull','dash','skyDrop','skyThrow','skySlam','leapStrike']);
  const HEALER = new Set(['White Mage','Psychic','Harvester']);
  const D = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const enemies = () => st.units.filter(u => u.player !== myP && !u.dead && u.hp > 0);
  const allies = () => st.units.filter(u => u.player === myP && u.id !== unit.id);
  const acted = [];
  const channelCost = (typeof window.NEXUS_CHANNEL_COST_AP !== 'undefined') ? window.NEXUS_CHANNEL_COST_AP : 1;

  const baseDmg = sp => sp.dmg || (sp.hitDamages ? sp.hitDamages.reduce((a, b) => a + b, 0) : 0) || (sp.kind === 'barrage' || sp.kind === 'aoe' ? 120 : 90);
  const mult = (tg, sp) => { try { return window.getTypeDamageMultiplier(unit, tg, sp.spellType) || 1; } catch (e) { return 1; } };
  const estSpell = (tg, sp) => baseDmg(sp) * mult(tg, sp) * (sp.guaranteedCrit ? 1.5 : 1);
  const scoreDmg = (tg, est) => { let s = est; if (est >= tg.hp) s += 50000; s += (tg.maxHp - tg.hp) * 1.5; if (HEALER.has(tg.cls)) s += 4000; return s; };

  // ---- nexus helpers ----
  const nexuses = () => { const L = []; if (st.roamingNexus) L.push({ key: 'roaming', n: st.roamingNexus }); if (st.nexusPoints) for (const k of Object.keys(st.nexusPoints)) { if (st.nexusPoints[k]) L.push({ key: k, n: st.nexusPoints[k] }); } return L; };
  const contestable = () => nexuses().filter(o => o.n.owner !== myP);
  const center = n => ({ x: Math.floor(n.zoneX + (n.zoneSize || 1) / 2), y: Math.floor(n.zoneY + (n.zoneSize || 1) / 2) });
  const tower = () => { const t = st.towers && st.towers[foeP]; return (t && t.hp > 0) ? t : null; };

  for (let iter = 0; iter < 10; iter++) {
    if (unit.dead || (unit.ap || 0) <= 0) break;

    // 0) White-Mage support
    if (HEALER.has(unit.cls)) {
      try {
        const rev = (unit.spells || []).find(s => s.kind === 'revive' && G.canAffordSpell(unit, s) && (unit.mp||0) >= (s.cost||0));
        if (rev) { const dead = st.units.filter(u => u.player === myP && (u.dead || u.hp <= 0)); const rg = G.getSpellRangeTiles(unit, rev) || []; for (const d of dead) if (rg.some(t => t.x === d.x && t.y === d.y)) { st.selectedTool = rev.name; st.actionMode = 'spell'; const r = G.doSpell(unit, d.x, d.y, d.z); st.selectedTool = null; st.actionMode = null; if (r) { acted.push(`✚REVIVE ${d.name||d.cls}`); break; } } }
        const heal = (unit.spells || []).find(s => (s.kind === 'heal' || s.kind === 'healAll') && G.canAffordSpell(unit, s) && (unit.mp||0) >= (s.cost||0));
        if (heal) { const hurt = allies().filter(a => !a.dead && a.hp > 0 && a.hp < a.maxHp * 0.4).sort((x, y) => x.hp/x.maxHp - y.hp/y.maxHp)[0]; if (hurt) { const rg = G.getSpellRangeTiles(unit, heal) || []; if (rg.some(t => t.x === hurt.x && t.y === hurt.y)) { st.selectedTool = heal.name; st.actionMode = 'spell'; const r = G.doSpell(unit, hurt.x, hurt.y, hurt.z); st.selectedTool = null; st.actionMode = null; if (r) { acted.push(`✚HEAL ${hurt.name||hurt.cls}`); continue; } } } }
      } catch (e) {}
    }

    // 1) CHANNEL NEXUS if standing in a contestable zone
    try {
      const nd = window.getNexusAtUnit ? window.getNexusAtUnit(unit) : null;
      const airborne = (typeof window.isUnitAirborne === 'function') && window.isUnitAirborne(unit);
      if (nd && nd.nexus && nd.nexus.owner !== myP && !airborne && (unit.ap || 0) >= channelCost) {
        const p0 = nd.nexus.progress; window.channelNexus(unit);
        acted.push(`🔵 CHANNEL nexus prog ${p0}→${nd.nexus.progress}${nd.nexus.owner === myP ? ' ✅CAPTURED' : ''}`);
        continue;
      }
    } catch (e) { acted.push('nexErr:' + e.message); }

    // 2) Best damaging action: enemies (focus/kill) + enemy tower
    let best = null;
    try {
      const spells = (unit.spells || []).filter(s => DMG.has(s.kind) && G.canAffordSpell(unit, s) && (unit.mp || 0) >= (s.cost || 0) && !G.unitHasStatus(unit, 'silence'));
      for (const sp of spells) {
        const range = G.getSpellRangeTiles(unit, sp) || [];
        for (const t of range) { const tg = G.unitAt(t.x, t.y, t.z); if (tg && tg.player !== myP && !tg.dead && tg.hp > 0) { const est = estSpell(tg, sp); const sc = scoreDmg(tg, est); if (!best || sc > best.score) best = { kind: 'spell', sp, tg, t, est, score: sc }; } }
        // tower as a spell target
        const tw = tower(); if (tw) { const onTile = range.some(t => t.x === tw.x && t.y === tw.y); if (onTile) { const est = baseDmg(sp); const sc = est * 0.9 + 1500; if (!best || sc > best.score) best = { kind: 'spell', sp, t: { x: tw.x, y: tw.y, z: tw.z || 0 }, tower: true, est, score: sc }; } }
      }
      if (G.canUnitAct(unit)) {
        for (const t of (G.getAttackTiles(unit) || [])) {
          const tg = G.unitAt(t.x, t.y, t.z);
          if (tg && tg.player !== myP && !tg.dead && tg.hp > 0) { const est = (unit.atk || 60) * 1.6; const sc = scoreDmg(tg, est) - 1; if (!best || sc > best.score) best = { kind: 'atk', tg, t, est, score: sc }; }
          const tw = tower(); if (tw && t.x === tw.x && t.y === tw.y) { const sc = (unit.atk || 60) * 1.6 * 0.9 + 1400; if (!best || sc > best.score) best = { kind: 'atk', t, tower: true, score: sc }; }
        }
      }
    } catch (e) { acted.push('scanErr:' + e.message); }
    if (best) {
      try {
        if (best.kind === 'spell') { st.selectedTool = best.sp.name; st.actionMode = 'spell'; const r = G.doSpell(unit, best.t.x, best.t.y, best.t.z); st.selectedTool = null; st.actionMode = null; if (r && r !== 0) { acted.push(best.tower ? `🏰 ${best.sp.name}→TOWER` : `✨ ${best.sp.name}${best.est>=best.tg.hp?' 💀KILL':''} → ${best.tg.name||best.tg.cls}`); continue; } }
        else { G.doAttack(unit, best.t.x, best.t.y, best.t.z); acted.push(best.tower ? `🏰 ⚔TOWER` : `⚔${best.est>=best.tg.hp?' 💀KILL':''} ${best.tg.name||best.tg.cls}`); continue; }
      } catch (e) { acted.push('actErr:' + e.message); }
    }

    // 3) Move toward an objective: closest unit → nexus; else tower-pressure/focus enemy
    let moved = false;
    try {
      if (G.canUnitMove(unit)) {
        let target = null, label = '';
        const cons = contestable();
        if (cons.length) {
          const near = cons.map(o => ({ o, c: center(o.n), d: D(unit, center(o.n)) })).sort((a, b) => a.d - b.d)[0];
          const mine = st.units.filter(u => u.player === myP && !u.dead && u.hp > 0);
          const closest = mine.map(u => ({ u, d: D(u, near.c) })).sort((a, b) => a.d - b.d)[0];
          if (closest.u.id === unit.id) { target = near.c; label = 'NEXUS'; }
        }
        if (!target) { const es = enemies(); const tw = tower(); if (es.length) { const f = es.slice().sort((a, b) => a.hp - b.hp)[0]; target = f; label = 'focus ' + (f.name || f.cls); } else if (tw) { target = tw; label = 'TOWER'; } }
        if (target) { const tiles = G.getMoveTiles(unit) || []; let bt = null, bd = D(unit, target); for (const t of tiles) { const d = Math.abs(t.x - target.x) + Math.abs(t.y - target.y); if (d < bd) { bd = d; bt = t; } } if (bt) { const px = unit.x, py = unit.y; const r = G.doMove(unit, bt.x, bt.y, bt.z); if (r !== false && !(unit.x === px && unit.y === py)) { acted.push(`➡ ${label}`); moved = true; } } }
      }
    } catch (e) { acted.push('mvErr:' + e.message); }
    if (!moved) break;
  }
  unit.ap = 0; try { window.endUnitIfDone(unit); } catch (e) {}
  return { status: 'played', name: unit.name || unit.cls, acted };
};

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox','--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0]));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 });
  await sleep(9000);
  console.log('Game loaded. SMART ARENA 4v4 vs CPU on 8x8...');
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);
  const map = await page.evaluate(() => { const el = [...document.querySelectorAll('.ms-map-card')].find(c => /8\s*[×xX]\s*8/.test(c.textContent || '')); if (el) { el.click(); return (el.textContent || '').replace(/\s+/g, ' ').slice(0, 30); } return 'none'; });
  console.log('Map:', map);
  await sleep(900);
  const mode = await page.evaluate(() => { const el = [...document.querySelectorAll('.ms-mode-card')].find(b => /arena/i.test(b.textContent || '')); if (el) { el.click(); return (el.textContent || '').replace(/\s+/g, ' ').slice(0, 28); } return null; });
  console.log('Mode:', mode);
  await sleep(900);
  await page.evaluate(() => { const b = document.querySelector('.ms-btn-primary') || [...document.querySelectorAll('button')].find(x => /CONFIRM/i.test(x.innerText)); if (b) b.click(); });
  await sleep(2500);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => /SEAL YOUR FATE/i.test(x.innerText)); if (b) b.click(); }); await sleep(1500); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  for (let i = 0; i < 30; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'ai' }; });
  console.log('[stage] battle started.');

  await page.evaluate(LOADOUT_BUILDER);
  const forced = await page.evaluate(FORCE_SPELLS_FN);
  console.log('P1 loadouts:'); forced.forEach(u => console.log(`  ${u.cls} "${u.unit}" [${u.slots} slots]: ${u.spells.join(', ')}`));
  console.log(`  all 8 slots: ${forced.every(u => u.slots === 8) ? 'YES' : 'NO'}`);

  const meta = await page.evaluate(() => { const st = window.GAME.state, mp = window.getActiveMultiplayerMode ? window.getActiveMultiplayerMode() : {}; const team = p => st.units.filter(u => u.player === p).map(u => u.cls); return { mode: mp.id, roundLimit: mp.roundLimit || st.matchClock?.roundLimit, pts: mp.pointsPerCapture, board: `${window.GAME.bw()}x${window.GAME.bh()}`, towers: st.towers ? Object.keys(st.towers).map(k => `${k}:(${st.towers[k].x},${st.towers[k].y})hp${st.towers[k].hp}`) : null, p1: team(1), p2: team(2) }; });
  console.log(`\nMode=${meta.mode} roundLimit=${meta.roundLimit} board=${meta.board} towers=${JSON.stringify(meta.towers)}\n  P1: ${meta.p1.join(', ')}\n  P2: ${meta.p2.join(', ')}\n`);

  let lastRound = -1, shots = 0, stalls = 0;
  const start = Date.now();
  while (Date.now() - start < 600000) {
    const r = await page.evaluate(SMART_ARENA_TURN);
    const st = await page.evaluate(() => { const s = window.GAME.state; const a = p => s.units.filter(u => u.player === p && !u.dead && u.hp > 0).length; const tw = p => (s.towers && s.towers[p]) ? s.towers[p].hp : '-'; const nx = []; if (s.roamingNexus) nx.push('roam:' + (s.roamingNexus.owner || 0)); if (s.nexusPoints) for (const k of Object.keys(s.nexusPoints)) if (s.nexusPoints[k]) nx.push(k + ':' + (s.nexusPoints[k].owner || 0)); return { round: s.round, winner: s.winner, p1: a(1), p2: a(2), scores: s.matchScores, kills: s.matchKills, twr: `${tw(1)}/${tw(2)}`, nx: nx.join(',') }; });
    if (st.winner != null) break;
    if (st.round !== lastRound) { lastRound = st.round; console.log(`\n── Round ${st.round}/${meta.roundLimit} ── alive ${st.p1}v${st.p2} | score ${JSON.stringify(st.scores)} | kills ${JSON.stringify(st.kills)} | towerHP ${st.twr} | nexus ${st.nx||'-'}`); if (shots < 12) { await snap(page, `${MODE}-smart-r${String(st.round).padStart(2, '0')}`); shots++; } }
    if (r.status === 'played') { if (r.acted && r.acted.length) console.log(`  ${r.name}: ${r.acted.join(' | ')}`); stalls = 0; await sleep(110); }
    else if (r.status === 'ai-turn') { await page.evaluate(() => { try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(150); stalls = 0; }
    else { await page.evaluate(() => { try { window.maybeAdvanceTurn(); } catch (e) {} try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(160); if (++stalls > 150) { console.log('(stalled — stopping)'); break; } }
  }

  await sleep(1000); await snap(page, `${MODE}-smart-result`);
  const fin = await page.evaluate(() => { const st = window.GAME.state; const log = (st._fullLogEntries || st.logEntries || []).map(e => typeof e === 'string' ? e : e.m); const a = p => st.units.filter(u => u.player === p && !u.dead && u.hp > 0).length; return { winner: st.winner, cond: st._winCondition, round: st.round, p1: a(1), p2: a(2), scores: st.matchScores, kills: st.matchKills, towers: st.towers ? Object.keys(st.towers).map(k => `${k}:hp${st.towers[k].hp}`) : null, log }; });
  fs.writeFileSync(`${SHOTS}/${MODE}-smart-combat-log.txt`, fin.log.join('\n'));
  console.log('\n========================================');
  const who = fin.winner === 1 ? '🏆 I WIN (P1)' : fin.winner === 2 ? '💀 CPU wins' : fin.winner === 0 ? '⚖️ Draw' : `stopped (winner=${fin.winner})`;
  console.log(`${who} [${fin.cond || 'n/a'}] — round ${fin.round}, score ${JSON.stringify(fin.scores)}, kills ${JSON.stringify(fin.kills)}, towers ${JSON.stringify(fin.towers)}, alive ${fin.p1}v${fin.p2}`);
  console.log('========================================');
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
