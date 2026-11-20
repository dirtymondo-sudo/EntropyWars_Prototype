/* THE ROOM LAYOUTS: how every plot-built room REALLY stands in the game (not its zone's plan sheet): its size, its place in the world, its
   grid of plots (# = a plot, . = none) and which plot stands in which cell. One World moved many plots: design from THIS, never from a
   district file's home squares.   node docs/plans/world-polish/layouts.js   -> ROOM_LAYOUTS.md */
'use strict';
const fs = require('fs'), path = require('path'), REPO = path.join(__dirname, '..', '..', '..');
const S = require(REPO + '/load-data.js').loadGameData(), H = S.DOOR_HQ, retired = Array.isArray(H.retired) ? H.retired.reduce((m, i) => (m[i] = 1, m), {}) : (H.retired || {});
let out = '# THE ROOM LAYOUTS (written by layouts.js from data.js; do not edit by hand)\n\nHow each room really stands. `#` = a plot (42 m), `.` = no plot. North is up. Under a grid: every plot, as id, name (district). The id `Pcc-rr` is its COLUMN and ROW in this grid\n(P00-00 = top left), which is where it stands in the game, not where the zone plan sheet drew it. `world` = the room\'s place on the One World map, in plots.\n';
Object.keys(H.rooms).filter(i => !retired[i] && H.rooms[i].plots).sort().forEach(id => { const R = H.rooms[id], P = R.plots, sh = R.shell, w = R.world || {};
    const mask = P.mask || [], n = (P.names || []).length;
    out += '\n## ' + id + '\n' + sh.w + ' x ' + sh.d + ' m · ' + (P.nx || '?') + ' x ' + (P.nz || '?') + ' plots, ' + n + ' used · ' + (sh.open === false ? 'roofed' : 'open sky') + (w.wx != null ? ' · world ' + w.wx + ', ' + w.wy + (w.layer ? ' (' + w.layer + ')' : '') : '') + '\n\n```\n' + mask.join('\n') + '\n```\n';
    const ds = {}; (P.names || []).forEach(q => { (ds[q[2]] || (ds[q[2]] = [])).push(q[0] + ' ' + q[1]); });
    if (n <= 40) out += '\n' + (P.names || []).map(q => '`' + q[0] + '` ' + q[1] + ' (' + q[2] + ')').join(' · ') + '\n';
    else out += '\n' + Object.keys(ds).map(d => '**' + d + '** ' + ds[d].length + ' plots').join(' · ') + ' (ids: `plots.csv`)\n'; });
fs.writeFileSync(path.join(__dirname, 'ROOM_LAYOUTS.md'), out); console.log(out.length + ' bytes');
