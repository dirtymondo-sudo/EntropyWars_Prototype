#!/usr/bin/env node
/* creator-render.js — CHARACTER CREATOR headless renders (repo tooling, 2026-09-11 rev 4).
   Builds the creator rig EXACTLY like character-creator.test.js does (three-renderer.js's
   "CHARACTER CREATOR RUNTIME" block in a vm sandbox on the real charactercreation/ GLBs) and
   software-rasterises the result to PNG — body, top, bottom and the FACE shell with its baked
   skin texture (a stub 2D canvas feeds _ccBakeSkin) — so a face / garment change can be LOOKED
   AT without a browser (no Playwright, no swiftshader, no server; RULE #1c stays intact).
   Lambert + a key light and a fill; the textures the browser would load (hair, fabrics) are
   not — geometry, paint and normals are what this shows.

   Needs: npm i --no-save three@0.128.0
   Usage: node creator-render.js [male|female] [tee|tank|suit] [tag] ['{"beard":"goatee",…}'] 
          VIEWS=torso,torso34,side,head,head34,eyes,full  OUT=shots/creator-render
          CROP=1 also dumps a 3× texel crop of the baked texture round each eye.
          RENDERER=/path/to/other/three-renderer.js renders a different copy (before / after).
   Output: <OUT>/<tag>_<gender>_<outfit>_<view>.png (default OUT shots/creator-render, gitignored). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), zlib = require('zlib');
const REPO = __dirname;
let THREE;
try { THREE = require('three'); } catch (e) { console.error('creator-render.js needs three@0.128.0 — npm i --no-save three@0.128.0'); process.exit(1); }
const read = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const sprites = read('sprites.js'), renderer = process.env.RENDERER ? fs.readFileSync(process.env.RENDERER, 'utf8') : read('three-renderer.js');
const CC = path.join(REPO, 'charactercreation');
const context = { window: {}, _mkUAL: (folder, prefix, opts) => opts };
vm.createContext(context);
vm.runInContext(sprites.slice(sprites.indexOf('const EW_CHARACTER_ASSET_BASE'), sprites.indexOf('function getRace3DModel')), context);
const normalize = context.normalizeCharacterAppearance;
const RB = [renderer.indexOf('    /* ══════════════════════════════════════════════════════════════════\n     *  CHARACTER CREATOR RUNTIME'), renderer.indexOf('    function _cvResolveDef(')];
function hexRGB(h) { const c = new THREE.Color(h); return [c.r * 255, c.g * 255, c.b * 255]; }
/* The stub canvas: fillRect / getImageData / putImageData over one RGBA buffer — all _ccBakeSkin uses. */
function fakeCanvas() {
  const cnv = { width: 0, height: 0, _d: null };
  cnv.getContext = () => ({
    _fs: '#000', set fillStyle(v) { this._fs = v; }, get fillStyle() { return this._fs; },
    fillRect(x, y, w, h) { if (!cnv._d) cnv._d = new Uint8ClampedArray(cnv.width * cnv.height * 4); const c = hexRGB(this._fs); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const o = (j * cnv.width + i) * 4; cnv._d[o] = c[0]; cnv._d[o + 1] = c[1]; cnv._d[o + 2] = c[2]; cnv._d[o + 3] = 255; } },
    getImageData(x, y, w, h) { if (!cnv._d) cnv._d = new Uint8ClampedArray(cnv.width * cnv.height * 4); return { data: cnv._d, width: w, height: h }; },
    putImageData(id) { cnv._d = id.data; },
    drawImage() {}, clearRect() {},
  });
  return cnv;
}
const c = { THREE, console, TextDecoder, URL, Blob, setTimeout, clearTimeout, performance, normalizeCharacterAppearance: normalize,
  getHairStyleUrl: context.window.getHairStyleUrl, getFabricTextureUrl: context.window.getFabricTextureUrl, getCharacterAppearanceAssets: context.window.getCharacterAppearanceAssets,
  getCharacterModelFallback: context.getCharacterModelFallback, EW_FABRICS: context.window.EW_FABRICS, _unitGlbCache: {},
  document: { createElement: t => fakeCanvas() }, Image: undefined };
c.self = c; c.window = c;
c._loadUnitGLB = (url, cb) => {};
vm.createContext(c);
vm.runInContext(fs.readFileSync(require.resolve('three/examples/js/loaders/GLTFLoader.js'), 'utf8'), c);
vm.runInContext(fs.readFileSync(require.resolve('three/examples/js/utils/SkeletonUtils.js'), 'utf8'), c);
vm.runInContext(renderer.slice(RB[0], RB[1]), c);
THREE.TextureLoader.prototype.load = function (url, onLoad) { const t = new THREE.Texture(); if (onLoad) setTimeout(() => onLoad(t), 0); return t; };
const load = f => new Promise((ok, fail) => { const b = fs.readFileSync(f); new THREE.GLTFLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '', ok, fail); });
function png(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  const crcT = []; for (let n = 0; n < 256; n++) { let cc = n; for (let k = 0; k < 8; k++) cc = cc & 1 ? 0xedb88320 ^ (cc >>> 1) : cc >>> 1; crcT[n] = cc >>> 0; }
  const crc = b => { let cc = 0xffffffff; for (const x of b) cc = crcT[(cc ^ x) & 255] ^ (cc >>> 8); return (cc ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const cb = Buffer.alloc(4); cb.writeUInt32BE(crc(td)); return Buffer.concat([l, td, cb]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function render(meshes, view) {
  const W = view.w, Hh = view.h, rgb = Buffer.alloc(W * Hh * 3, 24), depth = new Float32Array(W * Hh).fill(-Infinity);
  const yaw = (view.yaw || 0) * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw);
  const L = [0.35, 0.6, 0.72]; const ll = Math.hypot(...L); L[0] /= ll; L[1] /= ll; L[2] /= ll;
  const L2 = [-0.7, 0.2, 0.4]; const l2 = Math.hypot(...L2); L2[0] /= l2; L2[1] /= l2; L2[2] /= l2;
  const xf = p => { const x = p[0] - view.cx, y = p[1] - view.cy, z = p[2] - view.cz; return [x * cy + z * sy, y, -x * sy + z * cy]; };
  const xn = n => [n[0] * cy + n[2] * sy, n[1], -n[0] * sy + n[2] * cy];
  for (const m of meshes) {
    const P = m.pos, N = m.nrm, I = m.idx, UV = m.uv, T = m.tex;
    const sample = (u, v) => { if (!T) return m.color; u = u - Math.floor(u); const x = Math.max(0, Math.min(T.w - 1, u * T.w - 0.5)), y = Math.max(0, Math.min(T.h - 1, v * T.h - 0.5)); const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(T.w - 1, x0 + 1), y1 = Math.min(T.h - 1, y0 + 1), fx = x - x0, fy = y - y0; const out = [0, 0, 0]; for (let ch = 0; ch < 3; ch++) { const a = T.d[(y0 * T.w + x0) * 4 + ch], b = T.d[(y0 * T.w + x1) * 4 + ch], cc = T.d[(y1 * T.w + x0) * 4 + ch], d = T.d[(y1 * T.w + x1) * 4 + ch]; out[ch] = (a * (1 - fx) + b * fx) * (1 - fy) + (cc * (1 - fx) + d * fx) * fy; } return out; };
    for (let k = 0; k < I.length; k += 3) {
      const a = I[k], b = I[k + 1], d = I[k + 2];
      const pa = xf([P[a * 3], P[a * 3 + 1], P[a * 3 + 2]]), pb = xf([P[b * 3], P[b * 3 + 1], P[b * 3 + 2]]), pd = xf([P[d * 3], P[d * 3 + 1], P[d * 3 + 2]]);
      const sa = [W / 2 + pa[0] * view.scale, Hh / 2 - pa[1] * view.scale], sb = [W / 2 + pb[0] * view.scale, Hh / 2 - pb[1] * view.scale], sd = [W / 2 + pd[0] * view.scale, Hh / 2 - pd[1] * view.scale];
      const minx = Math.max(0, Math.floor(Math.min(sa[0], sb[0], sd[0]))), maxx = Math.min(W - 1, Math.ceil(Math.max(sa[0], sb[0], sd[0])));
      const miny = Math.max(0, Math.floor(Math.min(sa[1], sb[1], sd[1]))), maxy = Math.min(Hh - 1, Math.ceil(Math.max(sa[1], sb[1], sd[1])));
      if (minx > maxx || miny > maxy) continue;
      const det = (sb[0] - sa[0]) * (sd[1] - sa[1]) - (sd[0] - sa[0]) * (sb[1] - sa[1]);
      if (Math.abs(det) < 1e-9) continue;
      const na = xn([N[a * 3], N[a * 3 + 1], N[a * 3 + 2]]), nb = xn([N[b * 3], N[b * 3 + 1], N[b * 3 + 2]]), nd = xn([N[d * 3], N[d * 3 + 1], N[d * 3 + 2]]);
      for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
        const px = x + 0.5, py = y + 0.5;
        const w0 = ((sb[0] - px) * (sd[1] - py) - (sd[0] - px) * (sb[1] - py)) / det, w1 = ((sd[0] - px) * (sa[1] - py) - (sa[0] - px) * (sd[1] - py)) / det, w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = pa[2] * w0 + pb[2] * w1 + pd[2] * w2, o = y * W + x;
        if (z <= depth[o]) continue;
        depth[o] = z;
        let nx = na[0] * w0 + nb[0] * w1 + nd[0] * w2, ny = na[1] * w0 + nb[1] * w1 + nd[1] * w2, nz = na[2] * w0 + nb[2] * w1 + nd[2] * w2;
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        const col = UV ? sample(UV[a * 2] * w0 + UV[b * 2] * w1 + UV[d * 2] * w2, UV[a * 2 + 1] * w0 + UV[b * 2 + 1] * w1 + UV[d * 2 + 1] * w2) : m.color;
        const diff = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), fill = Math.max(0, nx * L2[0] + ny * L2[1] + nz * L2[2]);
        const hv = [L[0], L[1], L[2] + 1]; const hl = Math.hypot(...hv); const spec = Math.pow(Math.max(0, (nx * hv[0] + ny * hv[1] + nz * hv[2]) / hl), 24) * (m.spec || 0.2);
        const sh = 0.3 + 0.62 * diff + 0.18 * fill;
        rgb[o * 3] = Math.min(255, col[0] * sh + 255 * spec); rgb[o * 3 + 1] = Math.min(255, col[1] * sh + 255 * spec); rgb[o * 3 + 2] = Math.min(255, col[2] * sh + 255 * spec);
      }
    }
  }
  return png(W, Hh, rgb);
}
(async () => {
  const gender = process.argv[2] || 'male', outfit = process.argv[3] || 'tee', tag = process.argv[4] || 'look';
  const opts = JSON.parse(process.argv[5] || '{}');
  const look = Object.assign({ hair: 'bald', outfit, bottoms: 'trousers' }, opts);
  const gltf = await load(path.join(CC, 'Meshy_AI_human_body_base_mesh_' + gender + '_rigged.glb'));
  const clone = THREE.SkeletonUtils.clone(gltf.scene);
  c._createAppearanceRig(clone, look, true);
  const meshes = []; clone.traverse(n => { if (n.isSkinnedMesh && n.parent && n.visible) meshes.push(n); });
  const skin = hexRGB(normalize(look).skin), top = hexRGB(normalize(look).topColor), bottom = hexRGB(normalize(look).bottomColor);
  const list = meshes.map(n => { const g = n.geometry, isFace = /face/.test(n.name), kind = /top/.test(n.name) ? 'top' : /bottom/.test(n.name) ? 'bottom' : 'body';
    const map = n.material.map, tex = isFace && map && map.image && map.image._d ? { d: map.image._d, w: map.image.width, h: map.image.height } : null;
    return { pos: g.attributes.position.array, nrm: g.attributes.normal.array, idx: g.index.array, uv: isFace ? g.attributes.uv.array : null, tex, color: kind === 'top' ? top : kind === 'bottom' ? bottom : skin, spec: isFace || kind === 'body' ? 0.3 : 0.05 }; });
  const body = meshes.find(n => !/EWCreator/.test(n.name)); body.geometry.computeBoundingBox();
  const bb = body.geometry.boundingBox, H = bb.max.y - bb.min.y, minY = bb.min.y;
  const out = process.env.OUT || path.join(REPO, 'shots', 'creator-render'); fs.mkdirSync(out, { recursive: true });
  const views = {
    torso: { w: 700, h: 700, yaw: 0, cx: 0, cy: minY + 0.66 * H, cz: 0, scale: 900 },
    torso34: { w: 700, h: 700, yaw: 40, cx: 0, cy: minY + 0.66 * H, cz: 0, scale: 900 },
    side: { w: 500, h: 700, yaw: 90, cx: 0, cy: minY + 0.66 * H, cz: 0, scale: 900 },
    head: { w: 800, h: 800, yaw: 0, cx: 0, cy: minY + 0.925 * H, cz: 0, scale: 3000 },
    head34: { w: 800, h: 800, yaw: 35, cx: 0, cy: minY + 0.925 * H, cz: 0, scale: 3000 },
    eyes: { w: 900, h: 480, yaw: 0, cx: 0, cy: minY + 0.928 * H, cz: 0, scale: 5200 },
    full: { w: 500, h: 900, yaw: 20, cx: 0, cy: minY + 0.5 * H, cz: 0, scale: 480 },
  };
  for (const v of (process.env.VIEWS || 'torso,torso34,head,eyes,full').split(',')) {
    if (!views[v]) { console.warn('unknown view', v); continue; }
    const f = path.join(out, `${tag}_${gender}_${outfit}_${v}.png`);
    fs.writeFileSync(f, render(list, views[v])); console.log('wrote', path.relative(REPO, f));
  }
  if (process.env.CROP) {
    const face = meshes.find(n => /face/.test(n.name)), g = face.geometry, P = g.attributes.position.array, UV = g.attributes.uv.array, T = face.material.map.image;
    const lm = Object.values(c._ccFaceCache)[0];
    for (const [ei, E] of lm.eyes.entries()) {
      let best = -1, bd = 1e9;
      for (let i = 0; i < P.length / 3; i++) { const d = Math.hypot(P[i*3]/H - E.x, (P[i*3+1]-minY)/H - E.t, P[i*3+2]/H - 0.055); if (d < bd) { bd = d; best = i; } }
      const u = UV[best*2] - Math.floor(UV[best*2]), v = UV[best*2+1], cx = Math.round(u * T.width), cy = Math.round(v * T.height), R = 110;
      const w = 2*R, rgb = Buffer.alloc(w*w*3);
      for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const tx = ((cx - R + x) % T.width + T.width) % T.width, ty = cy - R + y; if (ty < 0 || ty >= T.height) continue; const o = (ty*T.width+tx)*4; rgb[(y*w+x)*3] = T._d[o]; rgb[(y*w+x)*3+1] = T._d[o+1]; rgb[(y*w+x)*3+2] = T._d[o+2]; }
      const up = Buffer.alloc(w*3*w*3*3); for (let y = 0; y < w*3; y++) for (let x = 0; x < w*3; x++) for (let ch = 0; ch < 3; ch++) up[(y*w*3+x)*3+ch] = rgb[((y/3|0)*w+(x/3|0))*3+ch];
      const f = path.join(out, `${tag}_${gender}_texeye${ei}.png`); fs.writeFileSync(f, png(w*3, w*3, up)); console.log('wrote', path.relative(REPO, f));
    }
  }
  console.log('eyes', JSON.stringify(Object.values(c._ccFaceCache)[0].eyes.map(e => ({ x: +e.x.toFixed(4), t: +e.t.toFixed(4) }))));
})().catch(e => { console.error(e); process.exit(1); });
