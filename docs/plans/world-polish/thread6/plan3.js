/* THREAD 6, THE WOODS: PLAN 3 of the Clearing's room, SQUARE BY SQUARE (a proposal; nothing is built from it until mondo OKs it).
   `node docs/plans/world-polish/thread6/plan3.js` checks the plan and writes plan3.svg (+ plan3-west.svg, plan3-east.svg) beside it.
   The grid is the room's own: 144 x 60 squares of 3.5 m, 12 x 5 plots of 12 squares, box plot 0,0 = world plot -17,0.
   Every way is whole squares: straight legs along the grid, right-angle turns. A main trail is 3 squares wide, a thin trail 1, the dry bed 2.
   A level is 1.75 m. A RAMP climbs one level over two squares. A LEDGE is two open squares side by side one level (or more) apart:
   the walker drops off it and cannot climb it (three-renderer.js HQ_STEP_TOL 0.62 m, jump apex 1.46 m, terrain rooms drop any height). */
'use strict';
const fs = require('fs'), path = require('path');
const W = 144, H = 60, N = 12;
/* the plots: [box x, box y, name, district, level today (null = new), level planned] */
const PLOTS = [
    [1, 0, 'The trail north', 'L', 1, 2], [3, 0, 'The Stair', 'C', 2, 2], [6, 0, 'The Rocks', 'M', 0, 5],
    [0, 1, 'Deep woods, west', 'C', 1, 1], [1, 1, 'The Trail West', 'C', 2, 3], [2, 1, 'The Old Tree', 'C', 2, 5], [3, 1, 'The Crossroads', 'C', 2, 3], [4, 1, 'Deep woods, east', 'C', 1, 4],
    [5, 1, 'The Culvert', 'M', 1, 4], [6, 1, 'The Dry Creek, upper', 'M', 1, 3], [7, 1, 'The Dry Creek, lower', 'M', 0, 2], [8, 1, 'The Hollow', 'M', 0, 1], [9, 1, 'The Gully', 'M', 0, 0],
    [10, 1, 'The Sewer Mouth', 'M', 0, 0], [11, 1, 'The Storm Drain', 'M', 0, 0],
    [3, 2, 'The Campfire', 'C', 1, 2], [10, 2, 'The Tunnel Way', 'M', 0, 0], [3, 3, 'Deep woods, south', 'C', 1, 1], [3, 4, 'The Fence Line', 'C', 0, 0],
    [2, 0, 'The North Rise', 'C', null, 4], [4, 0, 'The Climb', 'C', null, 5], [5, 0, 'The Top', 'M', null, 6], [7, 0, 'The Scree', 'M', null, 4],
    [1, 2, 'The Burned House', 'C', null, 2], [2, 2, 'The Stick Men', 'C', null, 3], [4, 2, 'Under the Bluff', 'C', null, 2], [4, 3, 'The Dead End', 'C', null, 1],
    [7, 2, 'The Bank', 'M', null, 3], [8, 2, 'The Low Ground', 'M', null, 1], [10, 0, 'The Fenced Yard', 'M', null, 0]];
const T = [], L = [], RAMP = {}, LABELS = [], ERR = [];
for (let y = 0; y < H; y++) { T.push(new Array(W).fill('.')); L.push(new Array(W).fill(0)); }
PLOTS.forEach(p => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { T[p[1] * N + y][p[0] * N + x] = ' '; L[p[1] * N + y][p[0] * N + x] = p[5]; } });
const inRoom = (x, y) => x >= 0 && y >= 0 && x < W && y < H && T[y][x] !== '.';
const OPEN = 'pqgdcPQDkm', isOpen = (x, y) => inRoom(x, y) && OPEN.indexOf(T[y][x]) >= 0;
function set(x, y, t, l, keep) { if (y < 0 || y >= H || x < 0 || x >= W) return; if (!inRoom(x, y)) { ERR.push('off the plots: ' + x + ',' + y + ' (' + t + ')'); return; }
    if (keep && keep.indexOf(T[y][x]) >= 0) { if (l != null && Math.abs(L[y][x] - l) > 0.01 && !RAMP[x + ',' + y]) ERR.push('level clash at ' + x + ',' + y + ': ' + T[y][x] + ' ' + L[y][x] + ' vs ' + t + ' ' + l); return; }
    T[y][x] = t; if (l != null) L[y][x] = l; delete RAMP[x + ',' + y]; }
const area = (x0, y0, x1, y1, t, l) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t, l); };
const label = (x, y, text, kind) => LABELS.push([x, y, text, kind || 'place']);
/* a way: pts = [x, y, level]; legs are axis-aligned and at most 8 squares; a level change of 1 = a ramp of two squares in the leg's middle */
function way(pts, wd, t, tr) { const off = wd === 3 ? [-1, 0, 1] : wd === 2 ? [0, 1] : [0];
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]), n = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
        if (dx && dy) { ERR.push('a diagonal leg: ' + a + ' -> ' + b); continue; }
        if (i > 1) { const z = pts[i - 2]; if (Math.sign(a[0] - z[0]) === dx && Math.sign(a[1] - z[1]) === dy) ERR.push('two legs in one line (no turn): ' + z + ' -> ' + a + ' -> ' + b); }
        if (n > 8) ERR.push('a leg over 8 squares (' + n + '): ' + a + ' -> ' + b);
        const dl = b[2] - a[2], steps = Math.abs(dl); if (steps && n < steps * 2 + (wd === 3 ? 3 : 1)) ERR.push('no room for the ramp: ' + a + ' -> ' + b);
        let r0 = Math.floor((n - steps * 2) / 2); if (wd === 3) r0 = Math.min(Math.max(1, r0), n - 2 - steps * 2);   // ramp squares r0+1 .. r0+2*steps
        for (let k = 0; k <= n; k++) { const x = a[0] + dx * k, y = a[1] + dy * k; let lv, rp = null;
            if (!steps || k <= r0) lv = a[2]; else if (k > r0 + steps * 2) lv = b[2]; else { const j = k - r0; lv = a[2] + Math.sign(dl) * (j - 0.5) / 2; rp = dl > 0 ? [dx, dy] : [-dx, -dy]; }
            const ends = (k === 0 || k === n);
            for (const o of off) for (const o2 of (ends && wd === 3 ? off : [0])) { const X = x + (dx ? (ends ? o2 : 0) : o), Y = y + (dy ? (ends ? o2 : 0) : o), XX = dx ? X : X, YY = dx ? y + o : Y;
                const px = dx ? x + (ends && wd === 3 ? o2 : 0) : x + o, py = dx ? y + o : y + (ends && wd === 3 ? o2 : 0);
                if (rp) { set(px, py, tr, lv); RAMP[px + ',' + py] = rp; } else set(px, py, t, lv, 'gckm' + (t === 'q' ? 'pPd' : '') + (t === 'd' ? 'pP' : '')); } } } }
const main = pts => way(pts, 3, 'p', 'P'), thin = pts => way(pts, 1, 'q', 'Q'), bed = pts => way(pts, 2, 'd', 'D');

/* ───────────── THE CLEARING (district C) ───────────── */
/* THE STAIR (level 2): the landing round the staircase from DOOR HQ, open and level */
area(38, 2, 46, 9, 'g', 2); area(43, 3, 43, 7, 'k', 2); label(43, 2, 'THE STAIR', 'mark');
main([[41, 0, 2], [41, 3, 2]]);
/* up to THE CROSSROADS (level 3): a ramp on the east side; in front of the Stair the terrace's lip is a ledge you hop down */
main([[45, 9, 2], [45, 14, 3]]); area(39, 10, 41, 12, 'g', 3);
area(38, 13, 46, 21, 'g', 3); label(42, 17, 'THE CROSSROADS', 'place'); label(42, 18.2, 'signpost · level, a board fits', 'note');
/* WEST: up the North Rise by a switchback to THE OLD TREE (level 5, the high point of the Clearing) */
main([[38, 14, 3], [34, 14, 3], [34, 8, 4], [28, 8, 4], [28, 13, 5]]); main([[31, 7, 4], [31, 4, 4], [24, 4, 3], [24, 9, 3], [21, 9, 3], [21, 13, 3]]);
area(25, 14, 31, 20, 'g', 5); area(28, 17, 29, 18, 'k', 5); label(28.5, 16.2, 'THE OLD TREE', 'mark');
/* the ledge chain east: Old Tree -> shelf -> the Crossroads (two hops, straight back down) */
area(32, 17, 32, 18, 'g', 4); thin([[33, 17, 3], [37, 17, 3]]); set(33, 18, 'q', 3);
/* the thin short cut from the Stair's landing up to the rise */
thin([[37, 5, 2], [35, 5, 2]]); thin([[35, 5, 2], [35, 2, 3], [32, 2, 4]]);
/* down the west side: THE TRAIL WEST (3), DEEP WOODS WEST (1), the two ways out west */
/* THE RANGER STATION stands where it stood (a walk-in building): its yard is level 3; a shelf west of the knoll is the hop down to it */
area(17, 16, 23, 21, 'g', 3); area(20, 18, 22, 19, 'k', 3); label(21, 17.4, 'RANGER STATION', 'mark'); area(24, 19, 24, 20, 'g', 4);
main([[19, 14, 3], [13, 14, 3]]);
main([[14, 14, 3], [14, 19, 2], [8, 19, 1]]); main([[7, 19, 1], [7, 22, 1]]); main([[8, 19, 1], [4, 19, 1], [4, 14, 1]]);
label(2.5, 17.3, 'wolf den', 'note'); label(8, 16.6, 'stand', 'note');
/* THE TRAIL NORTH (to the Redwood Trail) */
main([[18, 1, 2], [18, 5, 2], [13, 5, 2], [13, 10, 3], [16, 10, 3], [16, 13, 3]]);
/* THE BLAIR WITCH LOOP (thin): Trail West -> the Burned House -> the Stick Men -> the Campfire; a fork climbs back to the Old Tree */
thin([[12, 19, 2], [12, 24, 2], [16, 24, 2], [16, 28, 2]]);
area(13, 29, 19, 34, 'g', 2); area(14, 30, 17, 33, 'k', 2); label(15.5, 31.5, 'THE BURNED HOUSE', 'mark'); label(15.5, 32.8, 'a ruin you walk into', 'note');
thin([[20, 32, 2], [23, 32, 2], [23, 28, 3], [27, 28, 3], [27, 32, 3], [31, 32, 3], [31, 30, 3]]);
area(29, 26, 33, 29, 'g', 3); label(31.5, 27.3, 'THE STICK MEN', 'mark'); label(31.5, 28.5, 'figures hung in the trees', 'note');
thin([[27, 28, 3], [27, 25, 3], [29, 25, 3]].slice(0, 2)); thin([[27, 25, 3], [29, 25, 3]]);
thin([[34, 28, 3], [37, 28, 2]]);
/* a dead-end stub with a stone pile (you turn back at the pile; fair, short) */
thin([[23, 32, 2], [23, 34, 2], [27, 34, 2]]); label(27, 35, 'stone pile', 'note');
/* the Old Tree's south ledges: knoll -> shelf -> the Stick Men's trail (a loop that returns you to the landmark) */
area(28, 21, 29, 22, 'g', 4); thin([[28, 23, 3], [28, 24, 3]]); set(28, 25, 'q', 3);
/* SOUTH: THE CAMPFIRE (2), open and level */
main([[39, 21, 3], [39, 24, 3], [44, 24, 3], [44, 29, 2]]); area(38, 28, 46, 34, 'g', 2); label(42, 31, 'THE CAMPFIRE', 'place'); label(42, 32.2, 'level, a board fits', 'note');
area(38, 26, 40, 27, 'g', 3);
/* east under the bluff, round by the Dead End, back west: the way UP from the Estate; the ledge by the Campfire is the way DOWN */
main([[46, 31, 2], [52, 31, 2], [52, 36, 1], [57, 36, 1], [57, 41, 1], [51, 41, 1], [51, 45, 1], [45, 45, 1], [45, 50, 0], [42, 50, 0], [42, 58, 0]]);
area(54, 28, 58, 32, 'g', 2); area(55, 29, 57, 30, 'k', 2); label(56, 28.6, 'pump shed + tank', 'note'); label(56, 31.8, 'rust, chain-link', 'note');
for (let x = 48; x <= 59; x++) set(x, 24, 'r', 4); label(54, 24.5, 'THE BLUFF (a rock face, 2 levels)', 'note');
area(53, 43, 59, 45, 'c', 1); label(56, 46.2, 'a road that just ends', 'note');
area(37, 37, 42, 42, 'g', 1); label(39.5, 39.5, 'the quiet glade', 'note'); area(39, 35, 41, 36, 'g', 1 + 0);
thin([[43, 42, 1], [43, 45, 1]]);
/* THE FENCE LINE (0): chain-link across, one gate */
label(42, 58.4, 'the gate (stands today)', 'note');
/* the hollow tree (the door `forest` stays on its square) */
thin([[47, 20, 3], [49, 20, 3], [49, 23, 3]]); label(51.5, 21.6, 'hollow tree', 'door');

/* ───────────── EAST: DEEP WOODS EAST, THE CLIMB, THE TOP ───────────── */
main([[46, 16, 3], [52, 16, 4], [52, 10, 5], [57, 10, 5], [57, 4, 6], [62, 4, 6]]);
area(62, 2, 69, 9, 'g', 6); area(65, 3, 66, 4, 'k', 6); label(65.5, 5.6, 'THE TOP', 'mark'); label(65.5, 6.8, 'fire lookout · level, a board fits', 'note');
/* the ledges straight back down from the Top: 6 -> 5 -> 4 */
area(53, 3, 55, 5, 'g', 6); area(53, 6, 54, 8, 'g', 6); area(55, 12, 56, 13, 'g', 5); area(54, 14, 58, 17, 'g', 4); label(56, 16, 'glade', 'note');
/* ───────────── DEAD MAN'S CAVE (district M): down into the creek's valley ───────────── */
main([[63, 9, 6], [63, 14, 5], [68, 14, 5], [68, 19, 4], [74, 19, 4], [74, 13, 5], [77, 13, 5], [77, 9, 5]]);
for (let y = 13; y <= 17; y++) set(71, y, 'w', 4); label(71, 12.6, 'spring', 'note'); label(71, 20.6, 'CULVERT', 'note');
for (let x = 66; x <= 71; x++) set(x, 11, 'r', 6); set(71, 12, 'r', 6);
/* THE ROCKS (5): the crag and the cave mouth, an open shelf */
area(73, 3, 80, 8, 'g', 5); area(74, 1, 79, 2, 'r', 7); set(76, 2, 'k', 5); set(77, 2, 'k', 5); label(76.5, 1.2, 'THE CRAG', 'mark'); label(76.5, 3.6, 'cave mouth', 'door'); label(76.5, 6, 'fire ring · level', 'note');
/* the ridge trail (thin): the Top -> the Rocks */
thin([[70, 5, 6], [72, 5, 5]].slice(0, 1)); set(70, 5, 'q', 6); set(71, 5, 'Q', 5.75); RAMP['71,5'] = [-1, 0]; set(72, 5, 'Q', 5.25); RAMP['72,5'] = [-1, 0];
/* THE SCREE (4 -> 3): a switchback with its ledge, then down to THE DRY CREEK, LOWER (2) and up THE BANK (3) */
main([[80, 7, 5], [86, 7, 4], [86, 3, 4], [92, 3, 4], [92, 10, 3], [88, 10, 3], [88, 16, 2], [94, 16, 2], [94, 22, 2], [89, 22, 2], [89, 28, 3], [95, 28, 3], [95, 33, 2], [102, 33, 1], [102, 26, 1], [99, 26, 1], [99, 23, 1]]);
/* THE DRY BED (2 squares, dirt): the fast way DOWN. Each dry fall is a ledge: you hop down it and cannot climb it */
bed([[71, 21, 3], [78, 21, 3], [78, 17, 3], [83, 17, 3]]); bed([[84, 17, 2], [84, 20, 2], [87, 20, 2]]); bed([[96, 20, 1], [96, 20, 1]]);
label(83.9, 16.2, 'dry fall', 'note'); label(96, 19.2, 'dry fall', 'note');
area(85, 27, 87, 31, 'g', 3); label(86, 29.4, 'tent site', 'note');
area(104, 26, 106, 31, 'm', 1); label(101, 35.2, 'THE LOW GROUND: mud, dead trees, drain pipes (no pool)', 'note');
area(97, 14, 105, 22, 'g', 1); label(101, 17.6, 'THE HOLLOW', 'place'); label(101, 18.8, 'rowboat, swing · level, a board fits', 'note');
/* THE GULLY (0): the trail fords the flat bed, the cabin, the dump yard; then the bed ramps down into THE RAVINE (2 levels under its rims) */
main([[105, 15, 1], [113, 15, 0], [113, 22, 0], [121, 22, 0], [121, 27, 0], [125, 27, 0], [125, 34, 0]]);
main([[118, 21, 0], [118, 15, 0], [125, 15, 0], [125, 9, 0], [130, 9, 0], [130, 15, 0], [136, 15, 0]]);
set(106, 18, 'D', 0.75); set(106, 19, 'D', 0.75); set(107, 18, 'D', 0.25); set(107, 19, 'D', 0.25); ['106,18', '106,19', '107,18', '107,19'].forEach(k => { RAMP[k] = [-1, 0]; });
area(108, 18, 111, 19, 'd', 0);
for (let k = 0; k < 4; k++) for (const y of [18, 19]) { set(115 + k, y, 'D', -0.25 - k * 0.5); RAMP[(115 + k) + ',' + y] = [-1, 0]; }
area(119, 18, 127, 19, 'd', -2); area(128, 18, 130, 19, 'c', -2);
label(118, 18.6, 'BRIDGE', 'note'); label(124.5, 18.6, 'THE RAVINE (2 levels down)', 'note'); label(113, 18.6, 'ford', 'note');
thin([[123, 17, 0], [130, 17, 0]]); thin([[122, 20, 0], [129, 20, 0]]);
set(131, 18, 'k', -2); set(131, 19, 'k', -2); label(129, 21.4, 'THE SEWER MOUTH', 'mark');
area(114 + 1, 12, 116, 13, 'g', 0); area(112, 12, 114, 13, 'k', 0); label(113, 12.6, 'THE CABIN', 'mark');
area(108, 21, 111, 23, 'g', 0); label(109.5, 22.1, 'dump yard', 'note');
thin([[127, 32, 0], [130, 32, 0], [130, 33, 0]]); label(131, 33.6, 'hidden mouth', 'door');
/* THE FENCED YARD (new, 0) and THE STORM DRAIN (0): chain-link, a locked shed; the concrete apron, the gutter up to Disaster City */
area(123, 2, 129, 5, 'c', 0); area(125, 2, 127, 3, 'k', 0); thin([[125, 6, 0], [125, 7, 0]]); label(126, 4.6, 'fenced yard: chain-link, a locked shed', 'note');
area(134, 12, 141, 19, 'c', 0); label(137.5, 13.4, 'THE STORM DRAIN', 'place'); label(137.5, 18.6, 'concrete, level, a board fits', 'note');
main([[140, 16, 0], [142, 16, 0]]);

/* the ways out of the room (their squares keep today's height) */
const DOORS = [[41, 0, 'N', 'the Old Road'], [18, 0, 'N', 'the Redwood Trail'], [3, 12, 'N', 'Came A Lot'], [7, 23, 'S', 'the Ritual Ground'], [42, 59, 'S', 'The Estate'], [143, 16, 'E', 'Disaster City'], [125, 35, 'S', 'the Valley Road']];
[[3, 12, 1], [7, 23, 1], [42, 59, 0], [143, 16, 0], [125, 35, 0], [18, 0, 2]].forEach(q => set(q[0], q[1], 'p', q[2], 'pg'));

/* ───────────── THE CHECKS ───────────── */
const BRIDGE = { '117,17': [117, 20], '118,17': [118, 20], '119,17': [119, 20], '117,20': [117, 17], '118,20': [118, 17], '119,20': [119, 17] };
[117, 118].forEach(x => [18, 19].forEach(y => { T[y][x] = 'D'; L[y][x] = -0.25 - (x - 115) * 0.5; RAMP[x + ',' + y] = [-1, 0]; })); [18, 19].forEach(y => { T[y][119] = 'd'; L[y][119] = -2; delete RAMP['119,' + y]; });
const key = (x, y) => x + ',' + y, D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const LEDGES = [];   // [x, y, dx, dy, drop]: from the high square x,y toward dx,dy
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!isOpen(x, y)) continue;
    for (const [dx, dy] of D4) { const X = x + dx, Y = y + dy; if (!isOpen(X, Y)) continue; const d = L[y][x] - L[Y][X];
        if (d > 0.6 && !(x >= 117 && x <= 119 && (y === 17 || y === 20) && dx === 0)) { LEDGES.push([x, y, dx, dy, d]); if ((RAMP[key(x, y)] || RAMP[key(X, Y)]) ) ERR.push('a ramp beside open ground at another height: ' + x + ',' + y + ' / ' + X + ',' + Y); } } }
function reach(sx, sy, drops) { const seen = new Set([key(sx, sy)]), q = [[sx, sy]];
    for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; const br = BRIDGE[key(x, y)]; if (br && !seen.has(key(br[0], br[1]))) { seen.add(key(br[0], br[1])); q.push(br); } for (const [dx, dy] of D4) { const X = x + dx, Y = y + dy; if (!isOpen(X, Y) || seen.has(key(X, Y))) continue; const up = L[Y][X] - L[y][x];
        if (up > 0.6) continue; if (up < -0.6 && !drops) continue; seen.add(key(X, Y)); q.push([X, Y]); } } return seen; }
const noDrop = reach(43, 8, false); let openN = 0, lost = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isOpen(x, y)) { openN++; if (!noDrop.has(key(x, y))) lost.push(key(x, y)); }
DOORS.forEach(d => { if (!noDrop.has(key(d[0], d[1]))) ERR.push('the way out to ' + d[3] + ' is not reached on foot from the Stair'); });
/* a square reached only by a drop must still walk out (no trap): every open square reaches the Stair with drops allowed */
const trap = lost.filter(k => { const [x, y] = k.split(',').map(Number); return !reach(x, y, true).has(key(43, 8)); });
if (trap.length) ERR.push('a trap (no way back to the Stair): ' + trap.slice(0, 12).join(' '));
const upOnly = lost.filter(k => trap.indexOf(k) < 0);
if (require.main === module) console.log('open squares', openN, '· ledge edges', LEDGES.length, '· squares reached only by a hop down (they walk out again):', upOnly.length, upOnly.slice(0, 30).join(' '));
if (ERR.length) console.log('PROBLEMS:\n  ' + ERR.join('\n  ')); else if (require.main === module) console.log('checks: ok (every leg on the grid and 8 squares or less, every way out walked both ways with no ledge, no trap)');
if (process.argv.includes('--ascii')) console.log(T.map((r, y) => r.map((c, x) => c).join('')).join('\n'));

/* ───────────── THE PICTURE ───────────── */
function draw(file, x0, x1, S, title, y1) { y1 = y1 == null ? H - 1 : y1; const PAD = 14, TOP = 54, y0 = 0, cw = (x1 - x0 + 1) * S, ch = (y1 - y0 + 1) * S, WT = cw + PAD * 2, legendH = 150, HT = TOP + ch + legendH;
    const px = x => PAD + (x - x0) * S, py = y => TOP + (y - y0) * S, esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const tint = (l, a, b) => { const t = Math.max(0, Math.min(1, (l + 2) / 9)); return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')'; };
    const fill = (t, l) => t === ' ' ? tint(l, [10, 26, 18], [52, 84, 50]) : t === 'p' || t === 'P' ? tint(l, [92, 58, 28], [214, 160, 96]) : t === 'q' || t === 'Q' ? tint(l, [150, 120, 20], [255, 232, 90])
        : t === 'g' ? tint(l, [58, 104, 52], [176, 222, 128]) : t === 'd' || t === 'D' ? tint(l, [96, 84, 74], [200, 186, 160]) : t === 'c' ? tint(l, [110, 112, 116], [190, 192, 196]) : t === 'm' ? '#4a4032'
        : t === 'r' ? '#6d6f73' : t === 'w' ? '#3b83c9' : t === 'k' ? '#b0362c' : t === 'f' ? '#9aa0a6' : '#16191a';
    let s = '';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = T[y][x]; if (t === '.') continue;
        s += '<rect x="' + px(x) + '" y="' + py(y) + '" width="' + S + '" height="' + S + '" fill="' + fill(t, L[y][x]) + '" stroke="#000" stroke-opacity="0.28" stroke-width="0.6"/>';
        const rp = RAMP[key(x, y)]; if (rp) { const cx = px(x) + S / 2, cy = py(y) + S / 2, a = S * 0.32; s += '<polygon points="' + [[cx + rp[0] * a, cy + rp[1] * a], [cx - rp[0] * a + rp[1] * a, cy - rp[1] * a + rp[0] * a], [cx - rp[0] * a - rp[1] * a, cy - rp[1] * a - rp[0] * a]].map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + '" fill="#111" fill-opacity="0.75"/>'; }
        else if (OPEN.indexOf(t) >= 0 && S >= 15) s += '<text x="' + (px(x) + S / 2) + '" y="' + (py(y) + S / 2 + S * 0.17) + '" font-size="' + (S * 0.46).toFixed(1) + '" text-anchor="middle" fill="#000" fill-opacity="0.62">' + L[y][x] + '</text>'; }
    /* the ledges: a white bar on the line between the two squares, a tick pointing down */
    LEDGES.forEach(q => { const [x, y, dx, dy] = q; if (x < x0 || x > x1 || y > y1) return; const cx = px(x) + S / 2 + dx * S / 2, cy = py(y) + S / 2 + dy * S / 2, hx = dy ? S / 2 : 0, hy = dx ? S / 2 : 0;
        s += '<line x1="' + (cx - hx) + '" y1="' + (cy - hy) + '" x2="' + (cx + hx) + '" y2="' + (cy + hy) + '" stroke="#fff" stroke-width="' + Math.max(2.2, S * 0.16) + '"/>';
        s += '<polygon points="' + [[cx + dx * S * 0.42, cy + dy * S * 0.42], [cx + dx * S * 0.1 + dy * S * 0.2, cy + dy * S * 0.1 + dx * S * 0.2], [cx + dx * S * 0.1 - dy * S * 0.2, cy + dy * S * 0.1 - dx * S * 0.2]].map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '" fill="#fff"/>'; });
    if (x0 <= 117 && x1 >= 119) s += '<rect x="' + px(117) + '" y="' + (py(18) - 2) + '" width="' + S * 3 + '" height="' + (S * 2 + 4) + '" fill="#b98a52" stroke="#3a2410" stroke-width="2"/>';
    /* the plots: a line round each, its name and level */
    PLOTS.forEach(p => { const X = p[0] * N, Y = p[1] * N; if (X + N - 1 < x0 || X > x1 || Y > y1) return; const c = p[4] == null ? '#ff5a5a' : p[3] === 'M' ? '#6fb7ff' : p[3] === 'L' ? '#bbb' : '#f2c14e';
        s += '<rect x="' + (px(X) + 1) + '" y="' + (py(Y) + 1) + '" width="' + (N * S - 2) + '" height="' + (N * S - 2) + '" fill="none" stroke="' + c + '" stroke-width="2"' + (p[4] == null ? ' stroke-dasharray="8 5"' : '') + '/>';
        s += '<text x="' + (px(X) + 5) + '" y="' + (py(Y) + N * S - 6) + '" font-size="' + Math.max(9, S * 0.62).toFixed(1) + '" font-weight="700" fill="#fff" stroke="#000" stroke-width="2.6" paint-order="stroke">' + esc(p[2]) + ' · ' + (p[4] == null ? 'new' : 'was ' + p[4]) + ' → ' + p[5] + '</text>'; });
    DOORS.forEach(d => { if (d[0] < x0 || d[0] > x1 || d[1] > y1) return; const cx = px(d[0]) + S / 2, cy = py(d[1]) + S / 2, o = d[2] === 'N' ? [0, -1] : d[2] === 'S' ? [0, 1] : [1, 0];
        s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (S * 0.42) + '" fill="#ff8a00" stroke="#fff" stroke-width="1.5"/>';
        s += '<text x="' + (cx + (o[0] ? -6 : 0) + (d[0] < x0 + 6 ? 4 : 0)) + '" y="' + (cy + (o[1] < 0 ? -S * 0.75 : o[1] > 0 ? S * 1.25 : -S * 0.8)) + '" font-size="' + Math.max(10, S * 0.7) + '" font-weight="700" text-anchor="' + (o[0] ? 'end' : d[0] < x0 + 8 ? 'start' : 'middle') + '" fill="#ffb347" stroke="#000" stroke-width="2.6" paint-order="stroke">to ' + esc(d[3]) + '</text>'; });
    LABELS.forEach(q => { if (q[0] < x0 - 2 || q[0] > x1 + 2 || q[1] > y1 + 1) return; const big = q[3] === 'mark' || q[3] === 'place', fs2 = big ? Math.max(10, S * 0.74) : Math.max(8.5, S * 0.56);
        s += '<text x="' + (px(q[0]) + S / 2) + '" y="' + (py(q[1]) + S * 0.5) + '" font-size="' + fs2.toFixed(1) + '"' + (big ? ' font-weight="700"' : '') + ' text-anchor="middle" fill="' + (q[3] === 'mark' ? '#ff6b6b' : q[3] === 'door' ? '#ffb347' : '#fff') + '" stroke="#000" stroke-width="2.4" paint-order="stroke">' + esc(q[2]) + '</text>'; });
    const sw = (x, c, t, y) => '<rect x="' + x + '" y="' + (y - 11) + '" width="14" height="14" fill="' + c + '" stroke="#000"/><text x="' + (x + 19) + '" y="' + y + '" font-size="12.5" fill="#ddd">' + esc(t) + '</text>';
    const ly = TOP + ch + 24; let lg = '';
    [[['#b98a52', 'MAIN TRAIL, 3 squares wide'], ['#f2d94a', 'THIN TRAIL, 1 square'], ['#b9ab94', 'THE DRY BED, 2 squares (the fast way down)'], ['#8fc66c', 'open, level clearing'], ['#22402c', 'forest mass (a wall of trees)']],
     [['#6d6f73', 'rock face'], ['#b0362c', 'a building / a big landmark'], ['#a8aaae', 'concrete'], ['#4a4032', 'mud'], ['#3b83c9', 'water'], ['#9aa0a6', 'chain-link']]].forEach((row, r) => { let x = PAD; row.forEach(q => { lg += sw(x, q[0], q[1], ly + r * 22); x += 34 + q[1].length * 7.1; }); });
    const lines = ['Every box is one 3.5 m battle square. The number in a square is its LEVEL (1 level = 1.75 m); lighter = higher. A black triangle = a RAMP square, pointing uphill (one level over two squares).',
        'A WHITE BAR with a tooth = a LEDGE: you hop DOWN across it (the tooth points down) and cannot climb back. That is how the walk works today: no new rule.',
        'Plot lines: yellow = The Clearing, blue = Dead Man\'s Cave, red dashes = a new plot (11). Orange dots = the ways out of the room; their squares keep today\'s height. Nothing is built yet.'];
    lines.forEach((t, i) => { lg += '<text x="' + PAD + '" y="' + (ly + 52 + i * 19) + '" font-size="13" fill="#ddd">' + esc(t) + '</text>'; });
    fs.writeFileSync(path.join(__dirname, file), '<svg xmlns="http://www.w3.org/2000/svg" width="' + WT + '" height="' + HT + '" font-family="Helvetica,Arial,sans-serif"><rect width="100%" height="100%" fill="#16191a"/><text x="' + PAD + '" y="24" font-size="18" font-weight="700" fill="#eee">' + esc(title) + '</text><text x="' + PAD + '" y="44" font-size="12.5" fill="#bbb">north is up · one plot = 12 x 12 squares = 42 m</text>' + s + lg + '</svg>');
    return [WT, HT]; }
module.exports = { W, H, N, T, L, RAMP, PLOTS, LEDGES, DOORS, isOpen };
if (require.main === module) {
console.log(draw('plan3.svg', 0, 143, 13, 'THE WOODS, the Clearing\'s room, PLAN 3: the whole room, every square (a proposal)'));
console.log(draw('plan3-west.svg', 0, 71, 26, 'PLAN 3, WEST HALF: The Clearing (the pilot) + the climb to the Top'));
console.log(draw('plan3-east.svg', 60, 143, 23, 'PLAN 3, EAST HALF: Dead Man\'s Cave, down the creek to the Storm Drain', 35));
}
