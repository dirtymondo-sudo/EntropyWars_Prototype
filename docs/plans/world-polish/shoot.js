#!/usr/bin/env node
/* THE SCREENSHOT AUDIT (2026-11-20, docs/plans/world-polish/WORLD_POLISH_PLAN.md; repo-only tooling). mondo: "do a second audit of everything
   with screenshots first so we have a better starting reference point."
   For every plot-built room that is not retired, and every district in it: ONE picture from the air (the walker stands near the district's
   middle, the camera 45 to 90 m back and high) and TWO from the ground (on the district's worst-scoring plot and on its most dressed plot,
   plots.csv's NEED and pieces), looking toward the district's middle. Views are made from the data (a walkable square near each spot,
   its own height), so nothing is aimed by hand and a rerun after a zone's pass stands in the same places: before / after pictures.

   node docs/plans/world-polish/shoot.js                 every room (about 2 hours; needs `npm start` running, see PLAYTEST_NOTES "THE FAST PROBE")
   node docs/plans/world-polish/shoot.js <room> …        only those rooms
   node docs/plans/world-polish/shoot.js --views-only    print the views, shoot nothing
   node docs/plans/world-polish/shoot.js <room> --flags=EW_HQ_NO_ENCOUNTER   the window flags of the probe (this one is the default; `--flags=` = none)
   WRITES docs/plans/world-polish/pictures/<room>/<district>_<air|worst|best>.jpg (800 x 500) + pictures/index.json (every picture: room, district,
   plot, where the walker stood). Runs playtest_city.js one room at a time (never two probes at once). */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const REPO = path.join(__dirname, '..', '..', '..'), OUT = path.join(__dirname, 'pictures'), SQ = 3.5, PL = 42;
const S = require(path.join(REPO, 'load-data.js')).loadGameData(), H = S.DOOR_HQ, ROOMS = H.rooms, retired = H.retired || {};
const args = process.argv.slice(2), only = args.filter(a => !a.startsWith('--')), VIEWS_ONLY = args.includes('--views-only');
/* the window flags every probe runs with: no encounters by default (an enemy near the spawn starts a fight and ruins every picture;
   PLAYTEST_NOTES "A PROBE THAT NEVER GETS READY"). `--flags=A,B` sets others, `--flags=` passes none. */
const FLAGS = (() => { const f = args.find(a => a.startsWith('--flags=')); return f == null ? 'EW_HQ_NO_ENCOUNTER' : f.slice(8); })();
/* plots.csv: the audit's row a plot (need, pieces), by room + plot id */
const csvRow = l => { const o = []; let c = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
const CSV = fs.readFileSync(path.join(__dirname, 'plots.csv'), 'utf8').trim().split('\n').map(csvRow), HD = CSV[0], col = n => HD.indexOf(n);
const AUD = {}; CSV.slice(1).forEach(r => { AUD[r[col('room')] + '|' + r[col('id')]] = { name: r[col('name')], d: r[col('district')], need: +r[col('need')], pieces: +r[col('pieces')], walk: +r[col('walk')] }; });
function plotsOf(id, room) {   // the same reading as audit.js: every plot's column and row in its room
    if (id === 'site_prebuilt_downtown_streets') { const CL = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/disaster-city/city-layout.json'), 'utf8')), MV = require(path.join(REPO, 'docs/disaster-city/move.js')), HL = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/disaster-city/hills-layout.json'), 'utf8'));
        const home = {}; CL.districts.forEach(d => { home[d.id] = [d.gx, d.gy]; }); const out = [];
        CL.plots.forEach(p => { const hm = home[p.d], to = MV.to[p.d]; out.push({ id: p.id, c: p.x - hm[0] * 4 + to[0] * 4, r: p.y - hm[1] * 4 + to[1] * 4 + 3 }); });
        HL.plots.forEach(p => { const m = /^H(\d+)-(\d+)$/.exec(p.id); if (m) out.push({ id: p.id, c: +m[1], r: +m[2] }); });
        return { ox: -252, oz: -378, plots: out }; }
    const P = room.plots || {}; const names = (P.names || []).map(n => { const m = /^P(\d+)-(\d+)$/.exec(n[0]); return m ? { id: n[0], c: +m[1], r: +m[2] } : null; }).filter(Boolean);
    const cols = P.nx || P.n || Math.round(room.shell.w / PL), x0 = Math.min(...names.map(n => n.c)), xm = Math.max(...names.map(n => n.c));
    const sh = (P.x0 != null) ? P.x0 : ((x0 > 0 && xm - x0 < cols && xm >= cols) ? x0 : 0), shy = P.y0 || 0; names.forEach(n => { n.c -= sh; n.r -= shy; });
    return { ox: -room.shell.w / 2, oz: -room.shell.d / 2, plots: names }; }
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x';
function viewsOf(id) { const room = ROOMS[id], info = S.hqTerrainInfo(id), P = plotsOf(id, room), short = id.replace('site_prebuilt_', '').replace('site_', '');
    /* the drawn masses (an `arch` row's tall parts, a `texbuilding`): the ground reads as walkable under them, so a spot is also checked
       against their boxes: never stand, or put the camera, inside a pyramid or a house */
    const MASS = []; ((room.terrain && room.terrain.features) || []).forEach(f => {
        if (f.k === 'texbuilding' && f.w && f.d) { const r = Math.max(f.w, f.d) / 2 + 1; MASS.push([f.x - r, f.z - r, f.x + r, f.z + r]); }
        if (f.k === 'arch' && Array.isArray(f.parts)) f.parts.forEach(q => { const s = q.size, pp = q.p; if (!Array.isArray(s) || !Array.isArray(pp) || s.length < 3 || !(s[1] > 2.2) || s[0] * s[2] < 6) return; const r = Math.max(s[0], s[2]) / 2 + 0.8, cx0 = (f.x || 0) + pp[0], cz0 = (f.z || 0) + pp[2]; MASS.push([cx0 - r, cz0 - r, cx0 + r, cz0 + r]); }); });
    const inMass = (x, z) => MASS.some(b => x > b[0] && x < b[2] && z > b[1] && z < b[3]);
    /* a square you can stand on, the nearest to (x, z): its middle and its height */
    const stand = (x, z, reach) => stand0(x, z, reach, true) || stand0(x, z, reach, false);   // a tunnel is all arch: no free spot = drop the mass check
    const stand0 = (x, z, reach, useMass) => { let best = null; const n = Math.ceil((reach || 30) / SQ);
        for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) { const px = Math.round((x + i * SQ) / SQ) * SQ + SQ / 2 * 0, pz = Math.round((z + j * SQ) / SQ) * SQ, d = Math.hypot(px - x, pz - z); if (best && d >= best.d) continue;
            if (Math.abs(px) > room.shell.w / 2 - 4 || Math.abs(pz) > room.shell.d / 2 - 4) continue;
            let y = null; try { y = S.hqTerrainFeet(info, px, pz, null); } catch (e) {} if (y == null || !isFinite(y)) continue;
            if (useMass && (inMass(px, pz) || inMass(px, pz + 7) || inMass(px, pz + 3.5))) continue;
            let bad = false; try { bad = !!(S.hqTerrainSolidAt(info, px, pz, 0.6) || S.hqTerrainWallAt(info, px, pz, 0.6)); const f = S.hqTerrainFluidAt(info, px, pz); if (f && f.y != null && f.y > y + 0.6 && !f.sea) bad = true; } catch (e) {}
            if (!bad) best = { x: +px.toFixed(2), z: +pz.toFixed(2), y: +y.toFixed(2), d }; }
        return best; };
    const face = (fx, fz, tx, tz) => { const a = Math.atan2(tx - fx, -(tz - fz)) * 180 / Math.PI; return Math.round((a + 360) % 360); };   // 0 = north (-z), 90 = east
    const by = {}; P.plots.forEach(p => { const a = AUD[short + '|' + p.id]; if (!a) return; p.a = a; p.x = P.ox + (p.c + 0.5) * PL; p.z = P.oz + (p.r + 0.5) * PL; (by[a.d] || (by[a.d] = [])).push(p); });
    const views = [], meta = [];
    Object.keys(by).sort().forEach(d => { const L = by[d], cx = L.reduce((t, p) => t + p.x, 0) / L.length, cz = L.reduce((t, p) => t + p.z, 0) / L.length, ext = Math.max(...L.map(p => Math.hypot(p.x - cx, p.z - cz))) + PL / 2, ds = slug(d);
        const add = (kind, p, st, v) => { if (!st) return; const name = ds + '_' + kind; if (views.some(q => q.name === name)) return; views.push(Object.assign({ name, x: st.x, z: st.z, y: st.y }, v)); meta.push({ room: short, district: d, kind, plot: p ? p.id : null, plotName: p ? p.a.name : null, need: p ? p.a.need : null, x: st.x, z: st.z, y: st.y, face: v.face }); };
        /* from the air: stand at the south end looking north across the district */
        const mid = L.slice().sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz))[0];
        /* (a roofed room, a cave or a tunnel has no air to stand in: its wide picture is from 16 m back under the roof) */
        add('air', mid, stand(mid.x, mid.z, 40), room.shell.open ? { face: 0, pitch: -0.72, dist: Math.max(45, Math.min(90, ext * 0.9)) } : { face: 0, pitch: -0.42, dist: 16 });
        if (!(L.length > 1 || L[0].a.walk >= 8)) return;
        const worst = L.slice().sort((a, b) => b.a.need - a.a.need || a.a.pieces - b.a.pieces)[0], bestP = L.slice().sort((a, b) => b.a.pieces - a.a.pieces)[0];
        const g = (kind, p) => { const st = stand(p.x, p.z + 10, 24); if (!st) return; const tx = Math.hypot(p.x - st.x, p.z - st.z) > 5 ? p.x : cx, tz = Math.hypot(p.x - st.x, p.z - st.z) > 5 ? p.z : cz; add(kind, p, st, { face: face(st.x, st.z, tx, tz), pitch: -0.12, dist: 7 }); };
        g('worst', worst); if (bestP !== worst) g('best', bestP); else if (L.length > 1) g('best', L.find(p => p !== worst)); });
    return { short, views, meta }; }
const ids = (only.length ? only : Object.keys(ROOMS).filter(i => !retired[i] && (ROOMS[i].plots || i === 'site_prebuilt_downtown_streets'))).sort((a, b) => ROOMS[a].shell.w * ROOMS[a].shell.d - ROOMS[b].shell.w * ROOMS[b].shell.d);
fs.mkdirSync(OUT, { recursive: true });
const IDX = path.join(OUT, 'index.json'); let index = []; try { index = JSON.parse(fs.readFileSync(IDX, 'utf8')); } catch (e) {}
let n = 0;
for (const id of ids) { let V; try { V = viewsOf(id); } catch (e) { console.log('NO VIEWS', id, e.message); continue; }
    if (VIEWS_ONLY) { console.log(id, V.views.length, JSON.stringify(V.views.slice(0, 3))); n += V.views.length; continue; }
    const dir = path.join(OUT, V.short); fs.mkdirSync(dir, { recursive: true }); const t0 = Date.now();
    const r = cp.spawnSync('node', ['playtest_city.js', id, JSON.stringify(V.views)].concat(FLAGS ? ['--flags=' + FLAGS] : []), { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 40 * 60 * 1000 });
    const log = (r.stdout || '') + (r.stderr || ''), err = (/ERRORS (\[.*\])/.exec(log) || [])[1] || '?', notReady = /ROOM NOT READY/.test(log);
    let got = 0; V.views.forEach((v, i) => { const png = path.join(REPO, 'shots/city', id + '_' + v.name + '.png'); if (!fs.existsSync(png) || fs.statSync(png).mtimeMs < t0) return;
        cp.spawnSync('convert', [png, '-resize', '800x500', '-quality', '72', path.join(dir, v.name + '.jpg')]); got++; V.meta[i].file = V.short + '/' + v.name + '.jpg'; });
    index = index.filter(m => m.room !== V.short).concat(V.meta.filter(m => m.file)); fs.writeFileSync(IDX, JSON.stringify(index, null, 0).replace(/\},\{/g, '},\n{'));
    console.log(id, got + '/' + V.views.length, ((Date.now() - t0) / 1000).toFixed(0) + 's', 'errors ' + err.slice(0, 200), notReady ? 'ROOM NOT READY' : ''); n += got; }
console.log(n + (VIEWS_ONLY ? ' views' : ' pictures'));
