/* THREAD 21, KATANA ISLAND: the island plan picture for mondo (a proposal, nothing built). `node docs/plans/world-polish/thread21/draw-island.js`
   writes island-plan.svg beside it (every square of the island is drawn: one cell = one 3.5 m battle square). The numbers are island.js. */
'use strict';
const fs = require('fs'), path = require('path'), I = require('./island.js');
const S = 11, M = 4, OX = 30 + M * S, OY = 70 + M * S, PW = I.W * S, PH = I.H * S, LX = OX + PW + M * S + 30;
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)), mix = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
const X = x => OX + x * S, Y = y => OY + y * S, esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
let g = '<rect x="0" y="0" width="100%" height="100%" fill="#10202c"/>';
g += '<rect x="' + (OX - M * S) + '" y="' + (OY - M * S) + '" width="' + (PW + 2 * M * S) + '" height="' + (PH + 2 * M * S) + '" fill="#1d4f73"/>';
I.BAY.forEach(b => { g += '<rect x="' + X(b[0] * I.N) + '" y="' + Y(b[1] * I.N) + '" width="' + I.N * S + '" height="' + I.N * S + '" fill="#2a709c"/>'; });
for (let y = 0; y < I.H; y++) for (let x = 0; x < I.W; x++) { const k = I.KIND[y][x]; if (k === 'sea') continue; const p = I.plotAt(x, y);
    const c = k === 'sand' ? '#e3d49a' : k === 'cliff' ? '#4a433d' : mix(mix(hex(I.DIST[p.d][1]), [20, 24, 26], 0.55).match(/\d+/g).map(Number), mix(hex(I.DIST[p.d][1]), [255, 255, 255], 0.25).match(/\d+/g).map(Number), Math.min(1, p.level / 14));
    g += '<rect x="' + X(x) + '" y="' + Y(y) + '" width="' + S + '" height="' + S + '" fill="' + c + '" stroke="rgba(0,0,0,0.16)" stroke-width="0.5"/>'; }
/* the ways, square by square */
const WCOL = { 3: '#6b3d14', 2: '#a8743a', 1: '#ffe14a' };
I.WAYS.slice().sort((a, b) => a[1] - b[1]).reverse().forEach(w => I.waySquares(w).forEach(q => { g += '<rect x="' + (X(q[0]) + 0.5) + '" y="' + (Y(q[1]) + 0.5) + '" width="' + (S - 1) + '" height="' + (S - 1) + '" fill="' + WCOL[w[1]] + '" stroke="rgba(0,0,0,0.35)" stroke-width="0.5"/>'; }));
/* plots: the lines, the level, the name */
I.PLOTS.forEach(q => { const [px, py, d, l, nm] = q, x = X(px * I.N), y = Y(py * I.N), s = I.N * S;
    g += '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1"/>';
    [[1, 0, x + s, y, x + s, y + s], [-1, 0, x, y, x, y + s], [0, 1, x, y + s, x + s, y + s], [0, -1, x, y, x + s, y]].forEach(e => { const n = I.plot[(px + e[0]) + ':' + (py + e[1])]; if (!n || n.d !== d) g += '<line x1="' + e[2] + '" y1="' + e[3] + '" x2="' + e[4] + '" y2="' + e[5] + '" stroke="' + I.DIST[d][1] + '" stroke-width="4"/>'; });
    g += '<text x="' + (x + 6) + '" y="' + (y + 27) + '" font-size="27" font-weight="800" fill="#fff" stroke="#000" stroke-width="3.5" paint-order="stroke">' + l + '</text>';
    g += '<text x="' + (x + s / 2) + '" y="' + (y + s - 6) + '" font-size="11" font-weight="700" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">' + esc(nm) + '</text>'; });
g += '<text x="' + X(18) + '" y="' + Y(74) + '" font-size="13" font-weight="800" text-anchor="middle" fill="#cfeaff">KATANA BAY</text>';
/* the ledges: a white bar on the square edges + an arrow the way you fall */
I.LEDGES.forEach(q => { const [x0, y0, x1, y1, dir] = q, mx = (X(x0) + X(x1)) / 2, my = (Y(y0) + Y(y1)) / 2, v = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] }[dir], a = 13;
    g += '<line x1="' + X(x0) + '" y1="' + Y(y0) + '" x2="' + X(x1) + '" y2="' + Y(y1) + '" stroke="#000" stroke-width="8"/><line x1="' + X(x0) + '" y1="' + Y(y0) + '" x2="' + X(x1) + '" y2="' + Y(y1) + '" stroke="#fff" stroke-width="5"/>';
    const tip = [mx + v[0] * (a + 6), my + v[1] * (a + 6)], b1 = [mx + v[0] * 5 - v[1] * 8, my + v[1] * 5 + v[0] * 8], b2 = [mx + v[0] * 5 + v[1] * 8, my + v[1] * 5 - v[0] * 8];
    g += '<polygon points="' + [tip, b1, b2].map(p => p.map(n => n.toFixed(1)).join(',')).join(' ') + '" fill="#fff" stroke="#000" stroke-width="1.5"/>'; });
/* the landmarks */
I.MARKS.forEach(m => { const x = X(m[0]) + S / 2, y = Y(m[1]) + S / 2; g += '<circle cx="' + x + '" cy="' + y + '" r="5.5" fill="#ff3b3b" stroke="#fff" stroke-width="2"/><text x="' + (x + 9) + '" y="' + (y + 4) + '" font-size="11" font-weight="700" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">' + esc(m[2]) + '</text>'; });
/* the boat, the compass */
g += '<path d="M ' + (X(17) + S) + ' ' + (Y(I.H) + M * S - 4) + ' L ' + (X(17) + S) + ' ' + (Y(66)) + '" stroke="#fff" stroke-width="2.5" stroke-dasharray="7 5" fill="none"/>';
g += '<text x="' + (X(19) + 4) + '" y="' + (Y(I.H) + M * S - 10) + '" font-size="12" font-weight="700" fill="#fff">the boat from the Beach comes in from the south, through the gate, up the bay</text>';
g += '<text x="' + (OX - M * S + 8) + '" y="' + (OY - M * S + 20) + '" font-size="13" font-weight="800" fill="#cfeaff">N ↑   one cell = one 3.5 m battle square; a plot = 12 x 12 squares</text>';
/* the legend */
let ly = OY - M * S + 6; const T = (t, sz, w, col) => { g += '<text x="' + LX + '" y="' + ly + '" font-size="' + (sz || 13) + '" font-weight="' + (w || 400) + '" fill="' + (col || '#e8eef2') + '">' + esc(t) + '</text>'; ly += (sz || 13) + 7; };
T('THE DISTRICTS (29 plots)', 15, 800); Object.keys(I.DIST).forEach(d => { const ps = I.PLOTS.filter(p => p[2] === d), ls = ps.map(p => p[3]); g += '<rect x="' + LX + '" y="' + (ly - 12) + '" width="14" height="14" fill="' + I.DIST[d][1] + '"/>';
    g += '<text x="' + (LX + 22) + '" y="' + ly + '" font-size="13" font-weight="700" fill="#fff">' + I.DIST[d][0] + '</text><text x="' + (LX + 150) + '" y="' + ly + '" font-size="13" fill="#e8eef2">' + ps.length + ' plots, levels ' + Math.min(...ls) + ' to ' + Math.max(...ls) + '</text>'; ly += 21; });
ly += 8; T('THE BIG NUMBER = the plot’s level', 13, 700); T('1 level = 1.75 m. 0 = the sea. 18 = the crater, 31.5 m.'); T('Darker = lower, lighter = higher. Downhill is the bay.');
ly += 8; T('THE WAYS (every one on whole squares)', 15, 800);
[[3, 'main way, 3 squares wide'], [2, 'lane, 2 squares wide'], [1, 'thin trail, 1 square wide']].forEach(r => { g += '<rect x="' + LX + '" y="' + (ly - 12) + '" width="' + (r[0] * 11) + '" height="14" fill="' + WCOL[r[0]] + '" stroke="#000"/><text x="' + (LX + 42) + '" y="' + ly + '" font-size="13" fill="#e8eef2">' + r[1] + '</text>'; ly += 21; });
T('Straight legs, right-angle turns, no leg over'); T('8 squares (28 m). Checked by the script.');
ly += 8; g += '<line x1="' + LX + '" y1="' + (ly - 5) + '" x2="' + (LX + 34) + '" y2="' + (ly - 5) + '" stroke="#fff" stroke-width="5"/><text x="' + (LX + 42) + '" y="' + ly + '" font-size="13" font-weight="700" fill="#fff">A LEDGE: walk off, fall, no way back up</text>'; ly += 21;
T('Each is 2 levels (3.5 m) or more. The walker’s'); T('jump tops out at 1.46 m. The arrow = the fall.');
ly += 8; T('THE WAYS BY NAME', 15, 800); I.WAYS.forEach(w => { const t = w[0], cut = t.indexOf('(');
    g += '<rect x="' + LX + '" y="' + (ly - 10) + '" width="10" height="10" fill="' + WCOL[w[1]] + '" stroke="#000" stroke-width="0.6"/><text x="' + (LX + 16) + '" y="' + ly + '" font-size="11.5" font-weight="700" fill="#fff">' + esc(cut > 0 ? t.slice(0, cut).trim() : t) + '</text>'; ly += 15;
    if (cut > 0) { g += '<text x="' + (LX + 16) + '" y="' + ly + '" font-size="10.5" fill="#b9c7d0">' + esc(t.slice(cut + 1, -1)) + '</text>'; ly += 16; } });
ly += 6; g += '<circle cx="' + (LX + 6) + '" cy="' + (ly - 5) + '" r="5.5" fill="#ff3b3b" stroke="#fff" stroke-width="2"/><text x="' + (LX + 20) + '" y="' + ly + '" font-size="13" fill="#e8eef2">a landmark you steer by</text>'; ly += 24;
T('A PROPOSAL. NOTHING IS BUILT.', 13, 800, '#ffd27a');
const TW = LX + 430, TH = OY + PH + M * S + 26;
const head = '<text x="30" y="34" font-size="22" font-weight="800" fill="#fff">KATANA ISLAND, the plan: 29 plots, six districts, every square drawn</text><text x="30" y="56" font-size="13" fill="#b9c7d0">The volcano stands in the middle of the north side and is seen from everywhere. The land falls from it to the bay in the south-west.</text>';
fs.writeFileSync(path.join(__dirname, 'island-plan.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="' + TW + '" height="' + TH + '" viewBox="0 0 ' + TW + ' ' + TH + '" font-family="Helvetica, Arial, sans-serif">' + g + head + '</svg>');
console.log('island-plan.svg ' + TW + ' x ' + TH + '; ' + (I.check().join('; ') || 'ways checked'));
