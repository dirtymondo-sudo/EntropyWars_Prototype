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
    return route.fulfill({ status: 404, body: '' });
  });
  const page = await context.newPage(); const errs = [], warns = [];
  page.on('pageerror', e => errs.push(String(e && e.stack || e).slice(0, 400)));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' || /\[editor\]|\[world doc\]/.test(t)) warns.push(m.type() + ': ' + t.slice(0, 300)); });
  page.on('dialog', d => d.accept());
  await page.goto('http://localhost:3000/?nomenu3d', { waitUntil: 'commit', timeout: 60000 });
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < 90000) { try { if (await page.evaluate(() => typeof window._goToEditor === 'function' && typeof ThreeRenderer !== 'undefined' && !!ThreeRenderer.hq)) { ok = true; break; } } catch (e) {} await sleep(800); }
  if (!ok) { console.log('page never ready', errs.slice(0, 5)); await browser.close(); process.exit(1); }
  await page.evaluate(() => { window.EW_HQ_NO_POST = true; window.EW_DISABLE_CAST = true; });
  const step = async (name, fn, wait) => { let r; try { r = await page.evaluate(fn); } catch (e) { r = 'THREW ' + e.message; } await sleep(wait || 600); console.log('·', name, JSON.stringify(r)); return r; };
  const shot = async (n) => { const f = path.join(OUT, n + '.png'); await page.screenshot({ path: f, timeout: 120000 }); console.log('SHOT', f); };
  await step('open', () => { window._goToEditor(); return true; }, 6000);
  await step('state', () => EWEditor.state());
  await shot('01_empty_world');
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
