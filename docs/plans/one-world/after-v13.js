/* after-v13.js — THE CHANGES TO THE ONE WORLD MAP MADE AFTER v13 (2026-11-20, the world polish plan, thread 3).
   plots.json is "written by gen.js --plots, never by hand", but gen.js --plots reads TODAY'S rooms for the plot names and stops
   since the zones moved ("no room site_prebuilt_gobekli_ancient"): the sheet cannot be written again from the generator. So a
   change to the map after v13 is a row HERE, and this tool writes it into plots.json (`node docs/plans/one-world/after-v13.js`;
   it can be run any number of times). mondo 11-20: "you have freedom to move and change and make bigger whatever you need to".

   1. THE SNOWY PINES ARE 3 PLOTS WIDE (camN: 8 -> 22 plots). The eight old plots keep their places and their `was`; fourteen new
      plots (no `was`: nothing stood there) stand beside them. bake-camelot.js builds them (district N, `docs/areas/camelot/districts/N-room.js`).
   2. SNOW ROUND THE PINES: the ground of the Pines' plots and of every free plot within two plots of them is tundra (`T`, edge
      kind `snow`), so the land past the room's lines is snow and snow pines, not summer forest. A plot of another district, a
      route, a link or the highway keeps its letter (bake-route.js dresses a route plot by it; the routes are their own thread's). The one
      exception: the kingdom's north row (-29..-24, -3), whose north third is the Pines' own snow in the kingdom's room. A letter only says what
      the land PAST a room's line looks like from another room; it changes nothing inside the room that stands on the plot. */
'use strict';
const fs = require('fs'), path = require('path'), FILE = path.join(__dirname, 'plots.json');
const P = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const PINES_NEW = [
    ['The Lookout', -27, -4], ['The Gully Mouth', -25, -4], ['The Pine Ridge', -27, -5], ['The Log Bridge', -25, -5], ['The Ridge Foot', -27, -6], ['The Gully Head', -25, -6],
    ['The Wolf Run', -27, -7], ['The East Branch', -24, -7], ['The Drift Bank', -26, -8], ['The Frozen Tarn', -24, -8], ['The Drift Field', -26, -9], ['The Tarn Shore', -24, -9],
    ['The High Pines', -26, -10], ['The Hermit’s Hollow', -24, -10],
];
/* 3. THE FOREST IS 3 PLOTS WIDE (camW: 8 -> 20 plots; the link plot L7 stays the link's). Its country is forest already: no ground letter changes. */
const FOREST_NEW = [
    ['The Poachers’ Path', -27, 3], ['The Bluff Path', -25, 3], ['The Hollow’s Rim', -27, 4], ['The Bluff’s Foot', -25, 4], ['The Bluff', -24, 4], ['The Hunters’ Stand', -23, 4],
    ['The Hollow', -27, 5], ['The Fern Bank', -27, 6], ['The Ford', -25, 6], ['The Charcoal Burners', -24, 6], ['The Badger Wood', -27, 7], ['The Old Oak', -25, 7],
];
/* 4. THE FAIRY FOREST IS 13 PLOTS (camF: 6 -> 13): the land south of its walk, down to a second row (north of it is the Old Road, R4). Forest already: no letters. */
const FAIRY_NEW = [['The Moth Glade', -23, 1], ['The Glow-Worm Hollow', -21, 1], ['The Mossy Stair', -20, 1], ['The Wishing Pool', -23, 2], ['The Root Stair', -22, 2], ['The Hollow Oak', -21, 2], ['The Lantern Glade', -20, 2]];
/* 5. THE CLEARING GROWS (woods: 9 -> 15 plots; world polish thread 6, mondo's OK on plan 3, 11-20): the main trail leaves the old row and
      snakes through new plots north and south of it (docs/plans/world-polish/thread6/plan3.js). Forest already: no letters. The pilot's six. */
const CLEARING_NEW = [['The North Rise', -15, 0], ['The Climb', -13, 0], ['The Burned House', -16, 2], ['The Stick Men', -15, 2], ['Under the Bluff', -13, 2], ['The Dead End', -13, 3]];
const grow = (id, list) => { const d = P.districts.find(q => q.id === id); if (!d) throw new Error('no ' + id);
    list.forEach(([n, x, y]) => { const q = d.plots.find(p => p.x === x && p.y === y); if (q) { if (q.was) throw new Error('an old plot stands on ' + x + ',' + y); q.n = n; } else d.plots.push({ n, x, y }); });
    d.x = Math.min(...d.plots.map(p => p.x)); d.y = Math.min(...d.plots.map(p => p.y)); d.w = Math.max(...d.plots.map(p => p.x)) - d.x + 1; d.h = Math.max(...d.plots.map(p => p.y)) - d.y + 1; d.count = d.plots.length; d.shape = 'band'; return d; };
const d = grow('camN', PINES_NEW), dW = grow('camW', FOREST_NEW), dF = grow('camF', FAIRY_NEW), dC = grow('woods', CLEARING_NEW);
/* the ground */
const own = {}; const key = (x, y) => x + ',' + y;
P.districts.forEach(q => q.plots.forEach(p => { own[key(p.x, p.y)] = q.id; }));
[].concat(P.routes, P.links, (P.highway && P.highway.legs) || []).forEach(r => (r.plots || []).forEach(p => { own[key(p[0], p[1])] = r.id || 'way'; }));
const G = P.ground; let n = 0;
const set = (x, y, c) => { const r = y - G.y0, i = x - G.x0; if (r < 0 || r >= G.rows.length || i < 0 || i >= G.rows[r].length) return; if (G.rows[r][i] === '~' || G.rows[r][i] === '#') return; if (G.rows[r][i] !== c) { G.rows[r] = G.rows[r].slice(0, i) + c + G.rows[r].slice(i + 1); n++; } };
/* the kingdom's north row: the village's north plots carry the Pines' snow down to the moat (the home frame's squares y 12..17), so from the Pines the land south is snow first */
for (let x = -29; x <= -24; x++) set(x, -3, 'T');
d.plots.forEach(p => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = p.x + dx, y = p.y + dy, o = own[key(x, y)]; if (!o || o === 'camN') set(x, y, 'T'); } });
/* 6. THE MOUNTAINS ARE ONE SKI MOUNTAIN (world polish thread 5, mondo's "okay" on the plan, 11-20): the Ski Lodge, the Snowy Pass, Mount Olympus and Mount
      Shasta's plots stand where docs/plans/world-polish/thread5/draw-mountain.js puts them (98 plots; bake-mountains.js builds them). `shasta` is THE LONG
      DESCENT now, the east way down. The wild links L9, L10 and L11 are gone into the mountain: their plots are the plan's place plots. A plot keeps its `was`. */
const MP = require('../world-polish/thread5/draw-mountain.js');
const MTN = (() => { const ids = { K: 'mtnK', P: 'mtnP', O: 'mtn', D: 'shasta' }, was = {}, out = [];
    ['mtnK', 'mtnP', 'mtn', 'shasta'].forEach(id => P.districts.find(q => q.id === id).plots.forEach(p => { if (p.was) was[(p.was0 || p.n).toLowerCase()] = p.was; }));
    const REN = { 'the cornice': 'shastina', 'the bowl': 'the summit', 'the frozen lake': 'helen lake', 'the meadows': 'panther meadows', 'the hot springs': 'the steam vents' }, lists = { mtnK: [], mtnP: [], mtn: [], shasta: [] };
    MP.cells.forEach(([c, r]) => { const raw = MP.NAME[c + ',' + r], star = /\*$/.test(raw), n = raw.replace(/\*$/, ''), k = n.toLowerCase(), w = star ? was[REN[k] || k] : null, row = { n, x: MP.WX0 + c, y: MP.WY0 + r }; if (w) { row.was = w; row.was0 = REN[k] || k; } lists[ids[c >= 13 ? 'D' : MP.DIST(c, r)]].push(row); });
    Object.keys(lists).forEach(id => { const d = P.districts.find(q => q.id === id); d.plots = lists[id]; if (id === 'shasta') d.name = 'The Long Descent'; d.state = 'relaid 11-20';
        d.x = Math.min(...d.plots.map(p => p.x)); d.y = Math.min(...d.plots.map(p => p.y)); d.w = Math.max(...d.plots.map(p => p.x)) - d.x + 1; d.h = Math.max(...d.plots.map(p => p.y)) - d.y + 1; d.count = d.plots.length; d.shape = 'band'; out.push(d); });
    ['L9', 'L10', 'L11'].forEach(id => { const l = P.links.find(q => q.id === id); if (l) { l.plots = []; l.meets = []; l.note = 'gone into the one ski mountain (11-20)'; } });
    return out; })();
/* written the way gen.js writes it: one line a district / a ground row */
let t = fs.readFileSync(FILE, 'utf8');
[d, dW, dF, dC].concat(MTN).forEach(d => { const i = t.indexOf('    {"id":"' + d.id + '"'), j = t.indexOf('\n      ]}', i); if (i < 0 || j < 0) throw new Error('no block of ' + d.id);
  const head = Object.assign({}, d); delete head.plots;
  t = t.slice(0, i) + '    ' + JSON.stringify(head).slice(0, -1) + ',\n      "plots": [\n' + d.plots.map(q => '        ' + JSON.stringify(q)).join(',\n') + t.slice(j); });
{ const m = /("rows": \[\n)([\s\S]*?)(\n\s*\]\})/.exec(t.slice(t.indexOf('"ground"'))); if (!m) throw new Error('no ground rows'); const lead = /^\s*/.exec(m[2])[0];
  t = t.replace(m[0], m[1] + G.rows.map(r => lead + JSON.stringify(r)).join(',\n') + m[3]); }
JSON.parse(t); fs.writeFileSync(FILE, t);
[d, dW, dF, dC].concat(MTN).forEach(d => console.log('plots.json: ' + d.name + ' ' + d.count + ' plots, ' + d.w + ' x ' + d.h + ' at ' + d.x + ',' + d.y)); console.log(n + ' ground letters changed to T');
