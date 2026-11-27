// playtest_kits.js — THE KIT PROBE (2026-11-27, THE NEW RACES 5; repo-only dev tooling, never uploaded to R2).
// A real VS CPU battle with P1 = the races named in RACES (their whole race kit as the wish-list). On each P1 turn the unit
// casts a race spell it has not cast yet (one with a target), else plays playtest.js's tactics; a frame is saved 0.45 s and
// 1.1 s after every race cast, with the cast's log lines and the target's HP / statuses. Needs the server (npm start).
//   RACES='leopard girl,draconian,flower girl' TAG=k1 MINUTES=8 node playtest_kits.js  -> shots/kits/<TAG>_*.png + <TAG>.json
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const OUT = path.join(REPO, 'shots', 'kits'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'k';
const MAP = process.env.MAP || '';
const MINUTES = +(process.env.MINUTES || 8);
const PICS = (process.env.PICS || '450,1100').split(',').map(Number).filter(x => x >= 0).sort((a, b) => a - b);
const RACES = (process.env.RACES || 'leopard girl,draconian,flower girl').split(',').map(s => s.trim()).filter(Boolean);
const FLAGS = (process.env.FLAGS || '').split(',').filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TURN_FN = eval('(' + fs.readFileSync(path.join(REPO, 'playtest.js'), 'utf8').match(/const TURN_FN = ([\s\S]*?\n\});\n/)[1].replace(/\);\s*$/, '') + ')');

/* one race cast for the active P1 unit, if it has an uncast race spell with a target */
const KIT_TURN = (races) => {
  const G = window.GAME, st = G.state;
  if (!st || st.phase !== 'battle' || st.winner != null) return null;
  const unit = st.units.find(u => u.id === st._blitzActiveUnitId);
  if (!unit || unit.dead || st.controllers[unit.player] !== 'local' || !races.includes(unit.race)) return null;
  window.__kitCast = window.__kitCast || {};
  const done = window.__kitCast[unit.id] = window.__kitCast[unit.id] || {};
  const raceIds = new Set((RACE_ABILITIES[unit.race] || []).map(s => s.id));
  const spells = (unit.spells || []).filter(s => s && raceIds.has(s.id));
  const enemyAt = (x, y) => { const t = G.unitAt(x, y); return t && !t.dead && t.player !== unit.player ? t : null; };
  const allyAt = (x, y) => { const t = G.unitAt(x, y); return t && !t.dead && t.player === unit.player ? t : null; };
  const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  const foes = st.units.filter(u => !u.dead && u.player !== unit.player);
  const order = spells.slice().sort((a, b) => (done[a.id] || 0) - (done[b.id] || 0) || (b.tier || 0) - (a.tier || 0));
  for (const sp of order) {
    if ((done[sp.id] || 0) >= 2) continue;
    try { if (!G.canAffordSpell(unit, sp) || (unit.mp || 0) < (sp.cost || 0)) continue; } catch (e) { continue; }
    if (unit.cooldowns && unit.cooldowns[sp.id] > 0) continue;
    let pick = null;
    const selfCast = sp.aoeOriginSelf || sp.kind === 'healAll' || (sp.range === 0);
    if (selfCast) {
      const R = sp.aoeRadius || sp.auraRadius || 2;
      const near = foes.filter(f => cheb(f, unit) <= R);
      if (sp.kind === 'healAll' ? near.length || unit.hp < unit.maxHp : near.length) pick = { t: { x: unit.x, y: unit.y, z: unit.z }, tg: near[0] || unit };
      if (sp.dcKneel && !near.some(f => f._cowed > 0)) pick = null;
    } else {
      const tiles = G.getSpellRangeTiles(unit, sp) || [];
      for (const t of tiles) {
        let tg = sp.type === 'heal' ? allyAt(t.x, t.y) : enemyAt(t.x, t.y);
        if (tg && sp.type === 'heal' && tg.hp > tg.maxHp * 0.92) tg = null;
        if (sp.kind === 'aoe' && !tg) continue;
        if (tg && (!pick || tg.hp < pick.tg.hp)) pick = { t, tg };
      }
    }
    if (!pick) continue;
    const before = st.units.map(u => ({ id: u.id, hp: Math.round(u.hp), x: u.x, y: u.y }));
    st.selectedTool = sp.name; st.actionMode = 'spell';
    const L0 = st.logEntries.length;
    let ret;
    try { ret = G.doSpell(unit, pick.t.x, pick.t.y, pick.t.z); } catch (e) { ret = 'ERR ' + e.message; }
    st.selectedTool = null; st.actionMode = null;
    if (ret === 0 || ret === false) { done[sp.id] = (done[sp.id] || 0) + 0.5; continue; }
    done[sp.id] = (done[sp.id] || 0) + 1;
    return { spell: sp.id, name: sp.name, caster: unit.race, target: pick.tg.race, tid: pick.tg.id, at: [pick.t.x, pick.t.y], ret: String(ret), L0, before, late: sp.kind === 'healAll' || sp.type === 'heal' };
  }
  /* nothing in reach: step next to the nearest foe once a turn so the melee kits get their casts */
  window.__kitMoved = window.__kitMoved || {};
  const mk = unit.id + ':' + st.round;
  if (!window.__kitMoved[mk] && order.some(sp => (done[sp.id] || 0) < 2 && (sp.range || 1) <= 1)) {
    window.__kitMoved[mk] = 1;
    let best = null;
    for (const t of (G.getMoveTiles(unit) || [])) { if (G.unitAt(t.x, t.y)) continue; const f = foes.filter(f => cheb(f, t) <= 1).length; if (f && (!best || f > best.f)) best = { t, f }; }
    if (best) { try { G.doMove(unit, best.t.x, best.t.y, best.t.z); } catch (e) {} return { moved: 1 }; }
  }
  return null;
};
const AFTER = (c) => {
  const st = GAME.state;
  const logs = st.logEntries.slice(c.L0).map(e => typeof e === 'string' ? e : e.m).slice(0, 14);
  const ch = [];
  for (const b of c.before) { const u = st.units.find(x => x.id === b.id); if (!u) continue; const d = Math.round(u.hp) - b.hp; if (d || u.x !== b.x || u.y !== b.y) ch.push(`${u.race}#${u.id}: ${d > 0 ? '+' : ''}${d}hp${u.x !== b.x || u.y !== b.y ? ` moved (${b.x},${b.y})->(${u.x},${u.y})` : ''}`); }
  const tg = st.units.find(x => x.id === c.tid);
  const sts = tg ? Object.keys(tg.status || {}).filter(k => tg.status[k] > 0).join(',') : '';
  return { logs, changes: ch, targetStatus: sts, cowed: tg && tg._cowed, pollen: tg && tg._pollen };
};

(async () => {
  const browser = await require(path.join(REPO, 'probe-fast.js')).launch(chromium, { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((flags) => { try { localStorage.setItem('ew_cinematicActionCam', '1'); } catch (e) {} for (const f of flags) { const [k, val] = f.split('='); window[k] = val === undefined ? true : (isNaN(+val) ? val : +val); } }, FLAGS);
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { const t = m.text(); if (/\[EW BUILD\]/.test(t)) console.log(t.slice(0, 200)); if (m.type() === 'error' && !/Raycaster/.test(t) && !/Failed to load resource|ERR_/.test(t)) { errs.push(t.slice(0, 200)); console.log('CONERR', t.slice(0, 200)); } });
  page.on('pageerror', e => { errs.push(e.message.split('\n')[0]); console.log('PAGEERR', e.message.split('\n')[0].slice(0, 200)); });
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 120; i++) { if (await page.evaluate(() => typeof window._goToVsCpu === 'function' && !!window.GAME).catch(() => false)) break; await sleep(1000); }
  await sleep(4000);
  await page.evaluate(() => { window.EW_DISABLE_INTRO_CINE = true; });
  await page.evaluate(() => window._goToVsCpu());
  await sleep(2500);
  console.log('launch', await page.evaluate((id) => {
    try {
      const mi = id ? MS_MAP_LIST.findIndex(x => x.modeId === id || x.id === id) : -1;
      if (mi >= 0) _msSelectedMap = mi;
      const gi = MS_GAME_MODES.findIndex(x => x.id === 'tdm'); if (gi >= 0) _msSelectedGM = gi;
      if (typeof window._msConfirm === 'function') { window._msConfirm(); return 'confirm map ' + mi; }
    } catch (e) { return 'err:' + e.message; }
    return 'none';
  }, MAP));
  await sleep(2500);
  const SET = (races) => {
    const st = GAME.state;
    races.forEach((r, i) => {
      if (!st.partyMeta[1][i]) return;
      const sg = typeof RACE_SPRITE_GENDERS !== 'undefined' ? RACE_SPRITE_GENDERS[r] : null;
      const g = sg === 'female' ? 'female' : (sg === 'male' || r === 'draconian' ? 'male' : 'female');
      st.partyMeta[1][i].race = r; st.partyMeta[1][i].gender = g;
      st.partyMeta[1][i].customSpells = (RACE_ABILITIES[r] || []).map(s => s.id);
      st.partyNames[1][i] = '';
    });
    return st.partyMeta[1].map(m => m && m.race);
  };
  console.log('party', JSON.stringify(await page.evaluate(SET, RACES)));
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => /SEAL YOUR FATE/i.test(x.innerText)); if (b) b.click(); }); await sleep(1500); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate((races) => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } }, RACES);
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'ai' }; });
  { let ok = 0; for (let i = 0; i < 90 && ok < 6; i++) { await sleep(1000); const ph = await page.evaluate(() => GAME.state.phase); if (ph === 'battle') ok++; else { ok = 0; if (i % 8 === 7) { console.log('restart match (phase ' + ph + ')'); await page.evaluate(() => { const st = GAME.state; try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} }); } } } }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'ai' }; });
  const LOADING = () => { const vis = e => e && e.offsetParent && getComputedStyle(e).opacity > 0.1; return [...document.querySelectorAll('.ls-status, .ls-hint')].some(vis) || [...document.querySelectorAll('div,span')].some(e => e.childElementCount === 0 && /TAP TO SKIP/.test(e.textContent) && vis(e)); };
  for (let i = 0; i < 480; i++) { if (!(await page.evaluate(LOADING).catch(() => true))) break; if (i % 30 === 0) console.log('loading…'); await page.evaluate(() => { try { window.maybeAdvanceTurn(); } catch (e) {} }).catch(() => {}); await sleep(1000); }
  const team = await page.evaluate(() => GAME.state.units.map(u => `${u.player}:${u.race}#${u.id} hp${u.maxHp} [${(u.spells || []).map(s => s.id).join(' ')}] passives:${(u.passives || []).join(',')}`));
  console.log('TEAMS\n  ' + team.join('\n  '));
  await page.screenshot({ path: `${OUT}/${TAG}_start.png` });
  const rows = []; let n = 0, stalls = 0;
  const start = Date.now();
  while (Date.now() - start < MINUTES * 60000) {
    const c = await page.evaluate(KIT_TURN, RACES).catch(e => ({ err: String(e.message).slice(0, 120) }));
    if (c && c.err) console.log('KITERR', c.err);
    if (c && c.moved) { await sleep(900); continue; }
    if (c && c.spell) {
      n++;
      /* PICS=ms,ms,… (11-27, the Snowman): more frames of a cast, named _p<ms>; the default two stay _a (450) and _b (1100) */
      let pa, pb, tPrev = 0;
      for (const ms of PICS) { await sleep(Math.max(0, ms - tPrev)); tPrev = ms; const nm = `${TAG}_${String(n).padStart(2, '0')}_${c.spell}_${PICS.length === 2 ? (ms === PICS[0] ? 'a' : 'b') : 'p' + ms}.png`; try { await page.screenshot({ path: `${OUT}/${nm}` }); } catch (e) {} if (!pa) pa = nm; pb = nm; }
      if (c.late) { await sleep(900); try { await page.screenshot({ path: `${OUT}/${pb.replace('_b.png', '_c.png')}` }); } catch (e) {} }
      await sleep(900);
      const a = await page.evaluate(AFTER, c).catch(e => ({ err: e.message }));
      const row = Object.assign({ n, pics: [pa, pb], round: await page.evaluate(() => GAME.state.round) }, c, a); delete row.before;
      rows.push(row);
      console.log(`CAST ${n} r${row.round} ${c.caster} ${c.name} -> ${c.target} | ${(a.changes || []).join('; ')} | status ${a.targetStatus}${a.cowed ? ' cowed' + a.cowed : ''}${a.pollen ? ' pollen' + a.pollen : ''}`);
      for (const l of (a.logs || [])) console.log('    · ' + String(l).slice(0, 170));
      await page.evaluate(() => { const st = GAME.state; const u = st.units.find(x => x.id === st._blitzActiveUnitId); if (u && st.controllers[u.player] === 'local') { u.ap = 0; try { window.endUnitIfDone(u); } catch (e) {} } });
      continue;
    }
    const r = await page.evaluate(TURN_FN).catch(e => ({ status: 'err', e: String(e.message).slice(0, 80) }));
    const st = await page.evaluate(() => { const s = window.GAME.state; return { round: s.round, winner: s.winner }; });
    if (st.winner != null) { console.log('winner', st.winner); break; }
    if (r.status === 'played') { stalls = 0; await sleep(300); }
    else if (r.status === 'ai-turn') { await page.evaluate(() => { try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(380); stalls = 0; }
    else { await page.evaluate(() => { try { window.maybeAdvanceTurn(); } catch (e) {} try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(350); if (++stalls > 200) { console.log('stalled'); break; } }
  }
  const tail = await page.evaluate(() => GAME.state.logEntries.slice(-400).map(e => typeof e === 'string' ? e : e.m).filter(m => /🐆|🐉|🌸|⛄|Cowed|Pollen|AMBUSH|Rosettes|Dominion|Cold Spot/.test(m)));
  fs.writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify({ rows, errs, ruleLog: tail }, null, 1));
  console.log('RULE LOG (last)\n  ' + tail.slice(-40).join('\n  '));
  console.log('ERRORS', errs.length, errs.slice(0, 8));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
