/* THREAD 6, THE WOODS: the height plan picture for mondo (a proposal, nothing built). `node docs/plans/world-polish/thread6/draw-height-plan.js` writes height-plan.svg beside it.
   World plots: x -17..-6, y 0..4 (the Clearing's room). Levels: 1 = 1.75 m. */
'use strict';
const fs = require('fs'), path = require('path');
const TODAY = { '-17,1': ['Deep woods, west', 1, 'C'], '-16,1': ['The Trail West', 2, 'C'], '-15,1': ['The Old Tree', 2, 'C'], '-14,1': ['The Crossroads', 2, 'C'], '-13,1': ['Deep woods, east', 1, 'C'],
    '-14,0': ['The Stair', 2, 'C'], '-14,2': ['The Campfire', 1, 'C'], '-14,3': ['Deep woods, south', 1, 'C'], '-14,4': ['The Fence Line', 0, 'C'], '-16,0': ['The trail north', 2, 'L'],
    '-12,1': ['The Culvert', 1, 'M'], '-11,1': ['The Dry Creek, upper', 1, 'M'], '-11,0': ['The Rocks', 0, 'M'], '-10,1': ['The Dry Creek, lower', 0, 'M'], '-9,1': ['The Hollow', 0, 'M'], '-8,1': ['The Gully', 0, 'M'],
    '-7,1': ['The Sewer Mouth', 0, 'M'], '-7,2': ['The Tunnel Way', 0, 'M'], '-6,1': ['The Storm Drain', 0, 'M'] };
const LV = { '-17,1': 1, '-16,1': 3, '-15,1': 5, '-14,1': 3, '-13,1': 5, '-14,0': 2, '-14,2': 2, '-14,3': 1, '-14,4': 0, '-16,0': 2,
    '-12,1': 3, '-11,1': 2, '-11,0': 4, '-10,1': 1, '-9,1': 0, '-8,1': 0, '-7,1': 0, '-7,2': 0, '-6,1': 0 };
const NEW = { '-13,0': ['The Ridge, west', 5], '-12,0': ['The Ridge, top', 6], '-10,0': ['The Scree', 3],
    '-15,2': ['The Stick Men', 3], '-16,2': ['The Burned House', 2],
    '-13,2': ['The Slope down', 1], '-12,2': ['The Low Ground', 0], '-11,2': ['The Sump', -1], '-10,2': ['The Bank', 0] };
const S = 92, X0 = -17, Y0 = 0, W = 12, H = 5, PADX = 30, col = l => { const t = (l + 1) / 7; const a = [38, 52, 44], b = [214, 204, 150]; return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')'; };
const cx = x => PADX + (x - X0 + 0.5) * S, cy = (y, oy) => oy + (y - Y0 + 0.5) * S;
const esc = s => s.replace(/&/g, '&amp;');
function panel(oy, title, plots, lv, extra) { let o = '<text x="' + PADX + '" y="' + (oy - 14) + '" font-size="19" font-weight="700" fill="#eee">' + esc(title) + '</text>';
    const all = Object.assign({}, plots, extra || {});
    for (const k in all) { const [x, y] = k.split(',').map(Number), isNew = extra && extra[k], l = isNew ? extra[k][1] : lv[k], nm = all[k][0], d = isNew ? 'N' : all[k][2];
        o += '<rect x="' + (cx(x) - S / 2 + 1) + '" y="' + (cy(y, oy) - S / 2 + 1) + '" width="' + (S - 2) + '" height="' + (S - 2) + '" fill="' + col(l) + '" stroke="' + (isNew ? '#ff5a5a' : d === 'M' ? '#6fb7ff' : d === 'L' ? '#aaa' : '#f2c14e') + '" stroke-width="' + (isNew ? 3 : 2) + '"' + (isNew ? ' stroke-dasharray="7 4"' : '') + '/>';
        o += '<text x="' + cx(x) + '" y="' + (cy(y, oy) - 6) + '" font-size="30" font-weight="700" text-anchor="middle" fill="' + (l >= 3 ? '#111' : '#fff') + '">' + l + '</text>';
        const words = nm.split(' '), l1 = words.slice(0, Math.ceil(words.length / 2)).join(' '), l2 = words.slice(Math.ceil(words.length / 2)).join(' ');
        o += '<text x="' + cx(x) + '" y="' + (cy(y, oy) + 16) + '" font-size="11" text-anchor="middle" fill="' + (l >= 3 ? '#111' : '#fff') + '">' + esc(l1) + '</text><text x="' + cx(x) + '" y="' + (cy(y, oy) + 29) + '" font-size="11" text-anchor="middle" fill="' + (l >= 3 ? '#111' : '#fff') + '">' + esc(l2) + '</text>'; }
    return o; }
/* a wavy line through plot middles (+ offsets in plots) */
function way(pts, oy, w, color, dash) { const P = pts.map(p => [cx(p[0]), cy(p[1], oy)]); let d = 'M' + P[0][0] + ' ' + P[0][1];
    for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = -(b[1] - a[1]), ny = b[0] - a[0], n = Math.hypot(nx, ny) || 1, s = (i % 2 ? 1 : -1) * 15;
        d += ' Q' + (mx + nx / n * s) + ' ' + (my + ny / n * s) + ' ' + b[0] + ' ' + b[1]; }
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' opacity="0.95"/>'; }
const mark = (x, y, oy, t) => '<circle cx="' + cx(x) + '" cy="' + (cy(y, oy) - 34) + '" r="6" fill="#ff3b3b" stroke="#fff" stroke-width="1.5"/><text x="' + (cx(x) + 9) + '" y="' + (cy(y, oy) - 30) + '" font-size="10.5" font-weight="700" fill="#fff" stroke="#000" stroke-width="2.4" paint-order="stroke">' + esc(t) + '</text>';
const OY1 = 60, OY2 = OY1 + H * S + 70, HT = OY2 + H * S + 150, WT = PADX * 2 + W * S;
let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + WT + '" height="' + HT + '" font-family="Helvetica,Arial,sans-serif"><rect width="100%" height="100%" fill="#16191a"/>';
svg += panel(OY1, 'TODAY: The Clearing + Dead Man\'s Cave. One row of 12 plots, levels 0 to 2 (3.5 m over 504 m)', TODAY, Object.fromEntries(Object.entries(TODAY).map(e => [e[0], e[1][1]])));
svg += way([[-17, 1], [-16, 1], [-15, 1], [-14, 1], [-13, 1], [-12, 1], [-11, 1], [-10, 1], [-9, 1], [-8, 1], [-7, 1], [-6, 1]], OY1, 7, '#8a5a2b').replace(/ Q[^ ]+ [^ ]+ /g, ' L');
svg += way([[-14, 0], [-14, 1], [-14, 2], [-14, 3], [-14, 4]], OY1, 7, '#8a5a2b').replace(/ Q[^ ]+ [^ ]+ /g, ' L');
svg += panel(OY2, 'PROPOSED: 9 new plots (red dashes), levels -1 to 6 (12 m). Brown = main trail, 3 squares. Yellow = thin trails, 1 square.', TODAY, LV, NEW);
svg += way([[-14, 0], [-14, 1], [-13, 1], [-12, 1], [-11, 1], [-10, 1], [-9, 1], [-8, 1], [-7, 1], [-6, 1]], OY2, 7, '#8a5a2b');
svg += way([[-14, 1], [-15, 1], [-16, 1], [-17, 1]], OY2, 7, '#8a5a2b') + way([[-14, 1], [-14, 2], [-14, 3], [-14, 4]], OY2, 7, '#8a5a2b') + way([[-16, 1], [-16, 0]], OY2, 7, '#8a5a2b');
svg += way([[-14, 0], [-13, 0], [-12, 0], [-11, 0], [-11, 1]], OY2, 3, '#ffe14d', '2 5');                  // the ridge trail
svg += way([[-11, 0], [-10, 0], [-9, 1]], OY2, 3, '#ffe14d', '2 5');                                       // the scree down to the Hollow
svg += way([[-14, 2], [-15, 2], [-16, 2], [-16, 1]], OY2, 3, '#ffe14d', '2 5');                            // the loop
svg += way([[-14, 2], [-13, 2], [-12, 2], [-11, 2], [-10, 2], [-10, 1]], OY2, 3, '#ffe14d', '2 5');        // the low ground
svg += way([[-12, 1], [-11.3, 1.25], [-10, 1.3], [-9, 1.25], [-8, 1.3], [-7, 1]], OY2, 3, '#7fd0ff', '2 5'); // in the creek bed
svg += mark(-15, 1, OY2, 'THE OLD TREE on its rise') + mark(-12, 0, OY2, 'the lookout') + mark(-16, 2, OY2, 'the ruin') + mark(-11, 2, OY2, 'the lowest, wettest place') + mark(-8, 1, OY2, 'the cabin') + mark(-6, 1, OY2, 'the drain') + mark(-14, 0, OY2, 'THE STAIR');
const ly = OY2 + H * S + 26;
['Number = the plot\'s level (1 level = 1.75 m). Light = high, dark = low.  Yellow border = The Clearing, blue = Dead Man\'s Cave, red dashes = new plot (names are my ideas, plain on purpose).',
 'The row climbs to the Old Tree, drops to the Crossroads, climbs a ridge, then falls all the way east down the creek to the Storm Drain: walking east is walking DOWN.',
 'Thin trails: the RIDGE (Stair to the Rocks, the only long view) · the LOOP (Campfire, stick men, a ruin, back to the Old Tree) · the LOW GROUND (down into the wet, up to the creek)',
 '· IN THE CREEK BED (blue: under the banks, Culvert to the Sewer Mouth) · the SCREE (Rocks down to the Hollow). Seam plots keep today\'s level. Nothing is built yet.'].forEach((t, i) => { svg += '<text x="' + PADX + '" y="' + (ly + i * 22) + '" font-size="13.5" fill="#ddd">' + esc(t) + '</text>'; });
svg += '</svg>';
fs.writeFileSync(path.join(__dirname, 'height-plan.svg'), svg); console.log('ok', WT, HT);
