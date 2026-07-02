// Entropy Wars automated playtest harness.
// Usage:  node playtest.js <mode>        e.g. node playtest.js tdm
//   modes: arena | tdm | ffa | domination | hotspot | ctf
//
// Drives Player 1 against the CPU with simple tactics (cast offensive spell on
// the weakest enemy in range, else basic-attack, else advance), casting real
// spells, and flags two known bug classes:
//   - a highlighted/returned MOVE tile that doMove refuses
//   - an in-range SPELL tile rejected with "Terrain blocks the spell path"
// Requires the server running on :3000 and Playwright + chromium installed.
const { chromium } = require('playwright');
const fs = require('fs');

const MODE = (process.argv[2] || 'tdm').toLowerCase();
const MODE_LABELS = { arena: 'arena', tdm: 'death\\s*match', ffa: 'free\\s*for\\s*all',
  domination: 'domination', hotspot: 'hotspot|restpot', ctf: 'capture\\s*the\\s*flag' };
const MODE_RE = MODE_LABELS[MODE] || MODE_LABELS.tdm;
const SHOTS = __dirname + '/shots';
const sleep = ms => new Promise(r => setTimeout(r, ms));
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
async function snap(page, name) { try { await page.screenshot({ path: `${SHOTS}/${name}.png`, timeout: 7000, animations: 'disabled' }); } catch (e) {} }

// Runs INSIDE the page: plays ONE active Player-1 unit's turn, then ends it.
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
    // 1) one decisive offensive spell
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
          window.__FLAGS.push({ type: 'spell-rejected', spell: spell.name, kind: spell.kind, from: { x: unit.x, y: unit.y, z: unit.z ?? 0 }, to: { x: pick.t.x, y: pick.t.y }, range: G.getEffectiveSpellRange(unit, spell), msg: blocked, round: st.round, unit: unit.name || unit.cls });
          acted.push(`🐞 ${spell.name} REJECTED though tile highlighted in-range → "${blocked}"`); continue;
        }
        if (ret && ret !== 0) { acted.push(`✨ ${spell.name} (${spell.kind}) on ${pick.tg.name || pick.tg.cls}`); cast = true; break; }
      }
    } catch (e) { acted.push('spellErr:' + e.message); }
    if (cast) break;
    // 2) basic attack
    let attacked = false;
    try {
      if (G.canUnitAct(unit)) {
        const tiles = G.getAttackTiles(unit) || []; let best = null;
        for (const t of tiles) { const tg = G.unitAt(t.x, t.y, t.z); if (tg && tg.player !== unit.player && !tg.dead) { if (!best || tg.hp < best.tg.hp) best = { t, tg }; } }
        if (best) { G.doAttack(unit, best.t.x, best.t.y, best.t.z); acted.push(`⚔ ${best.tg.name || best.tg.cls}`); attacked = true; }
      }
    } catch (e) { acted.push('atkErr:' + e.message); }
    if (attacked) break;
    // 3) advance toward nearest enemy (flags a refused highlighted move tile)
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
              if (/Invalid move|silently/i.test(inval)) { window.__FLAGS.push({ type: 'move-rejected', from: { x: px, y: py }, to: { x: bt.x, y: bt.y, cost: bt.cost }, ap: unit.ap, msg: inval, round: st.round, unit: unit.name || unit.cls }); acted.push(`🐞 move to highlighted (${bt.x},${bt.y}) cost ${bt.cost} REJECTED → "${inval}"`); }
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
  // PW_CHROMIUM: path to a system/pre-installed Chromium when the Playwright
  // registry download isn't available (e.g. remote sandboxes).
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PW_CHROMIUM || undefined, args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox','--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true }); // ignoreHTTPSErrors: assets load from R2/CDN behind TLS inspection
  // USE_ASSET_CACHE=1 → serve R2/CDN assets from .asset-cache; combine with
  // LOCAL_ASSETS=a.js,b.js to test local repo edits before the R2 upload.
  if (process.env.USE_ASSET_CACHE) { try { await require('./asset_cache').installAssetCache(ctx); } catch (e) { console.log('asset cache unavailable:', e.message); } }
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR', e.message.split('\n')[0]));
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 });
  await sleep(9000);
  console.log(`Game loaded. Playtesting mode="${MODE}" as Player 1 vs CPU...`);
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);

  const picked = await page.evaluate((re) => {
    const rx = new RegExp(re, 'i');
    const el = [...document.querySelectorAll('.ms-mode-card')].find(b => rx.test(b.innerText || ''));
    if (el) { el.click(); return el.innerText.replace(/\s+/g, ' ').slice(0, 30); } return null;
  }, MODE_RE);
  console.log('Mode card:', picked);
  await sleep(1200);
  await page.evaluate(() => { const b = document.querySelector('.ms-btn-primary') || [...document.querySelectorAll('button')].find(x => /CONFIRM/i.test(x.innerText)); if (b) b.click(); });
  await sleep(2500);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => /SEAL YOUR FATE/i.test(x.innerText)); if (b) b.click(); }); await sleep(1500); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  for (let i = 0; i < 30; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'ai' }; });

  const meta = await page.evaluate(() => { const st = window.GAME.state, mp = window.getActiveMultiplayerMode ? window.getActiveMultiplayerMode() : {}; const team = p => st.units.filter(u => u.player === p).map(u => u.name || u.cls); return { mode: mp.id, roundLimit: mp.roundLimit || st.matchClock?.roundLimit, p1: team(1), p2: team(2) }; });
  console.log(`Mode=${meta.mode} roundLimit=${meta.roundLimit}\n  P1: ${meta.p1.join(', ')}\n  P2: ${meta.p2.join(', ')}\n`);

  let lastRound = -1, shots = 0, stalls = 0, winner = null;
  const start = Date.now();
  while (Date.now() - start < 540000) {
    const r = await page.evaluate(TURN_FN);
    const st = await page.evaluate(() => { const s = window.GAME.state; const a = p => s.units.filter(u => u.player === p && !u.dead && u.hp > 0).length; return { round: s.round, winner: s.winner, p1: a(1), p2: a(2), kills: s.matchKills }; });
    if (st.winner != null) { winner = st.winner; break; }
    if (st.round !== lastRound) { lastRound = st.round; console.log(`\n── Round ${st.round}/${meta.roundLimit} ── me:${st.p1} cpu:${st.p2} kills:${JSON.stringify(st.kills)}`); if (shots < 8) { await snap(page, `${MODE}-r${String(st.round).padStart(2, '0')}`); shots++; } }
    if (r.status === 'played') { if (r.acted.length) console.log(`  ${r.name}: ${r.acted.join(' | ')}`); stalls = 0; await sleep(300); }
    else if (r.status === 'ai-turn') { await page.evaluate(() => { try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(380); stalls = 0; }
    else { await page.evaluate(() => { try { window.maybeAdvanceTurn(); } catch (e) {} try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(350); if (++stalls > 120) { console.log('(stalled — stopping)'); break; } }
  }

  await sleep(1200); await snap(page, `${MODE}-result`);
  const fin = await page.evaluate(() => { const st = window.GAME.state; const log = (st._fullLogEntries || st.logEntries || []).map(e => typeof e === 'string' ? e : e.m); const a = p => st.units.filter(u => u.player === p && !u.dead && u.hp > 0).length; return { winner: st.winner, round: st.round, p1: a(1), p2: a(2), kills: st.matchKills, log, flags: window.__FLAGS || [] }; });
  fs.writeFileSync(`${SHOTS}/${MODE}-combat-log.txt`, fin.log.join('\n'));
  fs.writeFileSync(`${SHOTS}/${MODE}-flags.json`, JSON.stringify(fin.flags, null, 2));
  console.log('\n========================================');
  const who = fin.winner === 1 ? '🏆 I WIN (P1)' : fin.winner === 2 ? '💀 CPU wins' : fin.winner === 0 ? '⚖️ Draw/No-contest' : `stopped (winner=${fin.winner})`;
  console.log(`${who} — round ${fin.round}, kills ${JSON.stringify(fin.kills)}, alive me:${fin.p1} cpu:${fin.p2}`);
  console.log(`🐞 Bugs flagged: ${fin.flags.length} ${JSON.stringify(fin.flags.slice(0, 8))}`);
  console.log('Artifacts: shots/' + MODE + '-r*.png, ' + MODE + '-result.png, ' + MODE + '-combat-log.txt, ' + MODE + '-flags.json');
  console.log('========================================');
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
