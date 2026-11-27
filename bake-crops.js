/* bake-crops.js (2026-11-27) · THE CROP CARDS.
   The Estate's fields are FULL behind the corn line (three-renderer.js THE CROP FIELDS, data.js CROP_FIELDS): thousands of plants a field,
   each a pair of crossed cards wearing a picture of the game's own crop model. This tool takes those pictures: every model in CARDS below is
   drawn from the side, unlit, on a clear ground, into its tile of one sheet (the game lights it).

     node bake-crops.js <out.png> [--tile 256x512]
     node sync-zip.js --put <out.png> Assets/world/nature/flora/ew_crop_cards.png

   A new crop = a row in CARDS here + its tile in data.js CROP_FIELDS.cards (the same order), then rerun and --put. Notes: docs/notes/flora.md G31. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const CDN = 'https://cdn.entropywars.net/';
const CARDS = [   // the order is the sheet's columns (data.js CROP_FIELDS.cards)
    { key: 'corn', file: 'Assets/world/props/meshy/wishlist/corn_stalk.glb' },
    { key: 'sunflower', file: 'Assets/world/props/meshy/wishlist/sunflowers.glb' },
    { key: 'wheat', file: 'Assets/world/nature/flora/meshy/wheat_clump.glb' }
];
const out = process.argv[2]; if (!out) { console.error('node bake-crops.js <out.png> [--tile 256x512]'); process.exit(1); }
const ti = process.argv.indexOf('--tile'), TILE = (ti > 0 ? process.argv[ti + 1] : '256x512').split('x').map(Number);

const PAGE = `<!doctype html><html><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const CARDS = ${JSON.stringify(CARDS)}, TW = ${TILE[0]}, TH = ${TILE[1]}, SS = 2;
const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(TW * SS, TH * SS); r.setClearColor(0x000000, 0); r.outputColorSpace = THREE.SRGBColorSpace;
const sheet = document.createElement('canvas'); sheet.width = TW * CARDS.length; sheet.height = TH; const cx = sheet.getContext('2d'); cx.imageSmoothingQuality = 'high';
const info = [];
for (let i = 0; i < CARDS.length; i++) {
    const g = await new Promise((ok, no) => new GLTFLoader().load('/cdn/' + CARDS[i].file, ok, undefined, no));
    const sc = new THREE.Scene(), m = g.scene; sc.add(m);
    m.traverse(o => { if (o.isMesh) { const s = o.material; o.material = new THREE.MeshBasicMaterial({ map: s.map || null, color: s.map ? 0xffffff : s.color, alphaTest: 0.3, side: THREE.DoubleSide }); } });
    const bb = new THREE.Box3().setFromObject(m), c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
    /* the card is as wide as the plant's wider side: the camera looks along the narrower one */
    const wide = Math.max(sz.x, sz.z), alongX = sz.x < sz.z, pad = 1.03;
    let hw = wide / 2 * pad, hh = sz.y / 2 * pad; if (hw / hh < TW / TH) hw = hh * TW / TH; else hh = hw * TH / TW;   // the tile's own shape, the plant whole inside it
    const cam = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 0.01, 100);
    cam.position.set(c.x + (alongX ? 10 : 0), bb.min.y + hh / pad, c.z + (alongX ? 0 : 10)); cam.lookAt(c.x, bb.min.y + hh / pad, c.z);
    r.render(sc, cam);
    cx.drawImage(r.domElement, 0, 0, TW * SS, TH * SS, i * TW, 0, TW, TH);
    info.push({ key: CARDS[i].key, w: +(2 * hw / sz.y).toFixed(3), fill: +(sz.y / (2 * hh) / pad * pad).toFixed(3) });   // w = the tile's width over the plant's height
}
/* the edge of a cut-out picture: a clear texel keeps its neighbour's colour, so the game's filter draws no dark rim */
const im = cx.getImageData(0, 0, sheet.width, sheet.height), d = im.data, W = sheet.width, H = sheet.height;
for (let pass = 0; pass < 6; pass++) { const src = new Uint8ClampedArray(d);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 4; if (src[o + 3] > 8) continue; let R = 0, G = 0, B = 0, n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x2 = x + dx, y2 = y + dy; if (x2 < 0 || y2 < 0 || x2 >= W || y2 >= H) continue; const o2 = (y2 * W + x2) * 4; if (src[o2 + 3] > 8 || (src[o2] + src[o2 + 1] + src[o2 + 2]) > 0) { R += src[o2]; G += src[o2 + 1]; B += src[o2 + 2]; n++; } }
        if (n) { d[o] = R / n; d[o + 1] = G / n; d[o + 2] = B / n; } } }
cx.putImageData(im, 0, 0);
window.INFO = info; window.PNG = sheet.toDataURL('image/png'); window.DONE = true;
</script></body></html>`;

(async () => {
    const srv = http.createServer((q, s) => {
        if (q.url.startsWith('/cdn/')) {   // the model, fetched here (the page has no cross-origin trouble)
            fetch(CDN + q.url.slice(5)).then(r => r.arrayBuffer()).then(b => { s.writeHead(200, { 'Content-Type': 'model/gltf-binary' }); s.end(Buffer.from(b)); }).catch(e => { s.writeHead(500); s.end(String(e)); });
        } else { s.writeHead(200, { 'Content-Type': 'text/html' }); s.end(PAGE); }
    }).listen(8766);
    const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-certificate-errors'] });
    const pg = await b.newPage({ viewport: { width: 1200, height: 1100 }, ignoreHTTPSErrors: true });
    pg.on('pageerror', e => console.log('page error:', e.message));
    await pg.goto('http://localhost:8766/'); await pg.waitForFunction('window.DONE', null, { timeout: 180000 });
    const png = await pg.evaluate('window.PNG'), info = await pg.evaluate('window.INFO');
    fs.writeFileSync(out, Buffer.from(png.split(',')[1], 'base64'));
    console.log('wrote', out, fs.statSync(out).size, 'bytes ·', TILE[0] * CARDS.length + ' x ' + TILE[1]);
    console.log('data.js CROP_FIELDS.cards (w = the card\'s width over its height):', JSON.stringify(info));
    await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
