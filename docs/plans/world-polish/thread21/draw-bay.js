/* THREAD 21, KATANA ISLAND: KATANA BAY square by square, the sample of how ways, ledges, open places and buildings are laid on the grid
   (a proposal for mondo, nothing built). `node docs/plans/world-polish/thread21/draw-bay.js` writes bay-plan.svg. Island squares x 0..35, y 48..83. */
'use strict';
const fs = require('fs'), path = require('path'), I = require('./island.js');
const X0 = 0, Y0 = 48, CW = 36, CH = 36, S = 30, OX = 30, OY = 76, LX = OX + CW * S + 28;
const X = x => OX + (x - X0) * S, Y = y => OY + (y - Y0) * S, esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const inR = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
/* ground: [x0, y0, x1, y1, kind, level]; later rows win. kinds: quay (stone), square (the open place), sand, rock, deck (a pier over the water), water, city */
const GROUND = [
    [12, 48, 23, 59, 'quay', 1], [13, 52, 22, 59, 'square', 1], [24, 57, 26, 59, 'quay', 1],
    [0, 60, 11, 71, 'quay', 1], [0, 60, 1, 71, 'rock', 1], [24, 60, 35, 71, 'quay', 1],
    [17, 60, 18, 66, 'deck', 1], [12, 68, 15, 69, 'deck', 1], [20, 62, 23, 63, 'deck', 1], [20, 68, 23, 69, 'deck', 1], [8, 62, 13, 63, 'slip', 0],
    [2, 72, 10, 76, 'rock', 1], [1, 74, 6, 82, 'rock', 2], [3, 77, 6, 80, 'rock', 3], [7, 72, 10, 74, 'quay', 1],
];
/* buildings: [letter, x0, y0, x1, y1, name, what is inside, door side] every one walk-in, on whole squares */
const BUILD = [
    ['A', 12, 48, 15, 50, 'The Harbour Office', 'one room: the harbour master’s desk, ledgers, a strongbox, a notice board outside', 'S'],
    ['B', 18, 48, 22, 50, 'The Fish Market', 'an open-fronted hall: fish tables, baskets, boxes of ice and fish, scales', 'S'],
    ['C', 3, 61, 7, 64, 'The Shipwright’s Shed', 'a tall shed open to the slip: a hull on the stocks, timber, tools, a forge', 'E'],
    ['D', 3, 67, 5, 69, 'The Net Loft', 'two floors: nets and sails below, a sleeping loft above', 'E'],
    ['E', 28, 60, 31, 62, 'The Rice Store', 'a thick-walled store house: rice bales, barrels, a ladder to the upper shelf', 'S'],
    ['F', 27, 66, 30, 69, 'The Harbour Inn', 'two floors: a common room with low tables and a hearth, a kitchen, sleeping rooms above', 'N'],
    ['H', 31, 74, 33, 75, 'The Fishermen’s Hut', 'one room: bunks, a hearth, hung fish', 'W'],
    ['T', 4, 79, 5, 80, 'The Lantern Tower', 'a stone harbour light: a stair inside, the fire room on top (the bay’s landmark)', 'E'],
];
/* stairs and ramps: [x0, y0, x1, y1, from level, to level, the way it climbs] */
const STAIRS = [[23, 51, 26, 53, 1, 3, 'E', 'The Harbour Gate stair'], [9, 55, 11, 56, 4, 1, 'E', 'The West Steps'], [8, 73, 8, 75, 1, 2, 'S', ''], [3, 76, 3, 78, 2, 3, 'S', '']];
const COL = { quay: '#9aa3a8', square: '#c9c2ae', sand: '#e3d49a', rock: '#6f675f', deck: '#8a6238', slip: '#b59a6a', water: '#2a709c', city: '#7d6a3c', land: '#9aa3a8', cliff: '#4a433d' };
const cellOf = (x, y) => { let k = I.KIND[y][x], l = I.LEVEL[y][x]; const p = I.plotAt(x, y), bay = !p; if (p && p.d !== 'B') return { k: k === 'sea' ? 'water' : 'city', l: p.level, off: true };
    if (k === 'sea') k = 'water'; GROUND.forEach(r => { if (inR(x, y, r) && (r[4] === 'deck' || r[4] === 'slip' || k !== 'water' || bay)) { if (bay && r[4] !== 'deck' && r[4] !== 'slip') return; k = r[4]; l = r[5]; } });
    if (p && (I.KIND[y][x] === 'sand') && !GROUND.some(r => inR(x, y, r) && r[4] !== 'quay')) { k = 'sand'; l = 0; }
    if (k === 'land' && p && p.level === 0) k = 'sand'; if (k === 'land' && p && p.x === 0 && p.y === 6) k = 'rock';
    return { k, l }; };
let g = '<rect width="100%" height="100%" fill="#10202c"/>';
for (let y = Y0; y < Y0 + CH; y++) for (let x = X0; x < X0 + CW; x++) { const c = cellOf(x, y);
    g += '<rect x="' + X(x) + '" y="' + Y(y) + '" width="' + S + '" height="' + S + '" fill="' + COL[c.k] + '"' + (c.off ? ' opacity="0.45"' : '') + ' stroke="rgba(0,0,0,0.28)" stroke-width="0.7"/>';
    if (c.k !== 'water' && !c.off) g += '<text x="' + (X(x) + S - 4) + '" y="' + (Y(y) + S - 4) + '" font-size="9" text-anchor="end" fill="rgba(0,0,0,0.6)">' + c.l + '</text>'; }
/* the ways on their squares */
const WCOL = { 3: '#6b3d14', 2: '#a8743a', 1: '#ffe14a' };
I.WAYS.slice().sort((a, b) => b[1] - a[1]).forEach(w => I.waySquares(w).forEach(q => { if (q[0] < X0 || q[0] >= X0 + CW || q[1] < Y0 || q[1] >= Y0 + CH) return; const p = I.plotAt(q[0], q[1]);
    g += '<rect x="' + (X(q[0]) + 3) + '" y="' + (Y(q[1]) + 3) + '" width="' + (S - 6) + '" height="' + (S - 6) + '" fill="' + WCOL[w[1]] + '" opacity="' + (p && p.d !== 'B' ? 0.5 : 0.9) + '" stroke="#000" stroke-width="0.8"/>'; }));
/* stairs */
STAIRS.forEach(s => { const v = s[6] === 'E' || s[6] === 'W'; g += '<rect x="' + X(s[0]) + '" y="' + Y(s[1]) + '" width="' + (s[2] - s[0] + 1) * S + '" height="' + (s[3] - s[1] + 1) * S + '" fill="#f4efe2" stroke="#000" stroke-width="2"/>';
    const n = (v ? s[2] - s[0] + 1 : s[3] - s[1] + 1) * 4; for (let i = 1; i < n; i++) g += v ? '<line x1="' + (X(s[0]) + i * S / 4) + '" y1="' + Y(s[1]) + '" x2="' + (X(s[0]) + i * S / 4) + '" y2="' + Y(s[3] + 1) + '" stroke="#000" stroke-width="0.8"/>' : '<line x1="' + X(s[0]) + '" y1="' + (Y(s[1]) + i * S / 4) + '" x2="' + X(s[2] + 1) + '" y2="' + (Y(s[1]) + i * S / 4) + '" stroke="#000" stroke-width="0.8"/>';
    g += '<text x="' + (X(s[0]) + (s[2] - s[0] + 1) * S / 2) + '" y="' + (Y(s[1]) + (s[3] - s[1] + 1) * S / 2 + 4) + '" font-size="12" font-weight="800" text-anchor="middle" fill="#000" stroke="#fff" stroke-width="3" paint-order="stroke">stairs ' + s[4] + ' → ' + s[5] + '</text>'; });
/* buildings */
BUILD.forEach(b => { const x = X(b[1]), y = Y(b[2]), w = (b[3] - b[1] + 1) * S, h = (b[4] - b[2] + 1) * S; g += '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="' + (w - 4) + '" height="' + (h - 4) + '" fill="#3b4652" stroke="#fff" stroke-width="2.5"/>';
    g += '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 8) + '" font-size="22" font-weight="800" text-anchor="middle" fill="#fff">' + b[0] + '</text>';
    const d = b[7], dx = d === 'E' ? x + w - 4 : d === 'W' ? x - 4 : x + w / 2 - 9, dy = d === 'S' ? y + h - 4 : d === 'N' ? y - 4 : y + h / 2 - 9; g += '<rect x="' + dx + '" y="' + dy + '" width="' + (d === 'E' || d === 'W' ? 8 : 18) + '" height="' + (d === 'E' || d === 'W' ? 18 : 8) + '" fill="#ffb03b" stroke="#000"/>'; });
/* ledges inside the picture */
I.LEDGES.forEach(q => { const [x0, y0, x1, y1, dir, a, b] = q; if (x0 < X0 || x1 > X0 + CW || y0 < Y0 || y1 > Y0 + CH) return; const mx = (X(x0) + X(x1)) / 2, my = (Y(y0) + Y(y1)) / 2, v = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] }[dir];
    g += '<line x1="' + X(x0) + '" y1="' + Y(y0) + '" x2="' + X(x1) + '" y2="' + Y(y1) + '" stroke="#000" stroke-width="10"/><line x1="' + X(x0) + '" y1="' + Y(y0) + '" x2="' + X(x1) + '" y2="' + Y(y1) + '" stroke="#fff" stroke-width="6"/>';
    const tip = [mx + v[0] * 24, my + v[1] * 24], b1 = [mx + v[0] * 7 - v[1] * 11, my + v[1] * 7 + v[0] * 11], b2 = [mx + v[0] * 7 + v[1] * 11, my + v[1] * 7 - v[0] * 11];
    g += '<polygon points="' + [tip, b1, b2].map(p => p.map(n => n.toFixed(1)).join(',')).join(' ') + '" fill="#fff" stroke="#000" stroke-width="1.5"/>';
    g += '<text x="' + (mx + v[0] * 40 + (v[0] ? 0 : 34)) + '" y="' + (my + v[1] * 40 + 4) + '" font-size="12" font-weight="800" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">ledge ' + a + ' → ' + b + '</text>'; });
/* plot lines + names, the gate, the boat */
for (let py = 4; py < 7; py++) for (let px = 0; px < 3; px++) { const p = I.plot[px + ':' + py]; g += '<rect x="' + X(px * 12) + '" y="' + Y(py * 12) + '" width="' + 12 * S + '" height="' + 12 * S + '" fill="none" stroke="' + (p && p.d === 'B' ? '#fff' : 'rgba(255,255,255,0.4)') + '" stroke-width="' + (p && p.d === 'B' ? 3 : 1.5) + '" stroke-dasharray="' + (p && p.d === 'B' ? '' : '8 6') + '"/>';
    const nm = p ? p.name + (p.d === 'B' ? '' : ' (the City, level ' + p.level + ')') : 'KATANA BAY (water)'; g += '<text x="' + (X(px * 12) + 8) + '" y="' + (Y(py * 12) + 18) + '" font-size="13" font-weight="800" fill="#fff" stroke="#000" stroke-width="3.5" paint-order="stroke">' + esc(nm) + '</text>'; }
const label = (x, y, t, a) => { g += '<text x="' + x + '" y="' + y + '" font-size="12.5" font-weight="700" text-anchor="' + (a || 'middle') + '" fill="#fff" stroke="#000" stroke-width="3.2" paint-order="stroke">' + esc(t) + '</text>'; };
g += '<rect x="' + (X(16) + 6) + '" y="' + (Y(78) + 8) + '" width="12" height="' + (S - 16) + '" fill="#d13b2a" stroke="#000"/><rect x="' + (X(19) - 18) + '" y="' + (Y(78) + 8) + '" width="12" height="' + (S - 16) + '" fill="#d13b2a" stroke="#000"/><rect x="' + (X(16) - 4) + '" y="' + (Y(78) + 2) + '" width="' + (3 * S + 8) + '" height="7" fill="#d13b2a" stroke="#000"/>';
label(X(17.5), Y(80) + 2, 'THE GREAT GATE (stands in the water; the boat sails through)'); label(X(18), Y(67) + 16, 'the pier: the boat lands here'); label(X(18), Y(55) + 20, 'THE LANDING SQUARE'); label(X(18), Y(56) + 20, 'open and level on purpose, 10 x 8 squares (a fight fits)');
label(X(10.5), Y(61) + 20, 'the slip'); label(X(29.5), Y(79), 'THE FISHING BEACH: open sand, boats pulled up, drying racks'); label(X(8.5), Y(82) + 22, 'a small beach under the ledge', 'start');
label(X(14), Y(69) + 44, 'piers', 'middle'); label(X(21.5), Y(64) + 14, 'pier'); label(X(21.5), Y(70) + 14, 'pier');
g += '<path d="M ' + X(18) + ' ' + Y(84) + ' L ' + X(18) + ' ' + Y(67) + '" stroke="#fff" stroke-width="2.5" stroke-dasharray="8 6" fill="none"/>';
/* legend */
let ly = OY + 4; const T = (t, sz, w, col) => { g += '<text x="' + LX + '" y="' + ly + '" font-size="' + (sz || 13) + '" font-weight="' + (w || 400) + '" fill="' + (col || '#e8eef2') + '">' + esc(t) + '</text>'; ly += (sz || 13) + 7; };
T('HOW TO READ IT', 15, 800); T('One cell = one 3.5 m battle square.'); T('The small number in a cell = its level (1 level = 1.75 m).'); T('0 = sand at the sea. 1 = the stone quay, 1.75 m up.'); ly += 6;
[['quay', 'stone quay'], ['square', 'the open square'], ['deck', 'a timber pier over the water'], ['sand', 'sand'], ['rock', 'rock (the head)'], ['water', 'water']].forEach(r => { g += '<rect x="' + LX + '" y="' + (ly - 12) + '" width="16" height="14" fill="' + COL[r[0]] + '" stroke="#000"/><text x="' + (LX + 24) + '" y="' + ly + '" font-size="13" fill="#e8eef2">' + r[1] + '</text>'; ly += 20; });
[[3, 'the main way (the Mountain Road), 3 squares'], [2, 'a lane, 2 squares'], [1, 'a thin trail, 1 square']].forEach(r => { g += '<rect x="' + LX + '" y="' + (ly - 12) + '" width="16" height="14" fill="' + WCOL[r[0]] + '" stroke="#000"/><text x="' + (LX + 24) + '" y="' + ly + '" font-size="13" fill="#e8eef2">' + r[1] + '</text>'; ly += 20; });
g += '<rect x="' + LX + '" y="' + (ly - 12) + '" width="16" height="14" fill="#3b4652" stroke="#fff" stroke-width="2"/><rect x="' + (LX + 4) + '" y="' + (ly - 1) + '" width="8" height="4" fill="#ffb03b"/><text x="' + (LX + 24) + '" y="' + ly + '" font-size="13" fill="#e8eef2">a walk-in building; orange = its door</text>'; ly += 20;
g += '<line x1="' + LX + '" y1="' + (ly - 5) + '" x2="' + (LX + 16) + '" y2="' + (ly - 5) + '" stroke="#fff" stroke-width="6"/><text x="' + (LX + 24) + '" y="' + ly + '" font-size="13" fill="#e8eef2">a ledge: you fall the way of the arrow</text>'; ly += 28;
T('THE BUILDINGS (inside = the same squares as outside)', 15, 800);
BUILD.forEach(b => { const w = b[3] - b[1] + 1, h = b[4] - b[2] + 1; g += '<text x="' + LX + '" y="' + ly + '" font-size="13" font-weight="800" fill="#fff">' + b[0] + '  ' + esc(b[5]) + '</text><text x="' + (LX + 250) + '" y="' + ly + '" font-size="12" fill="#ffd27a">' + w + ' x ' + h + ' squares = ' + (w * 3.5) + ' x ' + (h * 3.5) + ' m</text>'; ly += 17;
    const words = b[6].split(' '); let line = ''; words.forEach(wd => { if ((line + ' ' + wd).length > 64) { g += '<text x="' + (LX + 18) + '" y="' + ly + '" font-size="11.5" fill="#b9c7d0">' + esc(line) + '</text>'; ly += 15; line = wd; } else line = line ? line + ' ' + wd : wd; }); g += '<text x="' + (LX + 18) + '" y="' + ly + '" font-size="11.5" fill="#b9c7d0">' + esc(line) + '</text>'; ly += 21; });
ly += 4; T('WHAT THE SAMPLE SHOWS', 15, 800);
['The main way leaves the pier, crosses the open square, turns', 'twice and climbs the Harbour Gate stair into the City.', 'Two ledges drop into the bay from the City above (6 to 1', 'behind the market, 3 to 1 into the rice store’s yard).', 'The head: a thin trail climbs it in right-angle legs to the', 'lantern tower; a ledge drops you to the small beach.', 'Level on purpose: the square, both quays, the beach.', 'Faded plots at the top belong to the City, not to this sample.'].forEach(t => T(t, 12.5));
ly += 6; T('A PROPOSAL. NOTHING IS BUILT.', 13, 800, '#ffd27a');
const TW = LX + 460, TH = OY + CH * S + 30;
const head = '<text x="30" y="34" font-size="22" font-weight="800" fill="#fff">KATANA BAY, square by square: the sample district (5 plots + the bay’s water)</text><text x="30" y="56" font-size="13" fill="#b9c7d0">How ways, ledges, open places and buildings sit on the battle grid. North is up. The boat comes in from the south.</text>';
fs.writeFileSync(path.join(__dirname, 'bay-plan.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="' + TW + '" height="' + TH + '" viewBox="0 0 ' + TW + ' ' + TH + '" font-family="Helvetica, Arial, sans-serif">' + g + head + '</svg>');
console.log('bay-plan.svg ' + TW + ' x ' + TH);
