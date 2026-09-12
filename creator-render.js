#!/usr/bin/env node
/* creator-render.js — CHARACTER CREATOR headless renders (repo tooling, 2026-09-11 rev 4).
   Builds the creator rig EXACTLY like character-creator.test.js does (three-renderer.js's
   "CHARACTER CREATOR RUNTIME" block in a vm sandbox on the real charactercreation/ GLBs) and
   software-rasterises the result to PNG — body, top, bottom and the FACE shell with its baked
   skin texture (a stub 2D canvas feeds _ccBakeSkin) — so a face / garment change can be LOOKED
   AT without a browser (no Playwright, no swiftshader, no server; RULE #1c stays intact).
   Lambert + a key light and a fill; the textures the browser would load (hair, fabrics) are
   not — geometry, paint and normals are what this shows.

   rev 5 (2026-09-11): the fabric tiles (charactercreation/clothingtextures/*.png, decoded here — a
   tiny PNG reader, no deps) map onto the top / bottom through their UVs exactly as the runtime does
   (luminance-normalised, tint × 1.18), and a hair style ('{"hair":"hair000"}') loads from
   charactercreation/hair/ with its embedded alpha texture so bald spots / skull pokes show; new views
   back, side, top, hair34, hairside, hairback (`pitch` looks down).

   Needs: npm i --no-save three@0.128.0
   Usage: node creator-render.js [male|female] [tee|tank|…any CC_TOPS id] [tag] ['{"bottoms":"skirt","outer":"blazer","feet":"boots","gloves":"gloves","belt":"belt","hair":"hair000","topFabric":"denim",…}']
          (rev 7: every layer renders with its own fabric + tint — outer / feet / gloves / belt / the skirt lathe / the buckle)
          VIEWS=torso,torso34,side,back,head,head34,eyes,full,top,hair34,hairside,hairback  OUT=shots/creator-render
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
/* A minimal PNG reader (8 / 16-bit, colour types 0 2 3 4 6, non-interlaced) → { w, h, d: RGBA }. */
function decodePNG(buf) {
  let p = 8, w = 0, h = 0, depth = 8, ctype = 2, plte = null, trns = null; const idat = [];
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), data = buf.slice(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; if (data[12]) throw new Error('interlaced PNG'); }
    else if (type === 'PLTE') plte = data; else if (type === 'tRNS') trns = data; else if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype], bps = depth === 16 ? 2 : 1, bpp = ch * bps, stride = w * bpp;
  const d = new Uint8ClampedArray(w * h * 4); let prev = Buffer.alloc(stride), q = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[q++], cur = Buffer.from(raw.slice(q, q + stride)); q += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      if (f === 1) cur[i] += a; else if (f === 2) cur[i] += b; else if (f === 3) cur[i] += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); cur[i] += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4, s = x * bpp, v = k => cur[s + k * bps];
      if (ctype === 0) { d[o] = d[o + 1] = d[o + 2] = v(0); d[o + 3] = 255; }
      else if (ctype === 2) { d[o] = v(0); d[o + 1] = v(1); d[o + 2] = v(2); d[o + 3] = 255; }
      else if (ctype === 3) { const i3 = cur[s] * 3; d[o] = plte[i3]; d[o + 1] = plte[i3 + 1]; d[o + 2] = plte[i3 + 2]; d[o + 3] = trns && cur[s] < trns.length ? trns[cur[s]] : 255; }
      else if (ctype === 4) { d[o] = d[o + 1] = d[o + 2] = v(0); d[o + 3] = v(1); }
      else { d[o] = v(0); d[o + 1] = v(1); d[o + 2] = v(2); d[o + 3] = v(3); }
    }
    prev = cur;
  }
  return { w, h, d };
}
/* The baseColor image of every mesh in a GLB, by mesh name (GLB header → JSON chunk → bufferView → PNG). */
function glbBaseColorImages(buf) {
  const jl = buf.readUInt32LE(12), j = JSON.parse(buf.toString('utf8', 20, 20 + jl)), bl = buf.readUInt32LE(20 + jl), bin = buf.slice(28 + jl, 28 + jl + bl), out = {};
  for (const m of j.meshes || []) {
    const mat = (j.materials || [])[m.primitives[0].material]; const bc = mat && mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorTexture;
    if (!bc) continue;
    const img = j.images[j.textures[bc.index].source]; if (img.bufferView == null || !/png/.test(img.mimeType || '')) continue;
    const bv = j.bufferViews[img.bufferView];
    try { out[m.name] = decodePNG(bin.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength)); } catch (e) { console.warn('hair texture', m.name, e.message); }
  }
  return out;
}
/* The runtime's normalisations: a fabric tile to a 0.8 mean luminance, a hair diffuse to a 0.72-mean grey mask (alpha kept). */
function normaliseTile(T, target, grey) {
  let sum = 0, wsum = 0; const d = T.d;
  for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255, l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; sum += l * a; wsum += a; }
  const mean = (wsum ? sum / wsum : 128) / 255 || 0.5, k = Math.max(0.5, Math.min(2.6, target / mean)), o = new Uint8ClampedArray(d.length);
  for (let i = 0; i < d.length; i += 4) { if (grey) { const l = Math.min(255, (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) * k); o[i] = o[i + 1] = o[i + 2] = l; } else { o[i] = Math.min(255, d[i] * k); o[i + 1] = Math.min(255, d[i + 1] * k); o[i + 2] = Math.min(255, d[i + 2] * k); } o[i + 3] = d[i + 3]; }
  return { w: T.w, h: T.h, d: o };
}
function render(meshes, view) {
  const W = view.w, Hh = view.h, rgb = Buffer.alloc(W * Hh * 3, 24), depth = new Float32Array(W * Hh).fill(-Infinity);
  const yaw = (view.yaw || 0) * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw), pitch = (view.pitch || 0) * Math.PI / 180, cp = Math.cos(pitch), spp = Math.sin(pitch);
  const L = [0.35, 0.6, 0.72]; const ll = Math.hypot(...L); L[0] /= ll; L[1] /= ll; L[2] /= ll;
  const L2 = [-0.7, 0.2, 0.4]; const l2 = Math.hypot(...L2); L2[0] /= l2; L2[1] /= l2; L2[2] /= l2;
  const rot = (x, y, z) => { const rx = x * cy + z * sy, rz = -x * sy + z * cy; return [rx, y * cp - rz * spp, y * spp + rz * cp]; };   // yaw about y, then pitch (positive = looking down from above)
  const xf = p => rot(p[0] - view.cx, p[1] - view.cy, p[2] - view.cz);
  const xn = n => rot(n[0], n[1], n[2]);
  for (const m of meshes) {
    const P = m.pos, N = m.nrm, I = m.idx, UV = m.uv, T = m.tex, rep = m.repeat || 1, tint = m.tint, VC = m.vcol;
    const sample = (u, v) => { if (!T) return m.color; u = u * rep; v = v * rep; u = u - Math.floor(u); v = v - Math.floor(v); const x = Math.max(0, Math.min(T.w - 1, u * T.w - 0.5)), y = Math.max(0, Math.min(T.h - 1, v * T.h - 0.5)); const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(T.w - 1, x0 + 1), y1 = Math.min(T.h - 1, y0 + 1), fx = x - x0, fy = y - y0; const out = [0, 0, 0, 255]; for (let ch = 0; ch < 4; ch++) { const a = T.d[(y0 * T.w + x0) * 4 + ch], b = T.d[(y0 * T.w + x1) * 4 + ch], cc = T.d[(y1 * T.w + x0) * 4 + ch], d = T.d[(y1 * T.w + x1) * 4 + ch]; out[ch] = (a * (1 - fx) + b * fx) * (1 - fy) + (cc * (1 - fx) + d * fx) * fy; } if (tint) { out[0] = out[0] * tint[0] / 255; out[1] = out[1] * tint[1] / 255; out[2] = out[2] * tint[2] / 255; } return out; };
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
        let col = UV ? sample(UV[a * 2] * w0 + UV[b * 2] * w1 + UV[d * 2] * w2, UV[a * 2 + 1] * w0 + UV[b * 2 + 1] * w1 + UV[d * 2 + 1] * w2) : m.color;
        if (m.alphaTest && col[3] != null && col[3] < m.alphaTest * 255) continue;
        depth[o] = z;
        if (VC) { const k = VC[a * 3] * w0 + VC[b * 3] * w1 + VC[d * 3] * w2; col = [col[0] * k, col[1] * k, col[2] * k]; }
        let nx = na[0] * w0 + nb[0] * w1 + nd[0] * w2, ny = na[1] * w0 + nb[1] * w1 + nd[1] * w2, nz = na[2] * w0 + nb[2] * w1 + nd[2] * w2;
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        if (m.twoSided && nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
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
  const look = Object.assign({ hair: 'bald', outfit, bottoms: 'trousers' }, opts), A = normalize(look);
  // the hair style through the unit-GLB cache the runtime reads (the test does the same); its textures decoded here for alpha
  let hairImgs = {};
  if (A.hair !== 'bald') {
    const hf = path.join(CC, 'hair', A.hair + '.glb'), hg = await load(hf);
    hg.scene.traverse(n => { if (n.isMesh) n.geometry._ew_shared = true; });
    c._unitGlbCache[c.getHairStyleUrl(A.hair)] = { root: hg.scene, clips: [], loading: false, failed: false, cbs: [] };
    hairImgs = glbBaseColorImages(fs.readFileSync(hf));
  }
  c._loadUnitGLB = (url, cb) => { const e = c._unitGlbCache[url]; if (e && e.root) cb(e); };
  const fabricTex = key => { const def = c.EW_FABRICS[key]; if (!def || !def.file) return null; try { return { tex: normaliseTile(decodePNG(fs.readFileSync(path.join(CC, 'clothingtextures', def.file))), 0.8, false), repeat: def.repeat || 12 }; } catch (e) { console.warn('fabric', key, e.message); return null; } };
  const gltf = await load(path.join(CC, 'Meshy_AI_human_body_base_mesh_' + gender + '_rigged.glb'));
  const clone = THREE.SkeletonUtils.clone(gltf.scene);
  if (process.env.NO_HEMS) c.EW_CC_NO_HEMS = true;   // the bare cut edges, no inward hem strips
  c._createAppearanceRig(clone, look, true);
  const meshes = []; clone.traverse(n => { if (n.isSkinnedMesh && n.parent && n.visible) meshes.push(n); });
  const skin = hexRGB(A.skin), top = hexRGB(A.topColor), bottom = hexRGB(A.bottomColor), hairCol = hexRGB(A.hairColor);
  const fabrics = { top: fabricTex(A.topFabric), bottom: fabricTex(A.bottomFabric) };
  const LAYER_KEYS = { top: ['topFabric', 'topColor'], bottom: ['bottomFabric', 'bottomColor'], outer: ['outerFabric', 'outerColor'], feet: ['feetFabric', 'feetColor'], gloves: ['glovesFabric', 'glovesColor'], belt: ['beltFabric', 'beltColor'] };
  LAYER_KEYS.skirt = LAYER_KEYS[/dress|gown/.test(A.outfit) ? 'top' : 'bottom'];
  const layerOf = name => { const m = /^EWCreator_(top|bottom|outer|feet|gloves|belt|skirt|buckle)$/.exec(name); return m ? m[1] : null; };
  const list = meshes.map(n => { const g = n.geometry, isFace = /face/.test(n.name), isHair = /EWCreator_hair/.test(n.name), layer = layerOf(n.name), kind = layer ? (layer === 'top' ? 'top' : layer === 'bottom' ? 'bottom' : layer) : 'body';
    const map = n.material.map, faceTex = isFace && map && map.image && map.image._d ? { d: map.image._d, w: map.image.width, h: map.image.height } : null;
    if (isHair) {
      const part = n.name.replace('EWCreator_hair_', ''), img = hairImgs[part], isTie = /tie/.test(part);
      const tex = img ? (isTie ? img : normaliseTile(img, 0.72, true)) : null, tint = isTie ? [255, 255, 255] : hairCol.map(v => Math.min(255, v * 1.22));
      return { pos: g.attributes.position.array, nrm: g.attributes.normal.array, idx: g.index.array, uv: tex ? g.attributes.uv.array : null, tex, tint: tex ? tint : null, color: tint, alphaTest: n.material.alphaTest || 0, twoSided: true, spec: 0.25 };
    }
    if (layer === 'buckle') return { pos: g.attributes.position.array, nrm: g.attributes.normal.array, idx: g.index.array, uv: null, tex: null, color: [240, 207, 126], spec: 0.6 };
    if (layer && LAYER_KEYS[layer]) {
      const keys = LAYER_KEYS[layer], tintC = hexRGB(A[keys[1]]), fab = fabricTex(A[keys[0]]);
      const vc = g.attributes.color ? g.attributes.color.array : null;   // the gain shading (hems, soles, lapels) rides the vertex colour
      const ch = tintC.indexOf(Math.max(...tintC)), gain = vc ? Float32Array.from({ length: vc.length }, (_, i) => vc[(i - i % 3) + ch] / Math.max(1e-3, tintC[ch] / 255 * (fab ? 1.18 : 1))) : null;   // the renderer reads VC[v * 3]
      if (fab) return { pos: g.attributes.position.array, nrm: g.attributes.normal.array, idx: g.index.array, uv: g.attributes.uv.array, tex: fab.tex, repeat: fab.repeat, tint: tintC.map(v => Math.min(255, v * 1.18)), vcol: gain, color: tintC, spec: 0.05 };
      return { pos: g.attributes.position.array, nrm: g.attributes.normal.array, idx: g.index.array, uv: null, tex: null, color: tintC, vcol: gain, spec: layer === 'feet' || layer === 'belt' ? 0.25 : 0.05 };
    }
    return { pos: g.attributes.position.array, nrm: g.attributes.normal.array, idx: g.index.array, uv: isFace ? g.attributes.uv.array : null, tex: faceTex, color: skin, spec: 0.3 }; });
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
    back: { w: 700, h: 700, yaw: 180, cx: 0, cy: minY + 0.66 * H, cz: 0, scale: 900 },
    top: { w: 800, h: 800, yaw: 0, pitch: 90, cx: 0, cy: minY + 0.93 * H, cz: 0, scale: 3000 },
    hair34: { w: 800, h: 800, yaw: 35, pitch: 20, cx: 0, cy: minY + 0.93 * H, cz: 0, scale: 3000 },
    hairside: { w: 800, h: 800, yaw: 90, cx: 0, cy: minY + 0.93 * H, cz: 0, scale: 3000 },
    hairback: { w: 800, h: 800, yaw: 180, pitch: 15, cx: 0, cy: minY + 0.93 * H, cz: 0, scale: 3000 },
  };
  // VIEW='{"name":"strap","yaw":20,"cx":0.13,"ct":0.83,"scale":4000}' — one custom view (cx / ct in q units, cy = ct)
  if (process.env.VIEW) { const cv = JSON.parse(process.env.VIEW); views[cv.name || 'custom'] = Object.assign({ w: 800, h: 800, yaw: 0, cx: 0, cy: minY + 0.8 * H, cz: 0, scale: 3000 }, cv, cv.ct != null ? { cy: minY + cv.ct * H } : {}, cv.cx != null ? { cx: cv.cx * H } : {}); }
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
