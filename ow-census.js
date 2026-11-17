#!/usr/bin/env node
/* ow-census.js — THE COUNT BEFORE AND AFTER A ZONE MOVE (2026-11-17, One World foundation; repo-only tooling).
   mondo's rule for the One World map: "Districts keep every plot and everything on them; only where the plots stand changes."
   This counts what stands on every plot of a room, by the plot's NAME (the name carries over a move; a plot's id is its place in
   its own room's grid and changes), so a zone thread can prove its move lost nothing.

   node ow-census.js <room id> [<room id> …] > docs/areas/<zone>/move/before.json     BEFORE the move (the old room)
   node ow-census.js --diff docs/areas/<zone>/move/before.json <new room id> …         AFTER it (every room the old one became)
       prints every plot whose pieces differ (missing = stood there before, not now; extra = new) and exits 1 when anything is
       missing. Extra pieces are fine (new doors on the seams, new edge stops): read the list, do not chase it to zero.

   WHAT IS COUNTED, per plot name: props by key, terrain features by kind (+ their key / model / id), doors by id, natives by race.
   A piece belongs to the plot its ANCHOR stands on (a prop's x, z; a feature's middle; a door's place on its wall).
   NOT counted (they are re-cut by every bake): `space` rows; whole-room `scatter` rows are listed under "(the room)".
   Plots that share a name ("Open Desert", "The Culverts") are counted together. */
'use strict';
const fs = require('fs'), path = require('path');
const D = require(path.join(__dirname, 'load-data.js')).loadGameData(), ROOMS = D.DOOR_HQ.rooms;
const args = process.argv.slice(2), di = args.indexOf('--diff'), before = di >= 0 ? JSON.parse(fs.readFileSync(args[di + 1], 'utf8')) : null;
const ids = args.filter((a, i) => !a.startsWith('--') && !(di >= 0 && i === di + 1));
if (!ids.length) { console.error('ow-census: which room(s)? See the header of this file.'); process.exit(1); }
const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
function census(id) {
    const R = ROOMS[id]; if (!R) { console.error('ow-census: no room ' + id); process.exit(1); }
    const P = R.plots || {}, PL = P.plot || 42, cols = P.nx || P.n || Math.round(R.shell.w / PL), rows = P.nz || Math.round(R.shell.d / PL), hw = R.shell.w / 2, hd = R.shell.d / 2;
    const nameAt = {}; (P.names || []).forEach(n => { const m = /^P(\d+)-(\d+)$/.exec(n[0]); if (m) nameAt[(+m[1] - (P.x0 || 0)) + ',' + (+m[2] - (P.y0 || 0))] = n[1]; });
    /* a room whose ids do not start at column 0 (the Mountains: P04 … P15): shift so the smallest id is the first column */
    { const xs = (P.names || []).map(n => +(/^P(\d+)-/.exec(n[0]) || [0, 0])[1]), x0 = xs.length ? Math.min(...xs) : 0; if (x0 > 0 && Math.max(...xs) - x0 < cols) { for (const k of Object.keys(nameAt)) delete nameAt[k]; (P.names || []).forEach(n => { const m = /^P(\d+)-(\d+)$/.exec(n[0]); if (m) nameAt[(+m[1] - x0) + ',' + m[2] * 1] = n[1]; }); } }
    const out = {}, plot = (x, z) => { const c = Math.max(0, Math.min(cols - 1, Math.floor((x + hw) / PL))), r = Math.max(0, Math.min(rows - 1, Math.floor((z + hd) / PL))); return nameAt[c + ',' + r] || ('(no name ' + c + ',' + r + ')'); };
    const at = n => out[n] || (out[n] = { props: {}, features: {}, doors: {}, natives: {} });
    (R.props || []).forEach(p => bump(at(plot(p.x || 0, p.z || 0)).props, p.key));
    ((R.terrain && R.terrain.features) || []).forEach(f => {
        if (f.k === 'space') return;
        const tag = f.k + (f.key ? ':' + f.key : f.kind ? ':' + f.kind : f.model ? ':' + f.model : '') + (f.id ? '#' + f.id : '');
        if (f.k === 'scatter' && f.x == null) { bump(at('(the room)').features, tag + ' x' + (f.n || 1)); return; }
        let x = f.x, z = f.z;
        if (x == null && f.x0 != null) { x = (f.x0 + f.x1) / 2; z = (f.z0 + f.z1) / 2; }
        if (x == null && Array.isArray(f.pts) && f.pts.length) { const q = f.pts[Math.floor(f.pts.length / 2)]; x = q[0] != null ? q[0] : q.x; z = q[1] != null ? q[1] : q.z; }
        if (x == null && f.arc) { x = f.arc.x != null ? f.arc.x : f.arc[0]; z = f.arc.z != null ? f.arc.z : f.arc[1]; }
        if (x == null || z == null || !isFinite(x) || !isFinite(z)) { bump(at('(the room)').features, tag); return; }
        bump(at(plot(x, z)).features, tag);
    });
    (R.doors || []).forEach(d => { const x = d.wall === 'w' ? -hw + 1 : d.wall === 'e' ? hw - 1 : (d.x || 0), z = d.wall === 'n' ? -hd + 1 : d.wall === 's' ? hd - 1 : (d.z || 0); bump(at(plot(x, z)).doors, d.id); });
    (R.npcSpots || []).forEach(n => bump(at(plot(n.x || 0, n.z || 0)).natives, n.race || '?'));
    return { plots: out, lines: (R.lines || []).length };
}
const now = { rooms: ids, plots: {}, lines: 0 };
ids.forEach(id => { const c = census(id); now.lines += c.lines;
    Object.keys(c.plots).forEach(n => { const a = now.plots[n] || (now.plots[n] = { props: {}, features: {}, doors: {}, natives: {} }); ['props', 'features', 'doors', 'natives'].forEach(g => Object.keys(c.plots[n][g]).forEach(k => { a[g][k] = (a[g][k] || 0) + c.plots[n][g][k]; })); }); });
const total = c => Object.values(c.plots).reduce((t, p) => { ['props', 'features', 'doors', 'natives'].forEach(g => { t[g] += Object.values(p[g]).reduce((a, b) => a + b, 0); }); return t; }, { props: 0, features: 0, doors: 0, natives: 0 });
now.totals = Object.assign(total(now), { lines: now.lines, plots: Object.keys(now.plots).length });
if (!before) { console.log(JSON.stringify(now, null, 1)); process.exit(0); }
let missing = 0, extra = 0;
const names = [...new Set(Object.keys(before.plots).concat(Object.keys(now.plots)))].sort();
names.forEach(n => { const a = before.plots[n] || { props: {}, features: {}, doors: {}, natives: {} }, b = now.plots[n] || { props: {}, features: {}, doors: {}, natives: {} }, lines = [];
    ['props', 'features', 'doors', 'natives'].forEach(g => { [...new Set(Object.keys(a[g]).concat(Object.keys(b[g])))].sort().forEach(k => { const d = (b[g][k] || 0) - (a[g][k] || 0); if (d < 0) { missing -= d; lines.push('  MISSING ' + (-d) + ' x ' + g + ' ' + k); } else if (d > 0) { extra += d; lines.push('  extra   ' + d + ' x ' + g + ' ' + k); } }); });
    if (!before.plots[n]) lines.unshift('  (a plot the old room did not have)'); if (!now.plots[n]) lines.unshift('  (THE PLOT IS GONE)');
    if (lines.length) console.log(n + '\n' + lines.join('\n')); });
if (now.lines < before.lines) { console.log('MISSING ' + (before.lines - now.lines) + ' lines of talk (room.lines)'); missing += before.lines - now.lines; }
console.log('before ' + JSON.stringify(before.totals) + '\nafter  ' + JSON.stringify(now.totals) + '\n' + (missing ? missing + ' piece(s) MISSING' : 'nothing missing') + ', ' + extra + ' extra');
process.exit(missing ? 1 : 0);
