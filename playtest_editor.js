// playtest_editor.js — THE EDITOR probe (EDITOR_PLAN.md E0, 2026-09-29), for a sandbox where the CDN is blocked (the same mirrors as
// playtest_hq_offline.js: repo scripts from disk, three r128 + TransformControls from node_modules, stand-in textures). Needs `npm start`.
//   node playtest_editor.js            → opens the editor on a fresh world, adds a shape of every kind + a prop + a door, drags, undoes,
//                                        PLAY HERE and back, a library room + COPY INTO WORLD, EXPORT; shots in shots/editor/
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const REPO = __dirname;
const { chromium } = require(path.join(REPO, 'node_modules/playwright'));
const OUT = path.join(REPO, 'shots/editor'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NPM_MIRROR = [
  [/\/three\.js\/r128\/three\.min\.js$/, 'three/build/three.min.js'], [/\/three@0\.128\.0\/(examples\/js\/.+)$/, 'three/$1'],
  [/\/socket\.io\.min\.js$/, 'socket.io/client-dist/socket.io.min.js'], [/\/react\.production\.min\.js$/, 'react/umd/react.production.min.js'],
  [/\/react-dom\.production\.min\.js$/, 'react-dom/umd/react-dom.production.min.js'],
];
function png(w, h, c) { const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * (w * 4 + 1) + 1 + x * 4, n = 0.85 + ((x * 7 + y * 13) % 10) / 33; raw[o] = c[0] * n; raw[o + 1] = c[1] * n; raw[o + 2] = c[2] * n; raw[o + 3] = 255; }
  const T = []; for (let n = 0; n < 256; n++) { let c2 = n; for (let k = 0; k < 8; k++) c2 = c2 & 1 ? 0xedb88320 ^ (c2 >>> 1) : c2 >>> 1; T[n] = c2 >>> 0; }
  const crc = b => { let x = 0xffffffff; for (const v of b) x = T[(x ^ v) & 255] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(td)); return Buffer.concat([l, td, cc]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch('IHDR', ih), ch('IDAT', zlib.deflateSync(raw)), ch('IEND', Buffer.alloc(0))]); }
const E2 = process.argv[2] === 'e2';   // `node playtest_editor.js e2` → THE PALETTE sweep (E2): every tab, a tile of each placed by real clicks, the door tool, paint, thumbnails
const GLB_STANDIN = fs.readFileSync(path.join(REPO, 'charactercreation/Meshy_AI_human_body_base_mesh_male.glb'));   // any mesh: the bucket is blocked here
const OBJ_STANDIN = 'o t\ng Bark\nv -0.2 0 -0.2\nv 0.2 0 -0.2\nv 0.2 0 0.2\nv -0.2 0 0.2\nv -0.2 3 -0.2\nv 0.2 3 -0.2\nv 0.2 3 0.2\nv -0.2 3 0.2\nvt 0 0\nvt 1 0\nvt 1 1\nf 1/1 2/2 6/3\nf 2/1 3/2 7/3\nf 3/1 4/2 8/3\nf 4/1 1/2 5/3\ng Tree_Leaves\nv -1.5 2.5 -1.5\nv 1.5 2.5 -1.5\nv 0 5 0\nv 1.5 2.5 1.5\nv -1.5 2.5 1.5\nf 9/1 10/2 11/3\nf 10/1 12/2 11/3\nf 12/1 13/2 11/3\nf 13/1 9/2 11/3\n';
const PAL = [[/grass/, [70, 120, 60]], [/rock/, [120, 112, 108]], [/dirt/, [120, 95, 70]], [/concrete/, [130, 130, 134]], [/water|sea/, [40, 90, 130]]];
const texC = {}; const standIn = u => { const b = u.toLowerCase(); let c = [140, 130, 150]; for (const [re, col] of PAL) if (re.test(b)) { c = col; break; } const k = c.join(); return texC[k] || (texC[k] = png(32, 32, c)); };
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--proxy-server=direct://', '--proxy-bypass-list=*'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 860 }, acceptDownloads: true });
  await context.route('**/*', async (route) => {
    const url = route.request().url(); let u; try { u = new URL(url); } catch (e) { return route.continue(); }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return route.continue();
    const base = path.basename(u.pathname), ext = path.extname(base).toLowerCase();
    for (const [re, target] of NPM_MIRROR) { const m = re.exec(u.pathname); if (m) { const abs = path.join(REPO, 'node_modules', target.replace(/\$(\d)/g, (_, i) => m[Number(i)])); if (fs.existsSync(abs)) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(abs) }); } }
    if ((ext === '.js' || ext === '.css') && fs.existsSync(path.join(REPO, base))) return route.fulfill({ status: 200, contentType: ext === '.js' ? 'application/javascript' : 'text/css', body: fs.readFileSync(path.join(REPO, base)) });
    if (ext === '.js') return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    if (/\.(png|jpg|jpeg|webp)$/.test(ext)) return route.fulfill({ status: 200, contentType: 'image/png', body: standIn(u.pathname) });
    if (E2 && ext === '.glb' && !/Races|Models\//.test(u.pathname)) return route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: GLB_STANDIN });
    if (E2 && ext === '.obj' && !process.env.NOOBJ) return route.fulfill({ status: 200, contentType: 'text/plain', body: OBJ_STANDIN });
    return route.fulfill({ status: 404, body: '' });
  });
  const page = await context.newPage(); const errs = [], warns = [];
  page.on('pageerror', e => errs.push(String(e && e.stack || e).slice(0, 400)));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' || /\[editor\]|\[world doc\]|thumb/i.test(t)) warns.push(m.type() + ': ' + t.slice(0, 300)); });
  page.on('dialog', d => d.accept()); page.on('crash', () => console.log('PAGE CRASHED', JSON.stringify(errs.slice(-5)), JSON.stringify(warns.slice(-8))));
  await page.goto('http://localhost:3000/?nomenu3d', { waitUntil: 'commit', timeout: 60000 });
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 90000) { try { if (await page.evaluate(() => typeof window._goToEditor === 'function' && typeof ThreeRenderer !== 'undefined' && !!ThreeRenderer.hq)) { ok = true; break; } } catch (e) {} await sleep(800); }
  if (!ok) { console.log('page never ready', errs.slice(0, 5)); await browser.close(); process.exit(1); }
  await page.evaluate(() => { window.EW_HQ_NO_POST = true; window.EW_DISABLE_CAST = true; });
  if (process.env.NOTHUMB) await page.evaluate(() => { window.EW_ED_NO_THUMBS = true; });
  const step = async (name, fn, wait) => { let r; try { r = await page.evaluate(fn); } catch (e) { r = 'THREW ' + e.message; } await sleep(wait || 600); console.log('·', name, JSON.stringify(r)); return r; };
  const shot = async (n) => { const f = path.join(OUT, n + '.png'); await page.screenshot({ path: f, timeout: 120000 }); console.log('SHOT', f); };
  await step('open', () => { window._goToEditor(); return true; }, 6000);
  await step('state', () => EWEditor.state());
  await shot('01_empty_world');
  if (E2) { await e2Sweep(page, step, shot, errs, warns); await browser.close(); return; }
  const S = await step('add every kind', () => { const K = EWEditorCore.KINDS; const n0 = EWEditor.doc().rooms.w_room1.terrain.features.length; K.forEach((k, i) => { const r = EWEditorCore.kindRow(k.id, (i % 5) * 12 - 24, Math.floor(i / 5) * 12 - 18); EWEditor.act.addRow('terrain.features', r); }); return { added: EWEditor.doc().rooms.w_room1.terrain.features.length - n0, undo: EWEditor.state().undo }; }, 5000);
  await step('add props + door', () => { EWEditor.act.addRow('props', { key: Object.keys(DOOR_HQ.catalogue).filter(k => !DOOR_HQ.catalogue[k].leaf && DOOR_HQ.catalogue[k].proc)[0], x: 4, z: 6, face: 0 }); EWEditor.act.addRow('doors', { wall: 'free', x: -6, z: 6, face: 0, leaf: 'leaf_office', action: { room: 'w_room1' } }); return EWEditor.state(); }, 5000);
  await step('state after build', () => ({ s: EWEditor.state(), compiled: !!(DOOR_HQ.rooms.w_room1._terrainInfo), feats: DOOR_HQ.rooms.w_room1.terrain.features.length, same: DOOR_HQ.rooms.w_room1 === EWEditor.doc().rooms.w_room1 }));
  await step('camera up', () => { const c = EWEditor.state().cam; Object.assign(EWEditor.state, {}); return c; });
  await page.evaluate(() => { const ED = EWEditor.state(); });
  await page.mouse.move(700, 430);
  await page.keyboard.down('ArrowDown'); await sleep(1200); await page.keyboard.up('ArrowDown');
  await shot('02_every_kind');
  const pick = await step('pick by click', () => { const v = ThreeRenderer.hq.editView(); return { proxies: EWEditor.state().proxies, props: v.props.length, doors: v.doors.length }; });
  // click the centre of the screen and see what gets picked
  await page.mouse.click(700, 430); await sleep(500);
  await step('picked (open ground)', () => EWEditor.state().sel);
  // click on things by their screen spot: the door, the prop, the plateau
  const spots = await page.evaluate(() => { const v = ThreeRenderer.hq.editView(), u = v.units, r = v.canvas.getBoundingClientRect(), out = {};
    const scr = (x, y, z) => { const p = new THREE.Vector3(x * u, y * u, z * u).project(v.camera); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height, vis: p.z < 1 }; };
    const R = EWEditor.doc().rooms.w_room1; const d = R.doors[0], pr = R.props[0], pl = R.terrain.features.find(f => f.k === 'plateau');
    out.door = scr(d.x, 3.8, d.z); /* it stands on the ridge (2 m up) */ out.prop = scr(pr.x, 0.8, pr.z); out.plateau = scr(pl.x, pl.h - 0.05, pl.z); return out; });
  for (const k of Object.keys(spots)) { const p = spots[k]; if (!p.vis) { console.log('· click', k, 'off screen'); continue; } await page.mouse.click(p.x, p.y); await sleep(400); console.log('· click', k, JSON.stringify(await page.evaluate(() => EWEditor.state().sel))); }
  // drag the gizmo's X arrow (the plateau is picked): the row moves by whole snap steps, one undo step
  const before = await page.evaluate(() => { EWEditor.act.select('props', EWEditor.doc().rooms.w_room1.props[0].id); const pl = EWEditor.doc().rooms.w_room1.props[0]; return { x: pl.x, z: pl.z, undo: EWEditor.state().undo }; });
  const ax = await page.evaluate(() => { const v = ThreeRenderer.hq.editView(), u = v.units, r = v.canvas.getBoundingClientRect(); const P = EWEditor.state().pivot;
    const sc = (x, y, z) => { const p = new THREE.Vector3(x * u, y * u, z * u).project(v.camera); return [r.left + (p.x + 1) / 2 * r.width, r.top + (1 - p.y) / 2 * r.height]; };
    const k = (v.camera.position.distanceTo(new THREE.Vector3(P.x * u, P.y * u, P.z * u)) / u) * 0.9 / 8;   // the gizmo's arrow length scales with the distance
    return { a: sc(P.x + k * 0.7, P.y, P.z), b: sc(P.x + k * 0.7 + 5, P.y, P.z), P }; });
  const P0 = await page.evaluate(() => { const v = ThreeRenderer.hq.editView(), u = v.units, r = v.canvas.getBoundingClientRect(), P = EWEditor.state().pivot; const p = new THREE.Vector3(P.x * u, P.y * u, P.z * u).project(v.camera); return [r.left + (p.x + 1) / 2 * r.width, r.top + (1 - p.y) / 2 * r.height]; });
  let grab = null; const seen = [];
  for (let dx = -240; dx <= 240; dx += 8) { await page.mouse.move(P0[0] + dx, P0[1]); await sleep(60); const a = await page.evaluate(() => EWEditor.state().tcAxis); seen.push(dx + ':' + a); if (a === 'X' && !grab) grab = [P0[0] + dx, P0[1]]; }
  console.log('· hover scan', seen.join(' '));
  if (grab) { ax.a = grab; ax.b = [grab[0] + 150, grab[1]]; }   // the arrow may point either way (three flips an axis that points away from the eye); dragging right = +x either way
  console.log('· axis spots', JSON.stringify(ax));
  await page.mouse.move(ax.a[0], ax.a[1]); await sleep(300); await page.mouse.down(); for (let i = 1; i <= 8; i++) { await page.mouse.move(ax.a[0] + (ax.b[0] - ax.a[0]) * i / 8, ax.a[1] + (ax.b[1] - ax.a[1]) * i / 8); await sleep(80); } await page.mouse.up(); await sleep(800);
  await step('gizmo drag', () => { const pl = EWEditor.doc().rooms.w_room1.props[0]; return { x: pl.x, z: pl.z, undo: EWEditor.state().undo, sel: EWEditor.state().sel }; });
  console.log('· before drag', JSON.stringify(before));
  await step('select wall + move', () => { const w = EWEditor.doc().rooms.w_room1.terrain.features.find(r => r.k === 'wall'); EWEditor.act.select('terrain.features', w.id); const before = [w.x0, w.z0]; EWEditor.act.moveSel(3, 2); const w2 = EWEditor.doc().rooms.w_room1.terrain.features.find(r => r.id === w.id); return { before, after: [w2.x0, w2.z0], gizmo: EWEditor.state().gizmo }; }, 1500);
  await shot('03_wall_selected');
  await step('undo move', () => { EWEditor.act.undo(); const w = EWEditor.doc().rooms.w_room1.terrain.features.find(r => r.k === 'wall'); return [w.x0, w.z0, EWEditor.state().redo]; }, 1500);
  await step('turn + duplicate + delete', () => { EWEditor.act.turnSel(90); const w = EWEditor.doc().rooms.w_room1.terrain.features.find(r => r.k === 'wall'); const a = [w.x0, w.z0, w.x1, w.z1]; EWEditor.act.duplicateSel(); const n1 = EWEditor.doc().rooms.w_room1.terrain.features.length; EWEditor.act.deleteSel(); const n2 = EWEditor.doc().rooms.w_room1.terrain.features.length; return { turned: a, n1, n2 }; }, 1500);
  await step('new room + door both ways', () => { const id = EWEditor.act.newRoom(64, 48); return { id, rooms: EWEditor.state().rooms, label: DOOR_HQ.rooms[id].label }; }, 4000);
  await step('back to room 1', () => { EWEditor.act.enter('w_room1', 'world'); return EWEditor.state().room; }, 5000);
  await step('play here', () => { EWEditor.act.playHere(); return EWEditor.state(); }, 8000);
  await step('playing?', () => ({ playing: EWEditor.playing(), room: ThreeRenderer.hq.room(), pos: ThreeRenderer.hq.pos(), editing: document.body.className }));
  await page.evaluate(() => { const h = document.getElementById('hqLoad'); if (h) h.style.display = 'none'; });
  await shot('04_play_here');
  await page.keyboard.press('Escape'); await sleep(6000);
  await step('back from play (ESC)', () => ({ playing: EWEditor.playing(), pauseShown: (document.getElementById('hqPause') || {}).style && document.getElementById('hqPause').style.display }));
  await step('state after play', () => EWEditor.state());
  await step('library room', () => { EWEditor.act.library('central_egress'); return EWEditor.state().mode; }, 9000);
  await shot('05_library');
  await step('copy into world', () => { EWEditor.act.copyIntoWorld(); const s = EWEditor.state(); return { mode: s.mode, room: s.room, rooms: s.rooms }; }, 9000);
  await shot('06_copied');
  const dl = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
  await step('export', () => EWEditor.act.exportZip(false).then(r => r));
  const d = await dl; if (d) { const f = path.join(OUT, 'export.zip'); await d.saveAs(f); console.log('EXPORT', f, fs.statSync(f).size); }
  await step('reload persists (IndexedDB)', () => new Promise(res => { const r = indexedDB.open('ew_editor'); r.onsuccess = () => { const tx = r.result.transaction('projects'); const q = tx.objectStore('projects').getAll(); q.onsuccess = () => res(q.result.map(p => ({ name: p.name, rooms: Object.keys(p.doc.rooms) }))); }; }));
  await step('close', () => { EWEditor.close(); return document.querySelector('.title-page.active, .title-page[style*="flex"]') ? 'menu' : document.body.className; }, 1500);
  console.log('ERRORS', JSON.stringify(errs, null, 1)); console.log('WARN', JSON.stringify(warns.slice(0, 30), null, 1));
  await browser.close();
})().catch(e => { console.error('PROBE FAIL', e); process.exit(1); });

/* ── THE PALETTE SWEEP (E2): what mondo does — click a tab, click a tile, click the ground; the door tool on a drawn wall and
   on the ground, both answers of its question; paint a wall's two faces and the floor; the thumbnails fill; the pointer is
   never taken ── */
async function e2Sweep(page, step, shot, errs, warns) {
  const stepA = async (n, arg, fn, w) => { let r; try { r = await page.evaluate(fn, arg); } catch (e) { r = 'THREW ' + e.message; } await new Promise(q => setTimeout(q, w || 600)); console.log('·', n, JSON.stringify(r)); return r; };
  page.context().browser().on('disconnected', () => console.log('BROWSER GONE'));
  await page.evaluate(() => { window.__locks = 0; const o = Element.prototype.requestPointerLock; Element.prototype.requestPointerLock = function () { window.__locks++; return o && o.apply(this, arguments); }; });
  await step('cam overhead', () => EWEditor.cam({ x: 0, y: 26, z: 26, yaw: 0, pitch: -0.8 }), 1500);
  if (process.env.ONLY) { for (const r of JSON.parse(process.env.ONLY)) { await stepA('add ' + JSON.stringify(r), r, (r) => { EWEditor.act.addRow(r[0], r[1]); return EWEditor.state().undo; }, 4000); } await step('alive', () => ({ ok: true, errs: 0 }), 500); return; }
  const click = async (sel) => { const b = await page.$(sel); if (!b) return 'NO ' + sel; await b.scrollIntoViewIfNeeded(); await b.click(); await new Promise(r => setTimeout(r, 350)); return 'ok'; };
  const ground = async (x, z, y) => { const p = await page.evaluate(([x, y, z]) => EWEditor.w2s(x, y, z), [x, y || 0, z]); if (!p || !p.vis) return 'off screen'; await page.mouse.move(p.x, p.y); await new Promise(r => setTimeout(r, 120)); await page.mouse.click(p.x, p.y); await new Promise(r => setTimeout(r, 500)); return [Math.round(p.x), Math.round(p.y)]; };
  const count = () => page.evaluate(() => { const r = EWEditor.doc().rooms[EWEditor.state().room]; return { props: r.props.length, doors: (r.doors || []).length, npc: (r.npcSpots || []).length, agents: (r.agents || []).length, signs: (r.counters || []).length, online: (r.onlineSpots || []).length, feats: r.terrain.features.length, spawn: r.spawn, undo: EWEditor.state().undo }; });
  page.setDefaultTimeout(180000);   // swiftshader draws the room at ~2 fps: a click can wait on a frame
  const tabs = ['models', 'people', 'trees', 'doors', 'lights', 'markers', 'textures', 'kits'];
  if (!process.env.FROM) {
  for (const t of tabs) { await click('[data-tab="' + t + '"]'); console.log('· tab', t, JSON.stringify(await page.evaluate(() => ({ groups: document.querySelectorAll('#edPalBody .ed-palg').length, tiles: document.querySelectorAll('#edPalBody .ed-tile').length })))); }
  // MODELS: search, click a tile, click the ground twice (two copies), ESC
  await click('[data-tab="models"]');
  await page.click('#edPalQ'); await page.keyboard.type('moon', { delay: 40 });
  console.log('· search moon', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#edPalBody .ed-tile span')].map(s => s.textContent).slice(0, 6))));
  await click('#edPalBody .ed-tile');
  console.log('· armed', JSON.stringify(await page.evaluate(() => ({ on: document.querySelectorAll('#edPalBody .ed-tile.on').length }))));
  console.log('· place', await ground(-8, -4), await ground(-4, -4), JSON.stringify(await count()));
  await page.keyboard.press('Escape'); await new Promise(r => setTimeout(r, 300));
  await page.fill('#edPalQ', ''); await page.evaluate(() => { const q = document.getElementById('edPalQ'); q.dispatchEvent(new Event('input')); });
  // a proc prop and a light
  await page.fill('#edPalQ', 'desk'); await page.evaluate(() => document.getElementById('edPalQ').dispatchEvent(new Event('input')));
  await click('#edPalBody .ed-tile'); console.log('· desk', await ground(0, -4)); await page.keyboard.press('Escape');
  await click('[data-tab="lights"]'); await page.evaluate(() => { const g = document.querySelector('#edPalBody .ed-palg'); if (g && !g.classList.contains('on')) g.click(); });
  await click('#edPalBody .ed-tile'); console.log('· light', await ground(4, -4)); await page.keyboard.press('Escape');
  // PEOPLE: a race, a cast model, an agent
  await click('[data-tab="people"]');
  for (const g of ['Races', 'The cast', 'Agents']) {
    await page.evaluate((g) => { const b = [...document.querySelectorAll('#edPalBody .ed-palg')].find(x => x.textContent.indexOf(g) >= 0); if (b && !b.classList.contains('on')) b.click(); }, g);
    await new Promise(r => setTimeout(r, 250));
    const ok = await page.evaluate((g) => { const b = [...document.querySelectorAll('#edPalBody .ed-palg')].find(x => x.textContent.indexOf(g) >= 0); const t = b && b.nextElementSibling && b.nextElementSibling.querySelector('.ed-tile'); if (t) { t.scrollIntoView(); t.click(); return t.textContent; } return null; }, g);
    console.log('· person', g, ok, await ground(-8 + tabs.indexOf('people') * 0 + ['Races', 'The cast', 'Agents'].indexOf(g) * 4, 2)); await page.keyboard.press('Escape');
  }
  // TREES: three kinds, one bare
  await click('[data-tab="trees"]');
  for (const [i, k] of [[0, 'tree 7'], [1, 'tree 12'], [2, 'tree 15']].entries()) {
    await page.fill('#edPalQ', k[1]); await page.evaluate(() => document.getElementById('edPalQ').dispatchEvent(new Event('input')));
    await click('#edPalBody .ed-tile'); console.log('· tree', k[1], await ground(4 + i * 3, 2)); await page.keyboard.press('Escape');
  }
  // MARKERS: spawn, sign, roster, online
  await click('[data-tab="markers"]');
  const mk = await page.$$('#edPalBody .ed-tile');
  for (let i = 0; i < mk.length; i++) { const b = (await page.$$('#edPalBody .ed-tile'))[i]; await b.click(); await new Promise(r => setTimeout(r, 300)); console.log('· marker', i, await ground(-8 + i * 4, 8)); await page.keyboard.press('Escape'); await new Promise(r => setTimeout(r, 200)); }
  console.log('· after placing', JSON.stringify(await count()));
  await shot('e2_01_placed');
  }
  // THE DOOR TOOL: draw a wall with the BUILD tab, then a door on it into a NEW room (return door); a door on the ground into Room 2's spawn (one way)
  await page.evaluate(() => EWEditor.act.addRow('terrain.features', { k: 'wall', x0: -10, z0: 14, x1: 10, z1: 14, h: 3, t: 0.3 }));
  await new Promise(r => setTimeout(r, 2500));
  await click('[data-tab="doors"]');
  await page.evaluate(() => { const g = document.querySelector('#edPalBody .ed-palg'); if (g && !g.classList.contains('on')) g.click(); });
  await click('#edPalBody .ed-tile');
  console.log('· door on the wall', await ground(0, 14, 1.2));
  console.log('· modal', JSON.stringify(await page.evaluate(() => ({ to: [...document.querySelectorAll('#edDTo option')].map(o => o.value + '=' + o.textContent), at: [...document.querySelectorAll('#edDAt option')].map(o => o.value) }))));
  await page.selectOption('#edDTo', '__new'); await click('#edOk');
  await new Promise(r => setTimeout(r, 3000));
  console.log('· door 1', JSON.stringify(await page.evaluate(() => { const d = EWEditor.doc(), r = d.rooms.w_room1; return { mine: r.doors[r.doors.length - 1], opening: r.terrain.features.filter(f => f.k === 'opening'), rooms: Object.keys(d.rooms), back: (d.rooms.w_room2 || {}).doors, bad: hqWorldDocDoorCheck(d), sel: EWEditor.state().sel }; })));
  await shot('e2_02_door_on_wall');
  await page.keyboard.press('Escape');
  await click('[data-tab="doors"]'); await page.evaluate(() => { const g = [...document.querySelectorAll('#edPalBody .ed-palg')]; const w = g.find(x => /Ways/.test(x.textContent)); if (w && !w.classList.contains('on')) w.click(); });
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => { const g = [...document.querySelectorAll('#edPalBody .ed-palg')].find(x => /Ways/.test(x.textContent)); const t = g.nextElementSibling.querySelector('.ed-tile'); t.click(); });
  console.log('· way on the ground', await ground(8, 10));
  await page.selectOption('#edDTo', 'w_room2'); await page.selectOption('#edDAt', '__spawn'); await click('#edOk'); await new Promise(r => setTimeout(r, 2500));
  console.log('· door 2', JSON.stringify(await page.evaluate(() => { const r = EWEditor.doc().rooms.w_room1; return { mine: r.doors[r.doors.length - 1], bad: hqWorldDocDoorCheck(EWEditor.doc()) }; })));
  await page.keyboard.press('Escape');
  // the inspector's GO THROUGH on the first door: the editor goes to Room 2, its return door is there
  await page.evaluate(() => { const r = EWEditor.doc().rooms.w_room1; EWEditor.act.select('doors', r.doors[0].id); });
  await new Promise(r => setTimeout(r, 500));
  console.log('· inspector', JSON.stringify(await page.evaluate(() => ({ note: (document.querySelector('#edRight .ed-note') || {}).textContent, btns: [...document.querySelectorAll('#edRight button')].map(b => b.textContent) }))));
  const went = await page.evaluate(() => { const b = [...document.querySelectorAll('#edRight button')].find(b => /GO THROUGH/.test(b.textContent)); if (b) b.click(); return !!b; });
  await new Promise(r => setTimeout(r, 5000));
  console.log('· go through', went, JSON.stringify(await page.evaluate(() => ({ room: EWEditor.state().room, sel: EWEditor.state().sel }))));
  await shot('e2_03_through');
  await page.evaluate(() => EWEditor.act.enter('w_room1', 'world')); await new Promise(r => setTimeout(r, 5000));
  await step('cam overhead', () => EWEditor.cam({ x: 0, y: 26, z: 26, yaw: 0, pitch: -0.8 }), 1200);
  // deleting a door clears its partner's `at`
  console.log('· delete door 1', JSON.stringify(await page.evaluate(() => { const d = EWEditor.doc(); EWEditor.act.select('doors', d.rooms.w_room1.doors[0].id); EWEditor.act.deleteSel(); return { back: d.rooms.w_room2.doors, bad: hqWorldDocDoorCheck(d) }; })));
  await page.evaluate(() => EWEditor.act.undo()); await new Promise(r => setTimeout(r, 2500));
  console.log('· undo', JSON.stringify(await page.evaluate(() => { const d = EWEditor.doc(); return { n: d.rooms.w_room1.doors.length, back: d.rooms.w_room2.doors.map(x => x.action), bad: hqWorldDocDoorCheck(d) }; })));
  // TEXTURES: paint the wall's two faces and the floor
  await click('[data-tab="textures"]');
  await page.evaluate(() => { const g = document.querySelector('#edPalBody .ed-palg'); if (g && !g.classList.contains('on')) g.click(); });
  const tiles = await page.$$('#edPalBody .ed-tile');
  await tiles[0].click(); console.log('· paint outside', await ground(-5, 14.2, 1.5));
  await page.keyboard.press('Escape');
  await (await page.$$('#edPalBody .ed-tile'))[1].click();
  await step('cam inside', () => EWEditor.cam({ x: 0, y: 12, z: 34, yaw: 0, pitch: -0.4 }), 800);
  console.log('· paint outside face 2', await ground(-5, 14.15, 1.5));
  await step('cam other side', () => EWEditor.cam({ x: 0, y: 12, z: -6, yaw: 180, pitch: -0.4 }), 800);
  console.log('· paint inside', await ground(-5, 13.85, 1.5));
  console.log('· paint floor', await ground(0, 0, 0));
  console.log('· painted', JSON.stringify(await page.evaluate(() => { const r = EWEditor.doc().rooms.w_room1; const w = r.terrain.features.find(f => f.k === 'wall'); return { key: w.key, keyIn: w.keyIn, floor: r.terrain.floor }; })));
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await step('cam overhead', () => EWEditor.cam({ x: 0, y: 26, z: 26, yaw: 0, pitch: -0.8 }), 3000);
  // thumbnails
  await click('[data-tab="models"]'); await page.fill('#edPalQ', ''); await page.evaluate(() => document.getElementById('edPalQ').dispatchEvent(new Event('input')));
  await page.evaluate(() => { const g = document.querySelector('#edPalBody .ed-palg'); if (g && !g.classList.contains('on')) g.click(); });
  await new Promise(r => setTimeout(r, 12000));
  console.log('· thumbs', JSON.stringify(await page.evaluate(() => Object.assign(EWEditor.act.thumbs(), { imgs: document.querySelectorAll('#edPalBody .ed-tile img').length }))));
  await shot('e2_04_thumbs');
  await click('[data-tab="trees"]'); await page.fill('#edPalQ', ''); await page.evaluate(() => document.getElementById('edPalQ').dispatchEvent(new Event('input')));
  await new Promise(r => setTimeout(r, 8000));
  console.log('· tree thumbs', JSON.stringify(await page.evaluate(() => Object.assign(EWEditor.act.thumbs(), { imgs: document.querySelectorAll('#edPalBody .ed-tile img').length }))));
  await shot('e2_05_tree_thumbs');
  // pick every marker by clicking its post
  const mks = await page.evaluate(() => { const r = EWEditor.doc().rooms.w_room1; const o = []; ['npcSpots', 'agents', 'counters', 'onlineSpots'].forEach(l => (r[l] || []).forEach(m => o.push([l, m.id, m.x, m.z]))); return o; });
  for (const m of mks) { await ground(m[2], m[3], 1.0); console.log('· pick', m[0], m[1], JSON.stringify(await page.evaluate(() => EWEditor.state().sel))); }
  console.log('· pointer locks taken', await page.evaluate(() => window.__locks));
  await step('play here', () => { EWEditor.act.playHere(); return true; }, 9000);
  await page.evaluate(() => { const h = document.getElementById('hqLoad'); if (h) h.style.display = 'none'; });
  await shot('e2_06_play');
  await page.keyboard.press('Escape'); await new Promise(r => setTimeout(r, 5000));
  console.log('ERRORS', JSON.stringify(errs, null, 1)); console.log('WARN', JSON.stringify(warns.slice(0, 30), null, 1));
}

