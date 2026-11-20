/* THREAD 6, THE WOODS: the height plan picture for mondo, plan 2 (a proposal, nothing built). `node docs/plans/world-polish/thread6/draw-height-plan.js`
   writes height-plan.svg beside it. World plots x -17..-6, y 0..4 (the Clearing's room). 1 level = 1.75 m.
   Plan 2 (mondo 11-20: "It's still fucking straight. Its need to snake and zigzag and climb so when you get to the top you can just jump back down, like
   the routes in Pokemon"): the MAIN trail snakes through all three rows and climbs by switchbacks; LEDGES are one-way jumps back down. */
'use strict';
const fs = require('fs'), path = require('path');
/* [name, level, kind]: C the Clearing, M Dead Man's Cave, L link, N new */
const P = { '-17,1': ['Deep woods, west', 1, 'C'], '-16,1': ['The Trail West', 3, 'C'], '-15,1': ['The Old Tree', 5, 'C'], '-14,1': ['The Crossroads', 3, 'C'], '-13,1': ['Deep woods, east', 4, 'C'],
    '-14,0': ['The Stair', 2, 'C'], '-14,2': ['The Campfire', 2, 'C'], '-14,3': ['Deep woods, south', 1, 'C'], '-14,4': ['The Fence Line', 0, 'C'], '-16,0': ['The trail north', 2, 'L'],
    '-12,1': ['The Culvert', 4, 'M'], '-11,1': ['The Dry Creek, upper', 3, 'M'], '-11,0': ['The Rocks', 4, 'M'], '-10,1': ['The Dry Creek, lower', 2, 'M'], '-9,1': ['The Hollow', 1, 'M'], '-8,1': ['The Gully', 0, 'M'],
    '-7,1': ['The Sewer Mouth', 0, 'M'], '-7,2': ['The Tunnel Way', 0, 'M'], '-6,1': ['The Storm Drain', 0, 'M'],
    '-13,0': ['The Climb', 5, 'N'], '-12,0': ['The Top', 6, 'N'], '-10,0': ['The Scree', 3, 'N'],
    '-15,2': ['The Stick Men', 3, 'N'], '-16,2': ['The Burned House', 2, 'N'],
    '-13,2': ['Under the Ridge', 2, 'N'], '-12,2': ['The Drop', 3, 'N'], '-11,2': ['The Low Ground', 2, 'N'], '-10,2': ['The Bank', 1, 'N'], '-9,2': ['The Sump', -1, 'N'] };
const S = 124, X0 = -17, Y0 = 0, W = 12, H = 5, PADX = 26, OY = 64;
const col = l => { const t = (l + 1) / 7, a = [34, 46, 40], b = [216, 206, 152]; return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')'; };
const cx = x => PADX + (x - X0 + 0.5) * S, cy = y => OY + (y - Y0 + 0.5) * S, esc = s => s.replace(/&/g, '&amp;');
let svg = '';
for (const k in P) { const [x, y] = k.split(',').map(Number), [nm, l, d] = P[k], dark = l < 3;
    svg += '<rect x="' + (cx(x) - S / 2 + 1) + '" y="' + (cy(y) - S / 2 + 1) + '" width="' + (S - 2) + '" height="' + (S - 2) + '" fill="' + col(l) + '" stroke="' + (d === 'N' ? '#ff5a5a' : d === 'M' ? '#6fb7ff' : d === 'L' ? '#aaa' : '#f2c14e') + '" stroke-width="' + (d === 'N' ? 3 : 2) + '"' + (d === 'N' ? ' stroke-dasharray="7 4"' : '') + '/>';
    svg += '<text x="' + (cx(x) - S / 2 + 8) + '" y="' + (cy(y) - S / 2 + 26) + '" font-size="24" font-weight="700" fill="' + (dark ? '#fff' : '#111') + '">' + l + '</text>';
    svg += '<text x="' + cx(x) + '" y="' + (cy(y) + S / 2 - 8) + '" font-size="10.5" text-anchor="middle" fill="' + (dark ? '#fff' : '#111') + '">' + esc(nm) + '</text>'; }
/* a way that ZIGZAGS: between two plot middles it runs in switchback legs (never one straight line across a plot) */
function zig(pts, w, color, dash, amp) { amp = amp == null ? 30 : amp; const Q = [[cx(pts[0][0]), cy(pts[0][1])]]; let flip = 1;
    for (let i = 1; i < pts.length; i++) { const a = [cx(pts[i - 1][0]), cy(pts[i - 1][1])], b = [cx(pts[i][0]), cy(pts[i][1])], dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy), nx = -dy / n, ny = dx / n;
        for (const t of [0.25, 0.5, 0.75]) { Q.push([a[0] + dx * t + nx * amp * flip, a[1] + dy * t + ny * amp * flip]); flip = -flip; }
        Q.push(b); }
    return '<polyline points="' + Q.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>'; }
/* a LEDGE: a one-way jump down from plot a to plot b (white bar on the line between them, an arrow down) */
function ledge(a, b) { const ax = cx(a[0]), ay = cy(a[1]), bx = cx(b[0]), by = cy(b[1]), mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay, n = Math.hypot(dx, dy), ux = dx / n, uy = dy / n, px = -uy, py = ux;
    return '<line x1="' + (mx + px * 26) + '" y1="' + (my + py * 26) + '" x2="' + (mx - px * 26) + '" y2="' + (my - py * 26) + '" stroke="#fff" stroke-width="6"/>' +
        '<polygon points="' + [[mx + ux * 22, my + uy * 22], [mx + ux * 6 + px * 9, my + uy * 6 + py * 9], [mx + ux * 6 - px * 9, my + uy * 6 - py * 9]].map(q => q.join(',')).join(' ') + '" fill="#fff"/>'; }
const mark = (x, y, t) => '<circle cx="' + (cx(x) + S / 2 - 14) + '" cy="' + (cy(y) - S / 2 + 14) + '" r="6" fill="#ff3b3b" stroke="#fff" stroke-width="1.5"/><text x="' + (cx(x) + S / 2 - 24) + '" y="' + (cy(y) - S / 2 + 18) + '" font-size="10.5" font-weight="700" text-anchor="end" fill="#fff" stroke="#000" stroke-width="2.6" paint-order="stroke">' + esc(t) + '</text>';
/* THE MAIN TRAIL (brown, 3 squares): it snakes through all three rows */
const EAST = [[-14, 0], [-14, 1], [-13, 1], [-13, 0], [-12, 0], [-12, 1], [-12, 2], [-11, 2], [-11, 1], [-11, 0], [-10, 0], [-10, 1], [-10, 2], [-9, 2], [-9, 1], [-8, 1], [-7, 1], [-6, 1]];
const WEST = [[-14, 1], [-14, 2], [-15, 2], [-15, 1], [-16, 1], [-17, 1]], SOUTH = [[-14, 2], [-14, 3], [-14, 4]], NORTH = [[-16, 1], [-16, 0]], TUN = [[-7, 1], [-7, 2]];
svg += zig(EAST, 8, '#8a5a2b') + zig(WEST, 8, '#8a5a2b') + zig(SOUTH, 8, '#8a5a2b') + zig(NORTH, 8, '#8a5a2b') + zig(TUN, 8, '#8a5a2b');
/* THIN TRAILS (yellow, 1 square) */
svg += zig([[-15, 2], [-16, 2], [-16, 1]], 3, '#ffe14d', '3 5', 18) + zig([[-14, 2], [-13, 2], [-12, 2]], 3, '#ffe14d', '3 5', 18) + zig([[-9, 2], [-8, 1]], 3, '#ffe14d', '3 5', 14);
/* THE LEDGES: jump down, never up */
[[[-15, 1], [-14, 1]], [[-13, 0], [-13, 1]].reverse().reverse(), [[-12, 0], [-11, 0]], [[-12, 1], [-11, 1]], [[-11, 1], [-10, 1]], [[-10, 1], [-9, 1]], [[-9, 1], [-8, 1]], [[-13, 1], [-13, 2]], [[-12, 2], [-13, 2]], [[-11, 0], [-11, 1]].slice(0, 0).length ? null : null].filter(Boolean).forEach(q => { svg += ledge(q[0], q[1]); });
svg += mark(-15, 1, 'THE OLD TREE') + mark(-12, 0, 'the lookout') + mark(-16, 2, 'the ruin') + mark(-9, 2, 'lowest, wettest') + mark(-8, 1, 'the cabin') + mark(-6, 1, 'the drain') + mark(-14, 0, 'THE STAIR');
const WT = PADX * 2 + W * S, ly = OY + H * S + 30, HT = ly + 150;
const head = '<text x="' + PADX + '" y="34" font-size="20" font-weight="700" fill="#eee">THE WOODS, the Clearing\'s room, PLAN 2: the main trail snakes, climbs by switchbacks, and you jump back down the ledges</text>';
let foot = '';
['The big number = the plot\'s level (1 level = 1.75 m; light = high, dark = low). Yellow border = The Clearing, blue = Dead Man\'s Cave, red dashes = a new plot (10; names are plain ideas).',
 'BROWN = the main trail, 3 squares wide. It never crosses a plot in a straight line: it switchbacks up and down through all three rows, and crosses the dry creek four times.',
 'WHITE BAR + ARROW = a LEDGE: a drop you jump DOWN and cannot climb. Going east (downhill) you hop ledge to ledge along the creek; going back up you take the trail.',
 'YELLOW DOTS = thin trails, 1 square: the Loop past the stick men and the ruin, the way under the ridge, the wet way out of the Sump. The ways out of the room keep their level and door.',
 'Climb from the Stair (2) to the Top (6), then it is down all the way to the Storm Drain (0). West: over the Old Tree\'s rise (5) and jump back down to the Crossroads. Nothing is built yet.'].forEach((t, i) => { foot += '<text x="' + PADX + '" y="' + (ly + i * 23) + '" font-size="14" fill="#ddd">' + esc(t) + '</text>'; });
fs.writeFileSync(path.join(__dirname, 'height-plan.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="' + WT + '" height="' + HT + '" font-family="Helvetica,Arial,sans-serif"><rect width="100%" height="100%" fill="#16191a"/>' + head + svg + foot + '</svg>');
console.log('ok', WT, HT);
