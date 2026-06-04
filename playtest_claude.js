// Entropy Wars — CLAUDE playtest harness.
// Differences vs playtest_smart.js (which loops up to 8 actions inside ONE
// page.evaluate and reads STALE hp because damage/anim resolve async):
//   1) ONE action per step, then WAIT, then re-read — like a human / the engine's
//      own AI. No stale-HP re-fires, no double-spend.
//   2) Actively SEEKS HIGH GROUND: when repositioning, prefers reachable tiles
//      that are higher (downhill = +10% dmg/level, +1 range for ranged at h>=2,
//      and enemy loses their downhill bonus on me). Also prefers to attack from
//      the highest tile that still hits.
//   3) Verifies an action actually changed enemy HP; flags "no-op success".
// Usage: node playtest_claude.js [mode]   (tdm|ffa|domination|arena|hotspot|ctf)
const { chromium } = require('playwright');
const fs = require('fs');
const MODE = (process.argv[2] || 'tdm').toLowerCase();
const SHOTS = __dirname + '/shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
async function snap(page, name) { try { await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 6000, animations: 'disabled' }); } catch (e) {} }

const MODE_RE = { tdm: /death\s*match/i, ffa: /free.?for.?all/i, domination: /domination/i, arena: /arena/i, hotspot: /hot\s*spot/i, ctf: /capture|flag/i };

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
  p1.forEach(u => {
    const b = window.__buildLoadout(u.cls, null);
    u.spells = b.spells.map(s => ({ ...s }));
    if (u.maxMp) u.mp = u.maxMp; else u.mp = Math.max(u.mp || 0, 140);
    rep.push({ unit: u.name || u.cls, cls: u.cls, types: u.types, slots: u.spells.length, hp: u.maxHp });
  });
  return rep;
};

// ---- ONE-ACTION-PER-STEP turn logic with elevation seeking ----
// Returns a single action description; the driver waits between calls so async
// damage/animation resolves before the next decision.
const STEP = () => {
  const G = window.GAME, st = G.state;
  window.__FLAGS = window.__FLAGS || [];
  if (!st || st.phase !== 'battle') return { s: 'not-battle' };
  if (st.winner != null) return { s: 'done', winner: st.winner };
  const id = st._blitzActiveUnitId;
  if (!id) return { s: 'no-active' };
  const unit = st.units.find(u => u.id === id);
  if (!unit || unit.dead) return { s: 'no-unit' };
  if (st.controllers[unit.player] !== 'local') return { s: 'ai-turn', player: unit.player };
  if ((unit.ap || 0) <= 0) { try { window.endUnitIfDone(unit); } catch (e) {} return { s: 'end-turn', name: unit.name || unit.cls }; }

  const DMG = new Set(['damage','ricochet','multiHit','aoe','barrage','lifeDrain','line','linePush','cross','aoePull','splitBeam','displacement','pull','dash','skyDrop','skyThrow','skySlam','leapStrike']);
  const HEALER = new Set(['White Mage','Psychic','Harvester']);
  const D = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const enemies = () => st.units.filter(u => u.player !== unit.player && !u.dead && u.hp > 0);
  const allies = () => st.units.filter(u => u.player === unit.player && u.id !== unit.id && !u.dead && u.hp > 0);
  const H = (x, y, z) => { try { return z != null ? z : G.getHeightAt(x, y); } catch (e) { return 0; } };
  const uH = u => { try { return G.getUnitStandingHeight(u); } catch (e) { return u.z ?? 0; } };

  const baseDmg = sp => sp.dmg || (sp.hitDamages ? sp.hitDamages.reduce((a, b) => a + b, 0) : 0) || (sp.kind === 'barrage' || sp.kind === 'aoe' ? 120 : 90);
  const tmult = (tg, sp) => { try { return window.getTypeDamageMultiplier(unit, tg, sp ? sp.spellType : null) || 1; } catch (e) { return 1; } };
  // elevation multiplier if I attack tg from tile at height fromH
  const elevMult = (fromH, tg) => { const th = uH(tg); return fromH > th ? (1 + 0.1 * (fromH - th)) : 1; };
  const estSpell = (tg, sp, fromH) => baseDmg(sp) * tmult(tg, sp) * (sp.guaranteedCrit ? 1.5 : 1) * elevMult(fromH, tg);
  const estAtk = (tg, fromH) => (unit.atk || 60) * 1.6 * tmult(tg, null) * elevMult(fromH, tg);

  // TEAM FOCUS FIRE: the whole team hammers ONE target so HP actually hits 0.
  // Recompute when the current focus dies. Pick the enemy the team can collectively
  // bring down fastest: lowest HP, weighted by how many of my living allies are near.
  let teamFocus = st.units.find(u => u.id === st.__teamFocusId && !u.dead && u.hp > 0 && u.player !== unit.player);
  if (!teamFocus) {
    const es = enemies();
    if (es.length) {
      const myTeam = st.units.filter(u => u.player === unit.player && !u.dead && u.hp > 0);
      const ctr = myTeam.reduce((a, u) => ({ x: a.x + u.x, y: a.y + u.y }), { x: 0, y: 0 });
      ctr.x /= myTeam.length || 1; ctr.y /= myTeam.length || 1;
      teamFocus = es.slice().sort((a, b) => {
        const ka = HEALER.has(a.cls) ? -300 : 0, kb = HEALER.has(b.cls) ? -300 : 0;
        return (a.hp + ka + (Math.abs(a.x - ctr.x) + Math.abs(a.y - ctr.y)) * 25)
             - (b.hp + kb + (Math.abs(b.x - ctr.x) + Math.abs(b.y - ctr.y)) * 25);
      })[0];
      st.__teamFocusId = teamFocus ? teamFocus.id : null;
    }
  }
  const scoreDmg = (tg, est) => {
    let s = est;
    if (est >= tg.hp) s += 50000;                       // secure the kill
    s += (tg.maxHp - tg.hp) * 1.5;                       // pile onto the wounded
    if (teamFocus && tg.id === teamFocus.id) s += 8000;  // team focus fire
    if (HEALER.has(tg.cls)) s += 4000;
    return s;
  };

  const myH = uH(unit);

  // 1) Healer support: revive dead ally / heal critical ally.
  if (HEALER.has(unit.cls)) {
    try {
      const revive = (unit.spells || []).find(s => s.kind === 'revive' && G.canAffordSpell(unit, s) && (unit.mp || 0) >= (s.cost || 0));
      if (revive) {
        const dead = st.units.filter(u => u.player === unit.player && (u.dead || u.hp <= 0));
        const range = G.getSpellRangeTiles(unit, revive) || [];
        for (const d of dead) if (range.some(t => t.x === d.x && t.y === d.y)) { st.selectedTool = revive.name; st.actionMode = 'spell'; const r = G.doSpell(unit, d.x, d.y, d.z); st.selectedTool = null; st.actionMode = null; if (r) return { s: 'act', name: unit.name || unit.cls, a: `✚REVIVE ${d.name || d.cls}` }; }
      }
      const heal = (unit.spells || []).find(s => (s.kind === 'heal' || s.kind === 'healAll') && G.canAffordSpell(unit, s) && (unit.mp || 0) >= (s.cost || 0));
      if (heal) {
        const hurt = allies().filter(a => a.hp < a.maxHp * 0.4).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
        if (hurt) { const range = G.getSpellRangeTiles(unit, heal) || []; if (range.some(t => t.x === hurt.x && t.y === hurt.y)) { st.selectedTool = heal.name; st.actionMode = 'spell'; const r = G.doSpell(unit, hurt.x, hurt.y, hurt.z); st.selectedTool = null; st.actionMode = null; if (r) return { s: 'act', name: unit.name || unit.cls, a: `✚HEAL ${hurt.name || hurt.cls}` }; } }
      }
    } catch (e) {}
  }

  // 2) Best immediate damage action from where I stand (height-aware estimate).
  let best = null;
  try {
    const spells = (unit.spells || []).filter(s => DMG.has(s.kind) && G.canAffordSpell(unit, s) && (unit.mp || 0) >= (s.cost || 0) && !G.unitHasStatus(unit, 'silence'));
    for (const sp of spells) {
      const range = G.getSpellRangeTiles(unit, sp) || [];
      for (const t of range) { const tg = G.unitAt(t.x, t.y, t.z); if (tg && tg.player !== unit.player && !tg.dead && tg.hp > 0) { const est = estSpell(tg, sp, myH); const sc = scoreDmg(tg, est); if (!best || sc > best.score) best = { kind: 'spell', sp, tg, t, est, score: sc, hpBefore: tg.hp }; } }
    }
    if (G.canUnitAct(unit)) for (const t of (G.getAttackTiles(unit) || [])) { const tg = G.unitAt(t.x, t.y, t.z); if (tg && tg.player !== unit.player && !tg.dead && tg.hp > 0) { const est = estAtk(tg, myH); const sc = scoreDmg(tg, est) - 1; if (!best || sc > best.score) best = { kind: 'atk', tg, t, est, score: sc, hpBefore: tg.hp }; } }
  } catch (e) {}

  if (best) {
    try {
      st.__hpBefore = best.hpBefore; st.__tgId = best.tg.id;
      if (best.kind === 'spell') { st.selectedTool = best.sp.name; st.actionMode = 'spell'; const r = G.doSpell(unit, best.t.x, best.t.y, best.t.z); st.selectedTool = null; st.actionMode = null; if (r && r !== 0) return { s: 'act', name: unit.name || unit.cls, a: `✨${best.sp.name}${best.est >= best.tg.hp ? ' 💀' : ''}→${best.tg.name || best.tg.cls}`, verify: { tgId: best.tg.id, before: best.hpBefore, what: best.sp.name } }; }
      else { G.doAttack(unit, best.t.x, best.t.y, best.t.z); return { s: 'act', name: unit.name || unit.cls, a: `⚔${best.est >= best.tg.hp ? '💀' : ''}${best.tg.name || best.tg.cls}`, verify: { tgId: best.tg.id, before: best.hpBefore, what: 'attack' } }; }
    } catch (e) { return { s: 'act', name: unit.name || unit.cls, a: 'actErr:' + e.message }; }
  }

  // 3) No action in range → MOVE. Pick a tile that closes on the focus target
  //    AND climbs (elevation seeking). If a tile lets me attack the focus from
  //    high ground, that wins big.
  try {
    if (G.canUnitMove(unit)) {
      const es = enemies();
      if (es.length) {
        const focus = teamFocus || es.slice().sort((a, b) => a.hp - b.hp)[0];
        const tiles = G.getMoveTiles(unit) || [];
        const effRange = (() => { try { return G.getEffectiveRange(unit); } catch (e) { return unit.range || 1; } })();
        const isRanged = (unit.range || 1) >= 2;
        let bt = null, bScore = -Infinity;
        const curD = D(unit, focus);
        for (const t of tiles) {
          const th = H(t.x, t.y, t.z);
          const d = Math.abs(t.x - focus.x) + Math.abs(t.y - focus.y);
          // progress toward focus (closer = better)
          let s = (curD - d) * 10;
          // elevation seeking: climbing is good; +1 range threshold (h>=2) for ranged is extra good
          s += Math.min(th, 4) * (isRanged ? 3.0 : 2.0);
          if (isRanged && th >= 2) s += 4;
          // can I hit ANY enemy from this tile? big bonus, scaled by downhill mult
          for (const e of es) { const ed = Math.abs(t.x - e.x) + Math.abs(t.y - e.y); if (ed >= 1 && ed <= effRange) { let v = 60 * elevMult(th, e); if (e.hp <= (unit.atk || 60) * 1.8) v += 120; s += v; } }
          if (s > bScore) { bScore = s; bt = t; }
        }
        if (bt && !(bt.x === unit.x && bt.y === unit.y)) {
          const ph = myH; const r = G.doMove(unit, bt.x, bt.y, bt.z);
          if (r !== false) { const nh = uH(unit); return { s: 'act', name: unit.name || unit.cls, a: `➡focus ${focus.name || focus.cls}${nh > ph ? ` ⛰h${ph}→${nh}` : ''}` }; }
        }
      }
    }
  } catch (e) {}

  // nothing to do
  unit.ap = 0; try { window.endUnitIfDone(unit); } catch (e) {}
  return { s: 'end-turn', name: unit.name || unit.cls };
};

const VERIFY = (v) => {
  const st = window.GAME.state;
  const tg = st.units.find(u => u.id === v.tgId);
  const after = tg ? (tg.dead ? 0 : tg.hp) : 0;
  return { before: v.before, after, dealt: Math.round(v.before - after), dead: !tg || tg.dead };
};

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox','--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0]));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 });
  await sleep(9000);
  console.log(`Game loaded. CLAUDE ${MODE.toUpperCase()} 4v4 vs CPU on 8x8 (one-action-per-step + elevation seeking)...`);
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);
  const map = await page.evaluate(() => { const cards = [...document.querySelectorAll('.ms-map-card')]; const el = cards.find(c => /8\s*[×xX]\s*8/.test(c.textContent || '')); if (el) { el.click(); return (el.textContent || '').replace(/\s+/g, ' ').slice(0, 40); } return 'NO 8x8 CARD'; });
  console.log('Map:', map);
  await sleep(1000);
  const picked = await page.evaluate((reSrc) => { const re = new RegExp(reSrc, 'i'); const el = [...document.querySelectorAll('.ms-mode-card')].find(b => re.test(b.textContent || '')); if (el) { el.click(); return (el.textContent || '').replace(/\s+/g, ' ').slice(0, 30); } return null; }, MODE_RE[MODE].source);
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
  console.log('P1:', forced.map(u => `${u.cls}/${(u.types||[]).join('+')} hp${u.hp}`).join(', '));

  const meta = await page.evaluate(() => { const st = window.GAME.state, mp = window.getActiveMultiplayerMode ? window.getActiveMultiplayerMode() : {}; const team = p => st.units.filter(u => u.player === p).map(u => `${u.cls}`); return { mode: mp.id, roundLimit: mp.roundLimit || st.matchClock?.roundLimit, p1: team(1), p2: team(2), board: `${window.GAME.bw()}x${window.GAME.bh()}` }; });
  console.log(`Mode=${meta.mode} roundLimit=${meta.roundLimit} board=${meta.board}  P2: ${meta.p2.join(', ')}\n`);

  let lastRound = -1, shots = 0, stalls = 0;
  const noops = [], heights = []; // track elevation usage + no-op successes
  let totalDealt = 0, actCount = 0;
  let lastKnown = { round: 0, winner: null, p1: 4, p2: 4, kills: {} };
  let dead = false;
  const ev = async (fn, arg) => { if (dead) return null; try { return await page.evaluate(fn, arg); } catch (e) { if (/closed|crash|detached|Target/i.test(e.message)) { dead = true; console.log('[renderer died]', e.message.split('\n')[0]); } return null; } };
  const finalize = (reason) => {
    try { fs.writeFileSync(`${SHOTS}/${MODE}-claude-summary.txt`, JSON.stringify({ lastKnown, totalDealt, actCount, climbs: heights.length, noops: noops.length }, null, 2)); } catch (e) {}
    console.log('\n========================================');
    const w = lastKnown.winner;
    const who = w === 1 ? '🏆 I WIN (P1)' : w === 2 ? '💀 CPU wins' : w === 0 ? '⚖️ Draw/No-contest' : `stopped (${reason})`;
    console.log(`${who} — last round ${lastKnown.round}, kills ${JSON.stringify(lastKnown.kills)}, alive me:${lastKnown.p1} cpu:${lastKnown.p2}`);
    console.log(`Actions: ${actCount}, total dmg dealt to enemies: ${totalDealt}` + (actCount ? ` (avg ${Math.round(totalDealt / actCount)}/action)` : ''));
    console.log(`Elevation moves (climbed): ${heights.length}` + (heights.length ? ` — e.g. ${heights.slice(0, 5).join(' | ')}` : ''));
    console.log(`No-op "successful" damage actions (dealt <=0): ${noops.length}` + (noops.length ? ` — e.g. ${noops.slice(0, 5).join(' | ')}` : ''));
    console.log('========================================');
  };
  const start = Date.now();
  while (Date.now() - start < 420000 && !dead) {
    const r = await ev(STEP);
    if (!r) break;
    if (r.s === 'done') { lastKnown.winner = r.winner; break; }
    if (r.s === 'act') {
      await sleep(280); // let async damage/animation resolve before re-reading
      if (r.verify) { actCount++; const vr = await ev(VERIFY, r.verify); if (vr) { totalDealt += Math.max(0, vr.dealt); if (vr.dealt <= 0 && !vr.dead) noops.push(`${r.verify.what} dealt ${vr.dealt} (hp ${vr.before}→${vr.after})`); } }
      if (r.a && /⛰/.test(r.a)) heights.push(r.a);
      stalls = 0;
    } else if (r.s === 'ai-turn') { await ev(() => { try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(160); stalls = 0; }
    else if (r.s === 'end-turn') { await ev(() => { try { window.maybeAdvanceTurn(); } catch (e) {} }); await sleep(120); }
    else { await ev(() => { try { window.maybeAdvanceTurn(); } catch (e) {} try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(170); if (++stalls > 160) { console.log('(stalled — stopping)'); break; } }
    if (dead) break;

    const st = await ev(() => { const s = window.GAME.state; const a = p => s.units.filter(u => u.player === p && !u.dead && u.hp > 0).length; return { round: s.round, winner: s.winner, p1: a(1), p2: a(2), kills: s.matchKills }; });
    if (st) { lastKnown = st; if (st.winner != null) break; if (st.round !== lastRound) { lastRound = st.round; console.log(`── Round ${st.round}/${meta.roundLimit} ── me:${st.p1} cpu:${st.p2} kills:${JSON.stringify(st.kills)}`); if (shots < 8) { await snap(page, `${MODE}-claude-r${String(st.round).padStart(2, '0')}`); shots++; } } }
    if (r.s === 'act' && r.a) console.log(`  ${r.name}: ${r.a}`);
  }

  finalize(dead ? 'renderer crash' : 'time/stall budget');
  try { await browser.close(); } catch (e) {}
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
