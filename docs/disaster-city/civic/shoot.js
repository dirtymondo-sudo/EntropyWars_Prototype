const { chromium } = require('/opt/node-tools/node_modules/playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const MT = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, s) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { console.log('404', q.url); s.writeHead(404); s.end(); } else { s.writeHead(200, { 'content-type': MT[path.extname(f)] || 'application/octet-stream' }); s.end(b); } }); }).listen(8123);
const SHOTS = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 1600, height: 900 } }); pg.on('console', m => console.log('[c]', m.text().slice(0, 300))); pg.on('pageerror', e => console.log('[err]', String(e).slice(0, 400)));
  let lastQ = null;
  for (const s of SHOTS) { const q = s.q || ''; if (q !== lastQ) { await pg.goto('http://localhost:8123/mock.html?' + q); await pg.waitForFunction('window.READY', null, { timeout: 70000 }); lastQ = q; console.log('tris', await pg.evaluate('window.TRIS')); }
    await pg.evaluate(([c, l, f]) => window.SHOT(c, l, f), [s.cam, s.look, s.fov || 42]); await pg.screenshot({ path: path.join(__dirname, 'out', s.name + '.jpg'), quality: 88, type: 'jpeg' }); console.log('shot', s.name); }
  await b.close(); srv.close(); })().catch(e => { console.log('FAIL', e); process.exit(1); });
