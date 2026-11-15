#!/usr/bin/env node
/* DISASTER CITY, THE PROP SIZES (2026-11-15, THE INTERIOR POLISH). `node docs/disaster-city/measure-props.js` measures every model the
   city room's props use and writes docs/disaster-city/prop-sizes.json: { key: [x, y, z] } = the model's box in metres as the game fits it
   at the catalogue's own size (its `span` across or its `h` tall, a laid rug flat, the catalogue's `turn` applied: x = across the piece
   as placed with face 0, z = its depth). interior-polish.js reads the table to keep props out of walls, ceilings and each other; a key
   that is not in it (a procedural prop, a new model) is left alone, so rerun this after adding models to a district's interiors.
   It reads only each GLB's JSON header from the bucket (two range requests a file, cached in the OS temp folder). Repo tooling only. */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process');
const REPO = path.join(__dirname, '..', '..'), OUT = path.join(__dirname, 'prop-sizes.json'), DIR = path.join(os.tmpdir(), 'dc-prop-sizes');
fs.mkdirSync(DIR, { recursive: true });
const sb = require(path.join(REPO, 'load-data.js')).loadGameData({ quiet: true });
const CAT = vm.runInContext('DOOR_HQ.catalogue', sb), room = vm.runInContext('DOOR_HQ.rooms.site_prebuilt_downtown_streets', sb);
const A = 'https://cdn.entropywars.net/Assets/', enc = f => f.split('/').map(encodeURIComponent).join('/');
const urlOf = c => { const b = c.base;   // three-renderer.js _hqModelUrl + sprites.js EW_ASSET_MOVES, for the bases a city prop uses
    if (b === 'misc') return A + (/^ebd_/.test(c.file) ? 'world/packs/elbolilloduro/' : /^Castles_and/.test(c.file) ? 'world/packs/mcsteeg_castles/' : 'world/props/meshy/') + encodeURIComponent(c.file);
    if (b === 'psxmp') return A + 'world/packs/pizzadoggy_psx_mega_pack/' + enc(c.file);
    if (b === 'asset') return A + enc(c.file);
    if (b === 'metro') return A + 'world/packs/elbolilloduro_metro_psx/Models/' + encodeURIComponent(c.file);
    if (b === 'weapons') return A + 'fx/spell_props/' + enc(c.file);
    if (b === 'instruments') return A + 'world/packs/instruments/' + enc(c.file);
    if (!b) return A + 'world/hq/models/' + encodeURIComponent(c.file);
    return null; };
const curl = args => execFileSync('curl', ['-s', '--fail', '--max-time', '60', ...args], { maxBuffer: 1 << 28 });
const header = (key, url) => { const f = path.join(DIR, key + '.json'); if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
    if (!/\.glb$/i.test(url)) return null;
    let head; try { head = curl(['-r', '0-19', url]); } catch (e) { return null; }
    if (head.length < 20 || head.toString('latin1', 0, 4) !== 'glTF') return null;
    let body; try { body = curl(['-r', '20-' + (19 + head.readUInt32LE(12)), url]); } catch (e) { return null; }
    const j = JSON.parse(body.toString('utf8')), slim = { nodes: j.nodes, meshes: (j.meshes || []).map(m => ({ primitives: m.primitives.map(p => ({ POSITION: p.attributes.POSITION })) })), accessors: (j.accessors || []).map(a => a.min ? { min: a.min, max: a.max } : null), scenes: j.scenes, scene: j.scene };
    fs.writeFileSync(f, JSON.stringify(slim)); return slim; };
const mul = (a, b) => { const o = new Array(16); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
const trs = n => { if (n.matrix) return n.matrix; const t = n.translation || [0, 0, 0], q = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1], x = q[0], y = q[1], z = q[2], w = q[3];
    return [(1 - 2 * (y * y + z * z)) * s[0], (2 * (x * y + z * w)) * s[0], (2 * (x * z - y * w)) * s[0], 0, (2 * (x * y - z * w)) * s[1], (1 - 2 * (x * x + z * z)) * s[1], (2 * (y * z + x * w)) * s[1], 0, (2 * (x * z + y * w)) * s[2], (2 * (y * z - x * w)) * s[2], (1 - 2 * (x * x + y * y)) * s[2], 0, t[0], t[1], t[2], 1]; };
const bbox = (j, nodeName) => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; let any = false;
    const walk = (i, M, on) => { const n = j.nodes[i], W = mul(M, trs(n)), here = on || (nodeName && n.name === nodeName);
        if (here && n.mesh != null) j.meshes[n.mesh].primitives.forEach(p => { const a = j.accessors[p.POSITION]; if (!a) return;
            for (let k = 0; k < 8; k++) { const v = [k & 1 ? a.max[0] : a.min[0], k & 2 ? a.max[1] : a.min[1], k & 4 ? a.max[2] : a.min[2]]; for (let r = 0; r < 3; r++) { const w = W[r] * v[0] + W[4 + r] * v[1] + W[8 + r] * v[2] + W[12 + r]; if (w < mn[r]) mn[r] = w; if (w > mx[r]) mx[r] = w; } } any = true; });
        (n.children || []).forEach(c => walk(c, W, here)); };
    (j.scenes[j.scene || 0].nodes).forEach(i => walk(i, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], !nodeName));
    return any ? [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]] : null; };
const out = {}, r3 = v => Math.round(v * 1000) / 1000; let missed = 0;
[...new Set((room.props || []).map(p => p.key))].sort().forEach(key => { const c = CAT[key]; if (!c || c.proc || !c.file) return;
    const url = urlOf(c), j = url && header(key, url), e = j && bbox(j, c.node); if (!e) { missed++; return; }
    const span = c.span != null && c.h == null, s = ((span ? c.span : c.h) || 1) / Math.max(1e-6, span ? Math.max(e[0], e[2]) : e[1]); let x = e[0] * s, y = e[1] * s, z = e[2] * s;
    if (c.lay) { if (z < y && z <= x) { const t = y; y = z; z = t; } else if (x < y && x < z) { const t = y; y = x; x = t; } }
    if (c.turn && Math.abs(Math.round(c.turn / 90)) % 2 === 1) { const t = x; x = z; z = t; }
    out[key] = [r3(x), r3(y), r3(z)]; });
fs.writeFileSync(OUT, '{\n' + Object.keys(out).map(k => JSON.stringify(k) + ': ' + JSON.stringify(out[k])).join(',\n') + '\n}\n');
console.log('prop-sizes.json:', Object.keys(out).length, 'models measured,', missed, 'not read');
