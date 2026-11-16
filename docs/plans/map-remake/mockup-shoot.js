const { chromium } = require((() => { try { return require.resolve('playwright'); } catch (e) { return require('path').resolve(__dirname, '../../../node_modules/playwright'); } })()); const p = require('path');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: +(process.env.DSF || 1) });
  const errs = []; pg.on('pageerror', e => errs.push(String(e.message))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto('file://' + p.join(__dirname, 'local.html')); await pg.waitForTimeout(1500);
  const shot = async (name, fn) => { await pg.evaluate(fn); await pg.waitForTimeout(250); await pg.screenshot({ path: p.join(__dirname, 'out', name + '.png'), fullPage: false }); console.log('shot', name); };
  const only = (process.env.ONLY || '').split(',').filter(Boolean); const S = [
    ['1_world_surface', () => { MAPMOCK.open('world'); }],
    ['2_world_under', () => { MAPMOCK.S.layer = 'under'; MAPMOCK.S.view = null; MAPMOCK.render(); }],
    ['3_zone_city', () => { MAPMOCK.open('zone', 'city'); }],
    ['4_district_heroplaza', () => { MAPMOCK.open('zone', 'city', 'H'); MAPMOCK.S.pick = { zone: 'city', sheet: 0, plot: MAPMOCK_pick('city', 6, 7) }; MAPMOCK.render(); }],
    ['5_zone_woods', () => { MAPMOCK.open('zone', 'woods'); }],
    ['6_zone_mountains', () => { MAPMOCK.open('zone', 'mountains'); }],
    ['7_zone_beach', () => { MAPMOCK.open('zone', 'beach'); }],
    ['8_newsave_world', () => { MAPMOCK.S.fog = true; MAPMOCK.open('world'); }],
    ['9_newsave_city', () => { MAPMOCK.S.fog = true; MAPMOCK.open('zone', 'city'); }],
  ];
  await pg.evaluate(() => { window.MAPMOCK_pick = (z, c, r) => DATA.zones.find(x => x.id === z).sheets[0].plots.find(p => p.c === c && p.r === r).id; });
  for (const [n, f] of S) if (!only.length || only.some(o => n.startsWith(o))) await shot(n, f);
  if (process.env.PHONE) { await pg.setViewportSize({ width: 400, height: 900 }); await pg.evaluate(() => { MAPMOCK.S.fog = false; MAPMOCK.open('zone', 'woods'); }); await pg.waitForTimeout(300); await pg.screenshot({ path: p.join(__dirname, 'out', 'phone.png'), fullPage: true }); console.log('overflow', await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth)); }
  console.log('ERRORS', JSON.stringify(errs)); await b.close();
})();
