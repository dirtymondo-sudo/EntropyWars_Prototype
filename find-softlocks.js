#!/usr/bin/env node
/* find-softlocks.js — THE SOFT-LOCK FINDER (2026-11-22, repo-only tooling; mondo: "fell into this tiny crevice in the sewers ... they are so easy to
   fall into and get stuck and soft locked ... no tiny crevices or huge drops where there is no room to get out or move ... fix this everywhere").
   It reads every terrain room the way the walker walks it (data.js hqTerrainFeet, the real rule: step 0.62 m, jump 1.3 m, the ladders) and lists:

     TRAP     ground the walker reaches from a door (or the spawn) and can never leave again: an enclosed pit, a drop with no way back
              (data.js hqTerrainTraps, the room's own grid)
     CREVICE  a sliver of ground BETWEEN two grid nodes, at the foot of a wall or a mass, that lies more than a jump under the floor beside it:
              the walker slides in off the floor and cannot step or jump out (the Sewers' wall gaps; the grid check cannot see them)
     DIP      the same sliver, shallower than a jump (0.62 - 1.3 m): jumped out of, still a hole at a wall's foot
     SLOT     a strip of ground one or two nodes wide (under 1.8 m) under a face the walker can drop off, with a wall or another face on its other
              side: a tiny crevice to fall into, even where it can be walked out of at an end

       node find-softlocks.js <room id> [more ids]     one room each, printed
       node find-softlocks.js --all [--jobs 4]         every terrain room (retired ones left out), a table by zone
       node find-softlocks.js --zone "THE DESERT"      the rooms whose label starts with that zone
       --out <dir>   where each room's JSON goes (default shots/softlocks)       --json   print the room's JSON, no table

   A row's x, z, y are the room's own metres (the F3 line's). Notes: docs/notes/areas-complexes.md "THE SOFT-LOCK FINDER". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ARGS = process.argv.slice(2), flag = n => ARGS.includes(n), opt = (n, d) => { const i = ARGS.indexOf(n); return i >= 0 ? ARGS[i + 1] : d; };
const OUT = path.resolve(opt('--out', path.join(__dirname, 'shots', 'softlocks')));
const IDS = ARGS.filter((a, i) => !a.startsWith('--') && !['--out', '--jobs', '--zone'].includes(ARGS[i - 1]));

function scan(D, id) {
    return vm.runInContext(`(() => {
    const id = ${JSON.stringify(id)}, room = DOOR_HQ.rooms[id], t0 = Date.now();
    const info = hqTerrainInfo(id); if (!info) return { id, err: 'no terrain' };
    const R = info.rules, res = info.res, nx = info.nx, nz = info.nz, CL = R.climb, JP = (R.jump != null) ? R.jump : R.climb;
    const drowned = !!(info.sea && info.sea.under);
    const bx = info.halfW - R.bodyR, bz = info.halfD - R.bodyR;
    const X = i => info.x0 + i * res, Z = j => info.z0 + j * res, r2 = v => Math.round(v * 100) / 100;
    const feet = (x, z, c) => (Math.abs(x) > bx || Math.abs(z) > bz) ? null : hqTerrainFeet(info, x, z, c);
    /* the free ground at every node (G0), and the ground the walker REACHES from the doors with its jump and the ladders (G): a roof or a
       wall's top no walker gets onto is nobody's crevice */
    if (!(info.pads || []).length && room.spawn) info.pads = [{ x: room.spawn.x || 0, z: room.spawn.z || 0, r: 1 }];
    const NN = nx * nz, G0 = new Float32Array(NN).fill(NaN), G = new Float32Array(NN).fill(NaN), WET = new Uint8Array(NN);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const y = feet(X(i), Z(j), null); if (y != null) { G0[j * nx + i] = y; if (hqTerrainFluidAt(info, X(i), Z(j))) WET[j * nx + i] = 1; } }
    const padNodes = (info.pads || []).map(p => [Math.round((p.x - info.x0) / res), Math.round((p.z - info.z0) / res)]);
    let reached = 0;
    try { _hqTReachJump(info, padNodes, null, _hqTClimbLim(info, JP)).forEach((y, k) => { if (k < NN) { G[k] = y; reached++; } }); } catch (e) {}
    const g = (i, j) => (i < 0 || j < 0 || i >= nx || j >= nz) ? NaN : G[j * nx + i];
    const g0 = (i, j) => (i < 0 || j < 0 || i >= nx || j >= nz) ? NaN : G0[j * nx + i];
    const group = (cells, key) => { const S = new Map(cells.map(c => [c.k, c])), seen = new Set(), out = [];
        for (const c of cells) { if (seen.has(c.k)) continue; const comp = [], q = [c]; seen.add(c.k);
            while (q.length) { const a = q.pop(); comp.push(a); const i = a.k % nx, j = (a.k - i) / nx;
                for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const kk = (j + dj) * nx + i + di, b = S.get(kk); if (b && !seen.has(kk)) { seen.add(kk); q.push(b); } } }
            const worst = comp.reduce((m, a) => a[key] > m[key] ? a : m, comp[0]);
            out.push({ x: r2(worst.x), z: r2(worst.z), y: r2(worst.y), [key]: r2(worst[key]), nodes: comp.length, len: r2(comp.length * res) }); }
        return out.sort((a, b) => b[key] - a[key]); };
    /* TRAPS: from the doors' pads, else the spawn */
    let traps = [], trapErr = null;
    try { traps = drowned ? [] : hqTerrainTraps(info).map(t => ({ x: t.x, z: t.z, y: t.y, nodes: t.cells, area: r2(t.cells * res * res) })); } catch (e) { trapErr = String(e).slice(0, 120); }
    /* CREVICES + DIPS: from every reached node, toward a neighbour that is no ground at all, the walker's own steps */
    const crev = [], dips = [];
    if (!drowned) for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const yn = G[j * nx + i]; if (!(yn === yn) || WET[j * nx + i]) continue;
        let worst = 0, wx = 0, wz = 0, wy = 0;
        for (const n of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (g0(i + n[0], j + n[1]) === g0(i + n[0], j + n[1])) continue;   // (a neighbour that is ground: a ledge, the grid's own business)
            let cur = yn;
            for (let s = 0.1; s < res - 0.01; s += 0.1) { const x = X(i) + n[0] * s, z = Z(j) + n[1] * s, y = feet(x, z, cur); if (y == null) break;
                if (hqTerrainFluidAt(info, x, z)) break;
                cur = y; if (yn - y > worst) { worst = yn - y; wx = x; wz = z; wy = y; } } }
        if (worst > JP) crev.push({ k: j * nx + i, x: wx, z: wz, y: wy, drop: worst }); else if (worst > CL) dips.push({ k: j * nx + i, x: wx, z: wz, y: wy, drop: worst }); }
    /* SLOTS: a run of reached ground under 1.8 m wide, a face the walker can drop off above one end, a wall or a face at the other */
    const slot = [];
    if (!drowned) { const MAXN = Math.max(1, Math.floor(1.8 / res));
        const end = (i, j, di, dj, y) => { const v = g0(i + di, j + dj); if (!(v === v)) return 'wall'; if (v - y > JP) return (g(i + di, j + dj) === g(i + di, j + dj)) ? 'face' : 'wall'; if (y - v > JP) return 'drop'; return null; };
        for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const y = G[j * nx + i]; if (!(y === y) || WET[j * nx + i]) continue;
            for (const ax of [[1, 0], [0, 1]]) { let a = 0, b = 0, ea = null, eb = null;
                while (a < MAXN && !(ea = end(i - a * ax[0], j - a * ax[1], -ax[0], -ax[1], g0(i - a * ax[0], j - a * ax[1])))) a++;
                while (b < MAXN && !(eb = end(i + b * ax[0], j + b * ax[1], ax[0], ax[1], g0(i + b * ax[0], j + b * ax[1])))) b++;
                if (!ea || !eb || a + b + 1 > MAXN) continue;
                if (ea === 'drop' || eb === 'drop' || (ea !== 'face' && eb !== 'face')) continue;   // (wall to wall = an alley; a drop on one side = a ledge, not a slot)
                const top = Math.max(ea === 'face' ? g0(i - (a + 1) * ax[0], j - (a + 1) * ax[1]) : -1e9, eb === 'face' ? g0(i + (b + 1) * ax[0], j + (b + 1) * ax[1]) : -1e9);
                slot.push({ k: j * nx + i, x: X(i), z: Z(j), y, deep: top - y }); break; } } }
    const slots = group(slot, 'deep').filter(s => s.nodes >= 2);
    return { id, label: room.label || id, sub: room.sub || '', res, w: r2(info.halfW * 2), d: r2(info.halfD * 2), ms: Date.now() - t0, trapErr, reached, plan: info.gen ? (info.gen.kind + (info.gen.look ? '/' + info.gen.look : '')) : null, carved: (info.gen && info.gen.carved) || 0,
             traps, crevices: group(crev, 'drop'), dips: group(dips, 'drop'), slots };
    })()`, D);
}

const zoneOf = r => String(r.label || r.id).split(' · ')[0].trim();
function line(r) { return `${r.id}  [${r.label}]  traps ${r.traps.length}  crevices ${r.crevices.length}  dips ${r.dips.length}  slots ${r.slots.length}${r.carved ? '  CARVED ' + r.carved : ''}  (${(r.ms / 1000).toFixed(1)} s)`; }
function detail(r, n) { const o = []; const f = (name, rows, k) => rows.slice(0, n).forEach(t => o.push(`    ${name} x ${t.x} z ${t.z} y ${t.y}` + (k ? `  ${k} ${t[k]} m` : '') + (t.area ? `  ${t.area} m2` : '') + (t.len ? `  ~${t.len} m long` : '')));
    f('TRAP   ', r.traps); f('CREVICE', r.crevices, 'drop'); f('DIP    ', r.dips, 'drop'); f('SLOT   ', r.slots, 'deep'); return o.join('\n'); }

if (flag('--child')) {
    const D = require('./load-data.js').loadGameData(); let r; try { r = scan(D, IDS[0]); } catch (e) { r = { id: IDS[0], err: String(e && e.stack || e).slice(0, 400) }; }
    process.stdout.write('\n@@SOFTLOCK@@' + JSON.stringify(r) + '\n'); process.exit(0);
}
(async () => {
    const D = require('./load-data.js').loadGameData();
    let ids = IDS.slice();
    if (flag('--all') || opt('--zone')) { const retired = vm.runInContext('Object.keys(DOOR_HQ.retired || {})', D), zn = opt('--zone');
        ids = vm.runInContext('hqTerrainRooms()', D).filter(id => !retired.includes(id));
        if (zn) { const L = JSON.parse(vm.runInContext('JSON.stringify(Object.fromEntries(hqTerrainRooms().map(id => [id, DOOR_HQ.rooms[id].label || id])))', D)); ids = ids.filter(id => String(L[id]).toUpperCase().startsWith(zn.toUpperCase())); } }
    if (!ids.length) { console.log('usage: node find-softlocks.js <room id…> | --all [--jobs 4] | --zone "<ZONE>"'); process.exit(1); }
    fs.mkdirSync(OUT, { recursive: true });
    const jobs = Math.max(1, +opt('--jobs', 4)), res = [], queue = ids.slice();
    const one = id => new Promise(done => { cp.execFile(process.execPath, ['--max-old-space-size=6000', __filename, '--child', id], { maxBuffer: 1 << 28 }, (err, so) => {
        const m = /@@SOFTLOCK@@(.*)/.exec(so || ''); let r = m ? JSON.parse(m[1]) : { id, err: String(err || 'no answer').slice(0, 300) };
        fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify(r, null, 1)); res.push(r);
        if (!flag('--json')) console.log(r.err ? `${id}  FAILED ${r.err}` : line(r) + ((ids.length <= 6) ? '\n' + detail(r, 40) : '')); done(); }); });
    await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) await one(queue.shift()); }));
    if (flag('--json')) { console.log(JSON.stringify(res)); return; }
    if (ids.length > 1) { const Zs = {}; res.filter(r => !r.err).forEach(r => { const z = Zs[zoneOf(r)] = Zs[zoneOf(r)] || { rooms: 0, bad: 0, traps: 0, crevices: 0, dips: 0, slots: 0 };
            z.rooms++; z.traps += r.traps.length; z.crevices += r.crevices.length; z.dips += r.dips.length; z.slots += r.slots.length; if (r.traps.length + r.crevices.length) z.bad++; });
        const rows = Object.entries(Zs).sort((a, b) => (b[1].traps + b[1].crevices) - (a[1].traps + a[1].crevices));
        const T = ['| zone | rooms | rooms with a soft lock | traps | crevices | dips | slots |', '|---|---|---|---|---|---|---|'].concat(rows.map(([z, v]) => `| ${z} | ${v.rooms} | ${v.bad} | ${v.traps} | ${v.crevices} | ${v.dips} | ${v.slots} |`));
        const tot = rows.reduce((a, [, v]) => { a.t += v.traps; a.c += v.crevices; a.d += v.dips; a.s += v.slots; return a; }, { t: 0, c: 0, d: 0, s: 0 });
        T.push(`| ALL | ${res.length} | ${res.filter(r => !r.err && r.traps.length + r.crevices.length).length} | ${tot.t} | ${tot.c} | ${tot.d} | ${tot.s} |`);
        const failed = res.filter(r => r.err);
        const md = ['# Soft locks by zone (find-softlocks.js)', '', T.join('\n'), '', failed.length ? 'FAILED: ' + failed.map(r => r.id).join(', ') : '', '', '## By room (only rooms with a trap or a crevice)', '']
            .concat(res.filter(r => !r.err && r.traps.length + r.crevices.length).sort((a, b) => zoneOf(a).localeCompare(zoneOf(b))).map(r => '### ' + line(r) + '\n```\n' + detail(r, 25) + '\n```')).join('\n');
        fs.writeFileSync(path.join(OUT, '_summary.md'), md); console.log('\n' + T.join('\n') + '\n\n' + path.join(OUT, '_summary.md')); }
})();
