const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, r) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); }).listen(0, async () => {
  const port = srv.address().port; const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const p = await b.newPage();
  p.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text().slice(0, 200)); }); p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('http://localhost:' + port + '/render.html'); await p.waitForFunction('window.ready', null, { timeout: 20000 });
  const jobs = JSON.parse(process.argv[2]);
  for (const [name, opt] of Object.entries(jobs)) { try { const r = await p.evaluate(([u, o]) => window.shoot(u, o), ['/glb/' + name + '.glb', opt]); fs.writeFileSync(__dirname + '/render/' + name + '.png', Buffer.from(r.png.split(',')[1], 'base64')); console.log(name, r.head, r.H.toFixed(2), r.bones); } catch (e) { console.log(name, 'FAIL', String(e).slice(0, 200)); } }
  await b.close(); srv.close();
});
