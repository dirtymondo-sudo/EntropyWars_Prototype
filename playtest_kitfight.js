// playtest_kitfight.js — THE KIT PROBE (2026-11-27, repo-only dev tooling, never uploaded to R2).
// A real VS CPU battle in which Player 1's units are the races you name and cast THEIR OWN spells through the real doSpell
// pipeline, on their own turns, with the action camera on; a frame is saved ~0.35 s and ~0.9 s after each cast's hit. Enemy
// turns are the real AI. Built for the Leprechaun / Medic / Martian Girl kits; works for any race. Needs the server (npm start).
// Never run two probes at once.
//   UNITS=leprechaun:male,medic:male,medic:female,martian:female SPELLS=lpShillelagh,mdPrescription MINUTES=8 TAG=kit node playtest_kitfight.js
//   -> shots/kit/<TAG>_<spell>_a.png / _b.png + <TAG>.json (what was cast, on whom, errors)
// SPELLS = the rows to try (default: every spell of the named races' kits). MAP = a map id (default: the picker's first).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const REPO = __dirname;
const OUT = path.join(REPO, 'shots', 'kit'); fs.mkdirSync(OUT, { recursive: true });
const TAG = process.env.TAG || 'kit';
const MAP = process.env.MAP || '';
const MINUTES = +(process.env.MINUTES || 8);
const UNITS = (process.env.UNITS || 'leprechaun:male,medic:male,medic:female,martian:female').split(',').map(s => { const [race, gender] = s.split(':'); return { race, gender: gender || 'male' }; });
const WANT = (process.env.SPELLS || '').split(',').filter(Boolean);
const FLAGS = (process.env.FLAGS || '').split(',').filter(Boolean);
const REPEAT = +(process.env.REPEAT || 1);                                    // cast each row this many times (Transform: there and back)
const FRAMES = (process.env.FRAMES || '').split(',').map(Number).filter(Boolean);   // FRAMES=10,1200: ten more frames, 1.2 s apart, after a cast (a change that plays on: _f0.._f9)
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TURN_FN = eval('(' + fs.readFileSync(path.join(REPO, 'playtest.js'), 'utf8').match(/const TURN_FN = ([\s\S]*?\n\});\n/)[1].replace(/\);\s*$/, '') + ')');
const END = () => { const st = window.GAME.state, u = st.units.find(x => x.id === st._blitzActiveUnitId); if (u && st.controllers[u.player] === 'local') { u.ap = 0; try { window.endUnitIfDone(u); } catch (e) {} } };

/* in the page, on a P1 unit's turn: cast the next untried spell of its own (enemy / ally / tile / fallen ally as the kind wants) */
const CAST = (todo, repeat) => {
  const G = window.GAME, st = G.state;
  if (!st || st.phase !== 'battle') return { status: 'not-battle' };
  if (st.winner != null) return { status: 'done' };
  const unit = st.units.find(u => u.id === st._blitzActiveUnitId);
  if (!unit || unit.dead) return { status: 'no-unit' };
  if (st.controllers[unit.player] !== 'local') return { status: 'ai-turn' };
  window.__kitTried = window.__kitTried || {};
  if ((repeat || 1) > 1 && window.__kitOnly != null && window.__kitOnly !== unit.id) return { status: 'nothing', race: unit.race, has: [] };   // (REPEAT: the same unit casts again, there and back)
  const rows = (unit.spells || []).filter(s => s && todo.indexOf(s.id) >= 0 && (window.__kitTried[s.id] | 0) < (repeat || 1));
  const ENEMY = new Set(['damage', 'aoe', 'line', 'lifeDrain', 'debuff', 'multiHit', 'barrage']);
  const D = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  for (const spell of rows) {
    if (!G.canAffordSpell(unit, spell) || (unit.mp || 0) < (spell.cost || 0)) continue;
    const tiles = G.getSpellRangeTiles(unit, spell) || [];
    let pick = null;
    if (spell.kind === 'healAll' || spell.kind === 'transform' || (spell.kind === 'buff' && !spell.range)) pick = { x: unit.x, y: unit.y, z: unit.z };
    else if (spell.kind === 'revive') {
      const dead = st.units.find(u => u.player === unit.player && u.dead && D(u, unit) <= (spell.range || 1) + 3);
      if (!dead) continue; pick = { x: dead.x, y: dead.y, z: dead.z };
    } else if (spell.kind === 'teleport') {
      let best = null; for (const t of tiles) { if (G.unitAt(t.x, t.y, t.z)) continue; const d = D(t, unit); if (!best || d > best.d) best = { t, d }; }
      if (best) pick = best.t;
    } else if (spell.kind === 'zoneHeal' || spell.type === 'heal') {
      let best = null; for (const t of tiles) { const a = G.unitAt(t.x, t.y, t.z); if (a && a.player === unit.player && !a.dead) { const miss = a.maxHp - a.hp; if (!best || miss > best.m) best = { t, m: miss }; } }
      if (best) pick = best.t;
    } else if (ENEMY.has(spell.kind)) {
      for (const t of tiles) { const e = G.unitAt(t.x, t.y, t.z); if (e && e.player !== unit.player && !e.dead) { pick = t; break; } }
    }
    if (!pick) continue;
    st.selectedTool = spell.name; st.actionMode = 'spell';
    const L0 = st.logEntries.length;
    let ret, err = null;
    try { ret = G.doSpell(unit, pick.x, pick.y, pick.z); } catch (e) { err = String(e && e.message || e); }
    st.selectedTool = null; st.actionMode = null;
    window.__kitTried[spell.id] = (window.__kitTried[spell.id] | 0) + 1; window.__kitOnly = unit.id;
    const logs = st.logEntries.slice(L0).map(e => typeof e === 'string' ? e : e.m).slice(0, 6);
    return { status: 'cast', spell: spell.id, race: unit.race, gender: unit.gender, at: pick, ret: ret === undefined ? 'undef' : ret, err, logs, gold: unit.lpGold | 0 };
  }
  return { status: 'nothing', race: unit.race, has: (unit.spells || []).map(s => s.id) };
};

(async () => {
  const browser = await require(path.join(REPO, 'probe-fast.js')).launch(chromium, { headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true });
  await ctx.addInitScript((flags) => { try { localStorage.setItem('ew_cinematicActionCam', '1'); } catch (e) {} for (const f of flags) { const [k, val] = f.split('='); window[k] = val === undefined ? true : (isNaN(+val) ? val : +val); } }, FLAGS);
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { const t = m.text(); if ((m.type() === 'error' || /\[VFX\]/.test(t)) && !/Raycaster|Failed to load resource|ERR_/.test(t)) { errs.push(t.slice(0, 300)); console.log('CONERR', t.slice(0, 240)); } });
  page.on('pageerror', e => { errs.push('PAGE ' + e.message); console.log('PAGEERR', e.message.split('\n')[0].slice(0, 240)); });
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 120000 });
  for (let i = 0; i < 120; i++) { if (await page.evaluate(() => typeof window._goToVsCpu === 'function' && !!window.GAME).catch(() => false)) break; await sleep(1000); }
  await sleep(4000);
  console.log('build', await page.evaluate(() => JSON.stringify(window.EW_BUILD || null)));
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
  /* P1's units = the races named, their loadouts = their own kits (the AI side keeps its random teams) */
  console.log('party', await page.evaluate((units) => {
    const st = window.GAME.state; st.partyMeta = st.partyMeta || {}; st.partyMeta[1] = st.partyMeta[1] || [];
    const out = [];
    for (let i = 0; i < Math.min(units.length, st.partyBuilds[1].length); i++) {
      const U = units[i], cls = st.partyBuilds[1][i];
      st.partyMeta[1][i] = Object.assign({}, st.partyMeta[1][i] || {}, { race: U.race, gender: U.gender });
      try { st.loadouts[1][i] = window.randomSpellLoadoutForClass ? window.randomSpellLoadoutForClass(cls, U.race, U.gender) : st.loadouts[1][i]; } catch (e) { out.push('lo err ' + e.message); }
      out.push(U.race + ':' + U.gender);
    }
    return out.join(' ');
  }, UNITS));
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary') || [...document.querySelectorAll('button')].find(x => /SEAL YOUR FATE/i.test(x.innerText)); if (b) b.click(); }); await sleep(1500); if (await page.evaluate(() => window.GAME.state.phase) === 'battle') break; }
  await page.evaluate(() => { const st = window.GAME.state; if (st.phase !== 'battle') { try { window.applyPartyBuild(false); } catch (e) {} st.teamLockedIn = true; try { window.startMatch(); } catch (e) {} } });
  for (let i = 0; i < 60; i++) { if (await page.evaluate(() => window.GAME?.state?.phase) === 'battle') break; await sleep(1000); }
  await page.evaluate(() => { window.GAME.state.controllers = { 1: 'local', 2: 'ai' }; });
  const LOADING = () => { const vis = e => e && e.offsetParent && getComputedStyle(e).opacity > 0.1; return [...document.querySelectorAll('.ls-status, .ls-hint')].some(vis) || [...document.querySelectorAll('div,span')].some(e => e.childElementCount === 0 && /TAP TO SKIP/.test(e.textContent) && vis(e)); };
  for (let i = 0; i < 480; i++) { if (!(await page.evaluate(LOADING).catch(() => true))) break; if (i % 30 === 0) console.log('loading…'); await page.evaluate(() => { try { window.maybeAdvanceTurn(); } catch (e) {} }).catch(() => {}); await sleep(1000); }
  /* every P1 unit carries its race's whole kit (a random loadout holds 4 of them): the rows go on the unit as the game builds them */
  await page.evaluate((units) => { window.__kitUnits = units; }, UNITS);
  await sleep(6000);
  const todo = await page.evaluate((want) => {
    const st = window.GAME.state, all = [];
    let k = 0;
    for (const u of st.units) {
      if (u.player !== 1) continue;
      if (window.__kitUnits && window.__kitUnits[k]) u.gender = window.__kitUnits[k].gender; k++;
      const kit = (window.RACE_ABILITIES && window.RACE_ABILITIES[u.race]) || [];
      const off = (typeof window.raceGenderOffSpellIds === 'function') ? window.raceGenderOffSpellIds(u.race, u.gender) : [];
      const mine = kit.filter(s => off.indexOf(s.id) < 0 && (/^(lp|md|go(Hypno|Brain))/.test(s.id) || want.indexOf(s.id) >= 0));
      for (const s of mine) { if (!(u.spells || []).some(x => x.id === s.id)) { u.spells = (u.spells || []).concat([Object.assign({}, s)]); } if (all.indexOf(s.id) < 0) all.push(s.id); }
      u.mp = u.maxMp = Math.max(u.maxMp || 0, 999);
    }
    return want.length ? want : all;
  }, WANT);
  console.log('units', await page.evaluate(() => JSON.stringify(window.GAME.state.units.filter(u => u.player === 1).map(u => [u.race, u.gender, u.spells.length]))));
  console.log('todo', todo.join(','));
  await page.evaluate('window.__kitCast = ' + CAST.toString());
  const start = Date.now(), rows = []; let stalls = 0;
  while (Date.now() - start < MINUTES * 60000) {
    const left = todo.filter(id => rows.filter(r => r.spell === id).length < REPEAT);
    if (!left.length) break;
    const r = await page.evaluate(([l, n]) => (window.__kitCast)(l, n), [left, REPEAT]).catch(e => ({ status: 'err', e: String(e.message).slice(0, 120) }));
    if (r.status === 'cast') {
      console.log('CAST', JSON.stringify(r));
      await sleep(900); try { await page.screenshot({ path: `${OUT}/${TAG}_${r.spell}_a.png` }); } catch (e) {}
      await sleep(700); try { await page.screenshot({ path: `${OUT}/${TAG}_${r.spell}_b.png` }); } catch (e) {}
      for (let fi = 0; fi < (FRAMES[0] || 0); fi++) { await sleep(FRAMES[1] || 1000); try { await page.screenshot({ path: `${OUT}/${TAG}_${r.spell}_${rows.filter(x => x.spell === r.spell).length}_f${fi}.png` }); } catch (e) {} }
      r.gold2 = await page.evaluate(() => { const u = GAME.state.units.find(x => x.race === 'leprechaun'); return u ? u.lpGold | 0 : null; });
      rows.push(r); stalls = 0;
      for (let i = 0; i < 20 && await page.evaluate(() => camera && camera._cineShotId != null).catch(() => false); i++) await sleep(300);
      await page.evaluate(END);
      continue;
    }
    const st = await page.evaluate(() => { const s = window.GAME.state; return { round: s.round, winner: s.winner }; });
    if (st.winner != null) { console.log('winner', st.winner); break; }
    if (r.status === 'nothing') { const t = await page.evaluate(TURN_FN).catch(e => ({ e: String(e.message) })); console.log('PLAYED', r.race, JSON.stringify(t.acted || t).slice(0, 160)); await sleep(600); }
    else if (r.status === 'ai-turn') { await page.evaluate(() => { try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(500); }
    else { await page.evaluate(() => { try { window.maybeAdvanceTurn(); } catch (e) {} try { window.maybeTriggerComputerTurn(); } catch (e) {} }); await sleep(400); if (++stalls > 300) { console.log('stalled'); break; } }
  }
  fs.writeFileSync(`${OUT}/${TAG}.json`, JSON.stringify({ rows, errs }, null, 1));
  console.log('SUMMARY cast', rows.length, 'of', todo.length, '| missing', todo.filter(id => !rows.some(r => r.spell === id)).join(',') || 'none', '| errors', errs.length);
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
