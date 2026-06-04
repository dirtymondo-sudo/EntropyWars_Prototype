// Entropy Wars — SMART TDM 4v4 playtest on an 8x8 map.
// Real tactics (not "hit closest"): the agent focus-fires the lowest-HP reachable
// enemy, SECURES KILLS when lethal, prioritizes the enemy healer, scores every
// spell with the game's own getTypeDamageMultiplier (type chart + STAB), and uses
// the White Mage to revive/heal. All 8 spell slots filled on every unit.
const { chromium } = require('playwright');
const fs = require('fs');
const MODE = 'tdm';
const SHOTS = __dirname + '/shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
async function snap(page, name) { try { await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 6000, animations: 'disabled' }); } catch (e) {} }

// Build a full 8-spell loadout for a class (+secondary) — damage-diverse + keep heal/revive.
const LOADOUT_BUILDER = `
  (function(){
    var DMG = new Set(['damage','ricochet','multiHit','aoe','barrage','lifeDrain','line','linePush','cross','aoePull','splitBeam','displacement','pull','dash','skyDrop','skyThrow','skySlam','leapStrike']);
    var KEEP = new Set(['heal','healAll','selfHeal','revive','shield','buff']);
    var LIB = window.SPELL_LIBRARY || [];
    window.__eligCache = window.__eligCache || {};
    function elig(c){ if(!c) return []; if(!window.__eligCache[c]){ try{ window.__eligCache[c]=(window.getEligibleSpellsForClass(c)||[]);}catch(e){window.__eligCache[c]=[];} } return window.__eligCache[c]; }
    function pickSec(c){ var a=Object.keys(window.CLASS_TEMPLATES||{}).filter(function(x){return x&&x!==c;}); return a[Math.floor(Math.random()*a.length)]||''; }
    window.__buildLoadout=function(cls,sec){
      sec=sec||pickSec(cls);
      var seen=new Set(),out=[];
      function push(s){ if(s&&s.id&&!seen.has(s.id)){seen.add(s.id);out.push(s);} }
      var nat=elig(cls),se=elig(sec);
      // keep one heal + one revive if class has them (White Mage), then damage spells
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
  p1.forEach(u => {
    const b = window.__buildLoadout(u.cls, null);
    u.spells = b.spells.map(s => ({ ...s }));
    if (u.maxMp) u.mp = u.maxMp; else u.mp = Math.max(u.mp || 0, 140);
    rep.push({ unit: u.name || u.cls, cls: u.cls, types: u.types, slots: u.spells.length, hp: u.maxHp, spells: u.spells.map(s => `${s.name}[${s.kind}/${s.spellType}]`) });
  });
  return rep;
};

// ---- SMART per-unit turn ----
const SMART_TURN = () => {
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
  const HEALER = new Set(['White Mage','Psychic','Harvester']);
  const D = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const enemies = () => st.units.filter(u => u.player !== unit.player && !u.dead && u.hp > 0);
  const allies = () => st.units.filter(u => u.player === unit.player && u.id !== unit.id);
  const logsSince = n => st.logEntries.slice(n).map(e => typeof e === 'string' ? e : e.m);
  const acted = [];

  const baseDmg = sp => sp.dmg || (sp.hitDamages ? sp.hitDamages.reduce((a, b) => a + b, 0) : 0) || (sp.kind === 'barrage' || sp.kind === 'aoe' ? 120 : 90);
  const mult = (tg, sp) => { try { return window.getTypeDamageMultiplier(unit, tg, sp.spellType) || 1; } catch (e) { return 1; } };
  const estSpell = (tg, sp) => baseDmg(sp) * mult(tg, sp) * (sp.guaranteedCrit ? 1.5 : 1);
  const estAtk = tg => (unit.atk || 60) * 1.6 * (() => { try { return window.getTypeDamageMultiplier(unit, tg, null) || 1; } catch (e) { return 1; } })();

  // score a damage action: kills dominate; then finish-wounded (focus fire); then enemy-healer; then raw dmg.
  const scoreDmg = (tg, est) => {
    let s = est;
    if (est >= tg.hp) s += 50000;                 // secure the kill
    s += (tg.maxHp - tg.hp) * 1.5;                // focus the wounded
    if (HEALER.has(tg.cls)) s += 4000;            // kill support first
    return s;
  };

  for (let iter = 0; iter < 8; iter++) {
    if (unit.dead || (unit.ap || 0) <= 0) break;

    // 0) WHITE-MAGE SUPPORT FIRST: revive a dead ally / heal a critical ally if it's clearly worth it.
    if (HEALER.has(unit.cls)) {
      try {
        const revive = (unit.spells || []).find(s => s.kind === 'revive' && G.canAffordSpell(unit, s) && (unit.mp||0) >= (s.cost||0));
        if (revive) {
          const deadAllies = st.units.filter(u => u.player === unit.player && (u.dead || u.hp <= 0));
          const range = G.getSpellRangeTiles(unit, revive) || [];
          for (const d of deadAllies) { if (range.some(t => t.x === d.x && t.y === d.y)) { st.selectedTool = revive.name; st.actionMode = 'spell'; const r = G.doSpell(unit, d.x, d.y, d.z); st.selectedTool = null; st.actionMode = null; if (r) { acted.push(`✚ REVIVE ${d.name || d.cls}`); break; } } }
        }
        const heal = (unit.spells || []).find(s => (s.kind === 'heal' || s.kind === 'healAll') && G.canAffordSpell(unit, s) && (unit.mp||0) >= (s.cost||0));
        if (heal) {
          const hurt = allies().filter(a => !a.dead && a.hp > 0 && a.hp < a.maxHp * 0.4).sort((x, y) => (x.hp/x.maxHp) - (y.hp/y.maxHp))[0];
          if (hurt) { const range = G.getSpellRangeTiles(unit, heal) || []; if (range.some(t => t.x === hurt.x && t.y === hurt.y)) { st.selectedTool = heal.name; st.actionMode = 'spell'; const r = G.doSpell(unit, hurt.x, hurt.y, hurt.z); st.selectedTool = null; st.actionMode = null; if (r) { acted.push(`✚ HEAL ${hurt.name || hurt.cls}`); continue; } } }
        }
      } catch (e) { acted.push('healErr:' + e.message); }
    }

    // 1) Best damage action available NOW (no move): scan spells × in-range enemies.
    let best = null; // {kind:'spell'|'atk', sp, tg, est, score}
    try {
      const spells = (unit.spells || []).filter(s => DMG.has(s.kind) && G.canAffordSpell(unit, s) && (unit.mp || 0) >= (s.cost || 0) && !G.unitHasStatus(unit, 'silence'));
      for (const sp of spells) {
        const range = G.getSpellRangeTiles(unit, sp) || [];
        for (const t of range) { const tg = G.unitAt(t.x, t.y, t.z); if (tg && tg.player !== unit.player && !tg.dead && tg.hp > 0) { const est = estSpell(tg, sp); const sc = scoreDmg(tg, est); if (!best || sc > best.score) best = { kind: 'spell', sp, tg, t, est, score: sc }; } }
      }
      if (G.canUnitAct(unit)) { for (const t of (G.getAttackTiles(unit) || [])) { const tg = G.unitAt(t.x, t.y, t.z); if (tg && tg.player !== unit.player && !tg.dead && tg.hp > 0) { const est = estAtk(tg); const sc = scoreDmg(tg, est) - 1; if (!best || sc > best.score) best = { kind: 'atk', tg, t, est, score: sc }; } } }
    } catch (e) { acted.push('scanErr:' + e.message); }

    if (best) {
      try {
        if (best.kind === 'spell') { st.selectedTool = best.sp.name; st.actionMode = 'spell'; const L0 = st.logEntries.length; const r = G.doSpell(unit, best.t.x, best.t.y, best.t.z); st.selectedTool = null; st.actionMode = null; const blocked = logsSince(L0).find(m => /Terrain blocks|out of range|hidden in the fog/i.test(m)); if (r && r !== 0) { acted.push(`✨ ${best.sp.name}${best.est>=best.tg.hp?' 💀KILL':''} → ${best.tg.name || best.tg.cls}(${Math.round(best.tg.hp)})`); continue; } else if (blocked) { acted.push(`(blocked ${best.sp.name})`); } }
        else { G.doAttack(unit, best.t.x, best.t.y, best.t.z); acted.push(`⚔${best.est>=best.tg.hp?' 💀KILL':''} ${best.tg.name || best.tg.cls}`); continue; }
      } catch (e) { acted.push('actErr:' + e.message); }
    }

    // 2) No action in range → MOVE toward the focus target (globally lowest-HP enemy) to close.
    let moved = false;
    try {
      if (G.canUnitMove(unit)) {
        const es = enemies();
        if (es.length) {
          const focus = es.slice().sort((a, b) => a.hp - b.hp)[0]; // finish the weakest
          const tiles = G.getMoveTiles(unit) || []; let bt = null, bd = D(unit, focus);
          for (const t of tiles) { const d = Math.abs(t.x - focus.x) + Math.abs(t.y - focus.y); if (d < bd) { bd = d; bt = t; } }
          if (bt) { const px = unit.x, py = unit.y; const r = G.doMove(unit, bt.x, bt.y, bt.z); if (r !== false && !(unit.x === px && unit.y === py)) { acted.push(`➡ focus ${focus.name||focus.cls}`); moved = true; } }
        }
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
  console.log('Game loaded. SMART TDM 4v4 vs CPU on an 8x8 map...');
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);
  // pick an 8x8 map card (Outpost/Suburb/Bunker)
  const map = await page.evaluate(() => { const cards = [...document.querySelectorAll('.ms-map-card')]; const el = cards.find(c => /8\s*[×xX]\s*8/.test(c.textContent || '')); if (el) { el.click(); return (el.textContent || '').replace(/\s+/g, ' ').slice(0, 40); } return 'NO 8x8 CARD (' + cards.length + ' cards)'; });
  console.log('Map selected:', map);
  await sleep(1000);
  // pick TDM mode card
  const picked = await page.evaluate(() => { const el = [...document.querySelectorAll('.ms-mode-card')].find(b => /death\s*match/i.test(b.textContent || '')); if (el) { el.click(); return (el.textContent || '').replace(/\s+/g, ' ').slice(0, 30); } return null; });
  console.log('Mode card:', picked);
  await sleep(1000);
  await page.evaluate(() => { const b = document.querySelector('.ms-btn-primary') || [...document.querySelectorAll('button')].find(x => /CONFIRM/i.test(x.innerText)); if (b) b.click(); });
  await sleep(2500);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => /SEAL YOUR FATE/i.test(x.innerText)); if (b) b.click(); }); await sleep(1500); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  for (let i = 0; i < 30; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'ai' }; });
  console.log('[stage] battle started.');

  await page.evaluate(LOADOUT_BUILDER);
  const forced = await page.evaluate(FORCE_SPELLS_FN);
  console.log('\nP1 loadouts (8 slots each):');
  forced.forEach(u => console.log(`  ${u.cls} "${u.unit}" types=${JSON.stringify(u.types)} hp${u.hp} — ${u.spells.join(', ')}`));
  console.log(`  all 8 slots filled: ${forced.every(u => u.slots === 8) ? 'YES' : 'NO'}`);

  const meta = await page.evaluate(() => { const st = window.GAME.state, mp = window.getActiveMultiplayerMode ? window.getActiveMultiplayerMode() : {}; const team = p => st.units.filter(u => u.player === p).map(u => `${u.cls}${u.types ? '/' + u.types.join('+') : ''}`); return { mode: mp.id, roundLimit: mp.roundLimit || st.matchClock?.roundLimit, p1: team(1), p2: team(2), board: `${window.GAME.bw()}x${window.GAME.bh()}` }; });
  console.log(`\nMode=${meta.mode} roundLimit=${meta.roundLimit} board=${meta.board}\n  P1: ${meta.p1.join(', ')}\n  P2: ${meta.p2.join(', ')}\n`);

  let lastRound = -1, shots = 0, stalls = 0;
  const start = Date.now();
  while (Date.now() - start < 600000) {
    const r = await page.evaluate(SMART_TURN);
    const st = await page.evaluate(() => { const s = window.GAME.state; const a = p => s.units.filter(u => u.player === p && !u.dead && u.hp > 0).length; return { round: s.round, winner: s.winner, p1: a(1), p2: a(2), kills: s.matchKills }; });
    if (st.winner != null) break;
    if (st.round !== lastRound) { lastRound = st.round; console.log(`\n── Round ${st.round}/${meta.roundLimit} ── alive me:${st.p1} cpu:${st.p2} kills:${JSON.stringify(st.kills)}`); if (shots < 12) { await snap(page, `${MODE}-smart-r${String(st.round).padStart(2, '0')}`); shots++; } }
    if (r.status === 'played') { if (r.acted && r.acted.length) console.log(`  ${r.name}: ${r.acted.join(' | ')}`); stalls = 0; await sleep(120); }
    else if (r.status === 'ai-turn') { await page.evaluate(() => { try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(150); stalls = 0; }
    else { await page.evaluate(() => { try { window.maybeAdvanceTurn(); } catch (e) {} try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(170); if (++stalls > 140) { console.log('(stalled — stopping)'); break; } }
  }

  await sleep(1000); await snap(page, `${MODE}-smart-result`);
  const fin = await page.evaluate(() => { const st = window.GAME.state; const log = (st._fullLogEntries || st.logEntries || []).map(e => typeof e === 'string' ? e : e.m); const a = p => st.units.filter(u => u.player === p && !u.dead && u.hp > 0).length; return { winner: st.winner, round: st.round, p1: a(1), p2: a(2), kills: st.matchKills, log, flags: window.__FLAGS || [] }; });
  fs.writeFileSync(`${SHOTS}/${MODE}-smart-combat-log.txt`, fin.log.join('\n'));
  fs.writeFileSync(`${SHOTS}/${MODE}-smart-loadouts.json`, JSON.stringify(forced, null, 2));
  console.log('\n========================================');
  const who = fin.winner === 1 ? '🏆 I WIN (P1)' : fin.winner === 2 ? '💀 CPU wins' : fin.winner === 0 ? '⚖️ Draw/No-contest' : `stopped (winner=${fin.winner})`;
  console.log(`${who} — round ${fin.round}, kills ${JSON.stringify(fin.kills)}, alive me:${fin.p1} cpu:${fin.p2}`);
  console.log('========================================');
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
