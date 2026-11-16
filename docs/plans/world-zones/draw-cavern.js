#!/usr/bin/env node
/* draw-cavern.js — draws THE CAVERN's plot plan from docs/areas/cavern/layout.json: writes cavern_plot_plan_2.svg beside this file, and the
   PNG when playwright is installed (`node docs/plans/world-zones/draw-cavern.js`). The ways out are listed here by hand (they are the tool's). */
'use strict';
const fs = require('fs'), path = require('path');
const L = JSON.parse(fs.readFileSync(path.join(__dirname, '../../areas/cavern/layout.json'), 'utf8'));
const N = 12, S = 14, M = 150, W = L.cols * N * S, H = L.rows * N * S;
const COL = { x: '#2a2622', o: '#8a7f70', h: '#5a4a52', f: '#9aa0a4', u: '#6e6a78', c: '#9fe0d0', w: '#3f7fd0', l: '#ff6a1a', b: '#b08a50', g: '#5f9a4a', d: '#a08458', s: '#d8c890', m: '#e4e8e0', q: '#a8e8f0' };
const DC = { K: '#ffb060', H: '#ffe060', A: '#70e8ff' };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const WAYS = [   // [plot, side, label]
  ['P00-00', 'n', 'HELL · the Pit (cave_hell)'], ['P03-00', 'n', 'THE D.U.M.B. · Sub-Level 7 (cave_dumb)'], ['P05-00', 'e', 'THE SEWERS · the Old Workings (workings_oubliette)'], ['P05-00', 'n', 'DOOR HQ · the dungeon (hidden)'],
  ['P05-03', 'e', 'THE MOUNTAINS · Mount Shasta (shasta_lemuria) + the Woods\' trail'], ['P05-04', 'e', 'TECHNOTICLAN (technoticlan_agartha)'], ['P05-05', 's', 'ANTARCTICA (antarctica_polar)'],
  ['P04-05', 's', 'BAY 3 · Agartha'], ['P02-05', 's', 'ANTARCTICA (hollow_byrd) + BAY 3 · Hollow'], ['P02-01', 'well', 'the Haunted House\'s cellar well'], ['P02-02', 'well', 'the Estate\'s well'] ];
let o = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (W + 2 * M + 130) + '" height="' + (H + 2 * M + 60) + '" font-family="Verdana, sans-serif"><rect width="100%" height="100%" fill="#14110f"/>';
o += '<text x="' + M + '" y="48" fill="#fff" font-size="30" font-weight="bold">THE CAVERN · PLOT PLAN 2 · 6 x 6 plots (252 x 252 m)</text><text x="' + M + '" y="78" fill="#bbb" font-size="15">K The Cavern (dark, three tiers 4 / 8 / 12) · H Hollow Earth (open under the Inner Sun) · A Agartha (the crystal city, terraces 0 / 2 / 4). A number = the plot\'s level (1 = 1.75 m).</text>';
o += '<g transform="translate(' + M + ',' + (M - 30) + ')">';
L.cells.forEach((r, y) => r.split('').forEach((ch, x) => { o += '<rect x="' + x * S + '" y="' + y * S + '" width="' + (S + 0.5) + '" height="' + (S + 0.5) + '" fill="' + COL[ch] + '"/>'; }));
const P = {}; L.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); P[p.id] = p; });
L.plots.forEach(p => { const x = p.x * N * S, y = p.y * N * S;
  o += '<rect x="' + x + '" y="' + y + '" width="' + N * S + '" height="' + N * S + '" fill="' + DC[p.d] + '" fill-opacity="0.07" stroke="' + DC[p.d] + '" stroke-opacity="0.75" stroke-width="1.5"/>';
  const lm = /LANDMARK/.test(p.what), words = p.name.split(' '), lines = []; let cur = '';
  words.forEach(w => { if ((cur + ' ' + w).length > 14 && cur) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }); lines.push(cur);
  lines.forEach((t, i) => { o += '<text x="' + (x + N * S / 2) + '" y="' + (y + N * S / 2 - 4 + (i - (lines.length - 1) / 2) * 17) + '" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">' + esc(t) + '</text>'; });
  o += '<text x="' + (x + 6) + '" y="' + (y + 16) + '" font-size="12" fill="' + DC[p.d] + '" stroke="#000" stroke-width="3" paint-order="stroke">' + p.d + ' · ' + p.level + '</text>';
  if (lm) o += '<text x="' + (x + N * S / 2) + '" y="' + (y + N * S - 10) + '" text-anchor="middle" font-size="11" fill="#ffd040" stroke="#000" stroke-width="3" paint-order="stroke">★ LANDMARK</text>'; });
L.openings.forEach(q => { const a = P[q.a], b = P[q.b], ns = a.x === b.x, x = ns ? (a.x * N + 6.5) * S : Math.max(a.x, b.x) * N * S, y = ns ? Math.max(a.y, b.y) * N * S : (a.y * N + 6.5) * S;
  const c = q.kind === 'fall' ? '#40c0ff' : '#ffffff'; o += '<circle cx="' + x + '" cy="' + y + '" r="9" fill="#000" stroke="' + c + '" stroke-width="2"/><text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="11" fill="' + c + '">' + (q.kind === 'fall' ? 'F' : 'S') + '</text>'; });
WAYS.forEach(w => { const p = P[w[0]], cx = (p.x * N + 6) * S, cy = (p.y * N + 6) * S; let x = cx, y = cy, tx, ty, anchor = 'middle';
  if (w[1] === 'n') { y = 0; tx = x; ty = -12; } else if (w[1] === 's') { y = H; tx = x; ty = H + 22; } else if (w[1] === 'e') { x = W; tx = W + 8; ty = y + 4; anchor = 'start'; } else if (w[1] === 'w') { x = 0; tx = -8; ty = y + 4; anchor = 'end'; }
  if (w[1] === 'well') { o += '<circle cx="' + (cx - 40) + '" cy="' + (cy + 40) + '" r="8" fill="#000" stroke="#ff60c0" stroke-width="2.5"/><text x="' + (cx - 28) + '" y="' + (cy + 58) + '" font-size="10" fill="#ff90d0" stroke="#000" stroke-width="3" paint-order="stroke">' + esc(w[2]) + '</text>'; return; }
  if (w[0] === 'P05-00' && w[1] === 'n') tx += 40; if (w[0] === 'P02-05') tx -= 60; if (w[0] === 'P05-05') tx += 20;
  o += '<circle cx="' + x + '" cy="' + y + '" r="8" fill="#ff3090" stroke="#fff" stroke-width="2"/>';
  if (anchor === 'start') { const parts = w[2].split(' · '); const t = [parts[0]].concat(parts.slice(1).join(' · ').match(/.{1,22}(\s|$)/g) || []); t.forEach((s, i) => { o += '<text x="' + tx + '" y="' + (ty + 14 + i * 13) + '" font-size="10.5" fill="#ff90c8">' + esc(s.trim()) + '</text>'; }); }
  else o += '<text x="' + tx + '" y="' + ty + '" text-anchor="' + anchor + '" font-size="11" fill="#ff90c8">' + esc(w[2]) + '</text>'; });
o += '</g>';
let lx = M; const ly = H + M + 20; Object.keys(L.legend).forEach(k => { o += '<rect x="' + lx + '" y="' + ly + '" width="14" height="14" fill="' + COL[k] + '" stroke="#777"/><text x="' + (lx + 19) + '" y="' + (ly + 12) + '" font-size="11" fill="#ddd">' + esc(L.legend[k].split(' (')[0]) + '</text>'; lx += 30 + L.legend[k].split(' (')[0].length * 6.6; });
o += '<text x="' + M + '" y="' + (ly + 40) + '" font-size="12" fill="#ddd">S = a stair between two levels · F = a waterfall (with a stair beside it) · pink = a way out of the zone</text></svg>';
const svg = path.join(__dirname, 'cavern_plot_plan_2.svg'); fs.writeFileSync(svg, o);
(async () => { let pw; try { pw = require(path.join(__dirname, '../../../node_modules/playwright')); } catch (e) { console.log('svg written; no playwright, no png'); return; }
  const b = await require(path.join(__dirname, '../../../probe-fast.js')).launch(pw.chromium, { headless: true, executablePath: require(path.join(__dirname, '../../../probe-fast.js')).EXE, args: ['--no-sandbox'] }), pg = await b.newPage({ viewport: { width: W + 2 * M + 130, height: H + 2 * M + 60 } });
  await pg.goto('file://' + svg); await pg.screenshot({ path: path.join(__dirname, 'cavern_plot_plan_2.png') }); await b.close(); console.log('png written'); })();
