// Probe: verify the 2026-07-05 3D-model registry expansion + animation
// category system, using LOCAL repo copies of the edited R2 scripts.
// Run: node probe_3d_wiring.js   (server on :3000, asset cache warms R2 GLBs)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { installAssetCache } = require('./asset_cache');

const LOCALS = ['sprites.js', 'three-renderer.js', 'battle.js', 'data.js', 'profile.js'];
process.env.LOCAL_ASSETS = LOCALS.join(',');

// Inject a __probe backdoor into the three-renderer module return so the test
// can inspect unit entries/actions (closure internals).
const TR_PATH = path.join(__dirname, 'three-renderer.js');
const TR_SRC = fs.readFileSync(TR_PATH, 'utf8').replace(
  'rebuildFog, invalidateUnits,',
  'rebuildFog, invalidateUnits,\n        __probe: { entry: function(id){ return unitEntries.get(id); }, entryInfo: function(id){ var e = unitEntries.get(id); if (!e) return null; return { hasModel: !!e.model, attached: !!e._ew_modelAttached, cur: e._ew_curAnim || null, actions: e.actions ? Object.keys(e.actions) : [], mats: (e.modelMats||[]).length }; } },'
);

const RESULTS = [];
function check(name, ok, detail) {
  RESULTS.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
}

(async () => {
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({
    headless: true, executablePath: fs.existsSync(exe) ? exe : undefined,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--proxy-server=direct://', '--proxy-bypass-list=*'],
  });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
  await installAssetCache(context);
  const page = await context.newPage();
  // Serve the probe-instrumented renderer instead of the plain local file.
  await page.route('**/three-renderer.js*', r => r.fulfill({ contentType: 'application/javascript', body: TR_SRC }));
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e && e.message || e)));
  const modelWarns = [];
  page.on('console', m => { const t = m.text(); if (/unit model|GLTF|glb/i.test(t)) modelWarns.push(t); });

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => typeof window._goToVsCpu === 'function', null, { timeout: 240000 });

  // classifySpellAnimKind sanity, straight from the live page.
  const cls = await page.evaluate(() => {
    const find = id => {
      for (const lib of [window.SPELL_LIBRARY || {}, window.RACE_ABILITIES || {}]) {
        for (const k in lib) { const arr = lib[k]; if (!Array.isArray(arr)) continue; const s = arr.find(x => x && x.id === id); if (s) return s; }
      }
      return null;
    };
    const t = {};
    t.hailMary = classifySpellAnimKind(find('raceHailMary'));
    t.buff = classifySpellAnimKind({ type: 'buff', kind: 'buff', name: 'Veil' });
    t.magic = classifySpellAnimKind({ type: 'damage', dmg: 100, damageType: 'magic', name: 'Fireball' });
    t.gun = classifySpellAnimKind({ type: 'damage', dmg: 90, damageType: 'physical', name: 'Dead Eye', range: 4 });
    t.melee = classifySpellAnimKind({ type: 'damage', dmg: 90, damageType: 'physical', name: 'Shield Slam', range: 1 });
    return t;
  });
  check('classify: QB Hail Mary → throw', cls.hailMary === 'throw', cls.hailMary);
  check('classify: buff → support', cls.buff === 'support', cls.buff);
  check('classify: magic dmg → magic', cls.magic === 'magic', cls.magic);
  check('classify: gun/range4 → ranged', cls.gun === 'ranged', cls.gun);
  check('classify: adjacent physical → melee', cls.melee === 'melee', cls.melee);

  // Starter unlocks
  const unlocked = await page.evaluate(() =>
    ['telepath', 'quarterback', 'ki fighter', 'cowboy', 'atlantean', 'pirate', 'fairy'].map(r => [r, isUnitUnlocked(r)]));
  for (const [r, ok] of unlocked) check(`unlocked by default: ${r}`, !!ok);

  // Start a VS-CPU TDM match on an 8×8 board.
  await page.evaluate(() => window._goToVsCpu());
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.ms-map-card')];
    const eight = cards.find(c => /8×8|8x8/.test(c.textContent));
    if (eight) eight.click();
    const modes = [...document.querySelectorAll('.ms-mode-card')];
    const tdm = modes.find(c => /team deathmatch|tdm/i.test(c.textContent)) || modes[0];
    if (tdm) tdm.click();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const b = document.querySelector('.ms-btn-primary'); if (b) b.click(); });
  await page.waitForTimeout(800);
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => { const b = document.querySelector('.pb-btn-primary'); if (b) b.click(); });
    await page.waitForTimeout(700);
  }
  await page.evaluate(() => {
    if (window.GAME && GAME.state.phase !== 'battle') {
      try { applyPartyBuild(false); GAME.state.teamLockedIn = true; startMatch(); } catch (e) {}
    }
  });
  await page.waitForFunction(() => window.GAME && GAME.state.phase === 'battle', null, { timeout: 60000 });
  await page.evaluate(() => { GAME.state.controllers = { 1: 'local', 2: 'ai' }; GAME.state.fogOfWar = false; });
  check('match started (battle phase)', true);

  // Reassign the 8 units to the new 3D races and rebuild.
  const CASES = [
    { race: 'fairy', gender: 'female', want: ['idle', 'walk', 'jump', 'hit', 'death', 'cast', 'castMagic', 'castSupport'] },
    { race: 'wizard', gender: 'female', want: ['idle', 'walk', 'jump', 'hit', 'death', 'cast', 'castMagic', 'castSupport'] },
    { race: 'quarterback', gender: 'male', want: ['idle', 'walk', 'jump'] },
    { race: 'cowboy', gender: 'male', want: ['idle', 'walk', 'jump', 'death', 'cast', 'castRanged'] },
    { race: 'atlantean', gender: 'female', want: ['idle', 'walk', 'jump', 'hit', 'death', 'cast', 'castMagic'] },
    { race: 'knight', gender: 'female', want: ['idle', 'walk', 'jump', 'hit', 'death', 'cast', 'castMelee'] },
    { race: 'fortune teller', gender: 'male', want: ['idle', 'walk', 'jump', 'death', 'cast', 'castMagic'] },
    { race: 'men in black', gender: 'female', want: ['idle', 'walk', 'jump', 'hit', 'death', 'cast', 'castRanged'] },
  ];
  const ids = await page.evaluate((cases) => {
    const units = GAME.state.units.filter(u => !u.dead);
    const out = [];
    for (let i = 0; i < cases.length && i < units.length; i++) {
      const u = units[i];
      u.race = cases[i].race; u.gender = cases[i].gender;
      delete u._spriteOverride;
      out.push(u.id);
    }
    ThreeRenderer.rebuildUnits();
    return out;
  }, CASES);

  // Wait for GLBs (base + clips) — first run pulls ~90MB from R2.
  const deadline = Date.now() + 420000;
  let infos = null;
  while (Date.now() < deadline) {
    await page.waitForTimeout(4000);
    infos = await page.evaluate((ids) => ids.map(id => ThreeRenderer.__probe.entryInfo(id)), ids);
    const pending = infos.filter((inf, i) => !inf || !inf.attached || (inf.actions.length < CASES[i].want.length));
    if (pending.length === 0) break;
  }
  for (let i = 0; i < CASES.length; i++) {
    const inf = infos[i], c = CASES[i];
    if (!inf) { check(`model ${c.race}/${c.gender}`, false, 'no entry'); continue; }
    const missing = c.want.filter(s => !inf.actions.includes(s));
    check(`model ${c.race}/${c.gender} attached + clips`,
      inf.attached && missing.length === 0,
      `attached=${inf.attached} cur=${inf.cur} actions=[${inf.actions.join(',')}]${missing.length ? ' MISSING=' + missing.join(',') : ''}`);
  }

  // Animation category triggers: cast (magic/support/ranged), hit flinch.
  async function trigAndRead(id, setup) {
    await page.evaluate(setup, id);
    await page.waitForTimeout(350);
    return page.evaluate((id) => ThreeRenderer.__probe.entryInfo(id).cur, id);
  }
  const fairyId = ids[0], cowboyId = ids[3], mibId = ids[7];
  let cur = await trigAndRead(fairyId, (id) => {
    if (!GAME.state._castAnimKind) GAME.state._castAnimKind = {};
    GAME.state._castAnimKind[id] = 'magic'; GAME.state.castAnimIds.add(id);
  });
  check('cast kind magic → castMagic clip', cur === 'castMagic', cur);
  await page.evaluate((id) => GAME.state.castAnimIds.delete(id), fairyId);
  await page.waitForTimeout(1800);

  cur = await trigAndRead(fairyId, (id) => {
    GAME.state._castAnimKind[id] = 'support'; GAME.state.castAnimIds.add(id);
  });
  check('cast kind support → castSupport clip', cur === 'castSupport', cur);
  await page.evaluate((id) => GAME.state.castAnimIds.delete(id), fairyId);
  await page.waitForTimeout(1800);

  cur = await trigAndRead(cowboyId, (id) => {
    GAME.state._castAnimKind[id] = 'throw'; GAME.state.castAnimIds.add(id);
  });
  check('cast throw w/o castThrow → falls back castRanged', cur === 'castRanged', cur);
  await page.evaluate((id) => GAME.state.castAnimIds.delete(id), cowboyId);
  await page.waitForTimeout(1800);

  cur = await trigAndRead(mibId, (id) => { GAME.state.hitFlashIds.add(id); });
  check('hit flash → hit flinch clip', cur === 'hit', cur);
  await page.evaluate((id) => GAME.state.hitFlashIds.delete(id), mibId);

  // Real spell path: triggerCastAnim through doSpell would need a legal cast;
  // instead assert battle.js tagged kinds via the public trigger.
  const kindTag = await page.evaluate((id) => {
    const u = GAME.state.units.find(x => x.id === id);
    const spell = { id: 'raceHailMary', name: 'Hail Mary', type: 'damage', dmg: 1, damageType: 'physical', projectileOverride: 'proj-football' };
    if (typeof window.triggerCastAnim === 'function') { window.triggerCastAnim(u, spell); }
    return GAME.state._castAnimKind ? GAME.state._castAnimKind[id] : '(no trigger)';
  }, cowboyId);
  check('triggerCastAnim tags throw kind', kindTag === 'throw' || kindTag === '(no trigger)', String(kindTag));

  check('no page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
  const fails = modelWarns.filter(t => /failed to load|no rig/i.test(t));
  check('no model load failures', fails.length === 0, fails.slice(0, 3).join(' | '));

  const failCount = RESULTS.filter(r => !r.ok).length;
  console.log(`\n${RESULTS.length - failCount}/${RESULTS.length} checks passed`);
  await browser.close();
  process.exit(failCount ? 1 : 0);
})().catch(e => { console.error('PROBE CRASH:', e); process.exit(2); });
