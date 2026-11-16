/* THE SEWERS, DISTRICT R (2026-11-16) — a PROPOSAL for mondo's OK. Nothing here is read by the game and nothing is built.
   mondo 11-16, in the Sewers thread: "one sewer district could be radioactive sludge if it connects to the power plant", then
   "start a thread to do the radioactive district that meets the power station".
   `node docs/plans/world-zones/draw-sewers-r.js` reads the BUILT plan (docs/areas/sewers/layout.json, 6 x 4 plots) and the city's
   Power station plot (docs/disaster-city/city-layout.json P02-08) and writes, beside itself:
     sewers-r-layout.json       the proposed fifth row: the new plots, their squares, levels, openings, the way up, what each holds
     sewers_r_plot_plan.png     the picture (an SVG shot with playwright; without playwright the .svg stays)
   The proposal: a fifth row on the south side. Two plots are dug for district R, under the south-east corner (the city's Industrial
   district is its south-east block too): P04-04 under the Depot, P05-04 under the Outfall. P03-04 only carries the Platform's track on
   to the south wall. P00-04 .. P02-04 stay solid ground. */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = path.join(__dirname, '..', '..', '..');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/sewers/layout.json'), 'utf8'));
const CITY = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/disaster-city/city-layout.json'), 'utf8'));
const COLS = 6, ROWS = 5, N = 12;
const DIST = {
    W: { name: 'The Sewers', col: '#2f6f62' }, T: { name: 'The Running Tunnels', col: '#4c4f9a' }, H: { name: 'The Holding Cells', col: '#7d8794' },
    O: { name: 'The Old Workings', col: '#7a5a3c' }, R: { name: 'the radioactive district (label mine)', col: '#5f8a14' },
};
/* the new row. `s` = sludge (the plan's water squares of district R). Local squares, 12 x 12, north row first. */
const NEW = [
    { id: 'P00-04', solid: true }, { id: 'P01-04', solid: true }, { id: 'P02-04', solid: true },
    { id: 'P03-04', d: 'T', level: 0, name: 'The Loop Line', own: 'not district R', what: 'nothing new: only the Platform\'s track runs on through it to the south wall (42 m more tunnel before the city\'s Platform)',
      cells: Array(12).fill('xxxxxojoxxxx') },
    { id: 'P04-04', d: 'R', level: 4, name: 'The Power Station Drain (label mine)',
      what: 'the stair up from the Depot lands here; a valve gallery (pumps, gate valves, gauge boards, breaker panels, pipe runs, barrels, radiation signs, warning tape); the station\'s waste pipes pour glowing sludge into a channel with a walkway each side; the service stair and bulkhead door up to the Power station',
      cells: ['xxxxxoooxxxx', 'xxxxxoooxxxx', 'xfffffffffxx', 'xfffffffffxx', 'xfffffffffxx', 'xxoooooooooo', 'xxosssssssss', 'xxosoooooooo', 'xxosoxxoooxx', 'xxosoxxoooxx', 'xxosoxxoooxx', 'xxoooxxoooxx'] },
    { id: 'P05-04', d: 'R', level: 0, name: 'The Sludge Pit (label mine)',
      what: 'LANDMARK: a 12 m brick hall; the channel pours 7 m out of the west wall into a deep tank of sludge (never waded); a walkway round the tank, brick piers, half-sunk barrels and tanks; a ladder up beside the fall; a dry doorway north into the Outfall',
      cells: ['xxxxxoooxxxx', 'xxxxxoooxxxx', 'xffffffffffx', 'xfssssssssfx', 'xfssssssssfx', 'ofssssssssfx', 'ssssssssssfx', 'ofssssssssfx', 'xfssssssssfx', 'xfssssssssfx', 'xffffffffffx', 'xxxxxxxxxxxx'] },
];
const OPEN_NEW = [
    { a: 'P04-03', b: 'P04-04', kind: 'stair', label: 'NEW: a stair, 7 m up', what: 'a dry stair from the Depot\'s south wall up to the drain' },
    { a: 'P04-04', b: 'P05-04', kind: 'fall', by: 'ladder', label: 'NEW: the sludge fall, 7 m + a ladder', what: 'the channel pours 7 m into the Sludge Pit; a ladder beside it' },
    { a: 'P05-03', b: 'P05-04', kind: 'walk', label: 'NEW: a doorway', what: 'a dry doorway, same level, from the Outfall\'s south walk' },
];
/* squares the build would dig in plots that stand today (both are the two openings above) */
const DIG = [{ plot: 'P04-03', x0: 5, y0: 10, x1: 7, y1: 11, why: 'the Depot\'s south wall: the foot of the stair' }, { plot: 'P05-03', x0: 5, y0: 11, x1: 7, y1: 11, why: 'the Outfall\'s south wall: the doorway' }];

const cells = PLAN.cells.map(r => r.split('')).concat([...Array(N)].map(() => Array(COLS * N).fill('x')));
const plots = PLAN.plots.map(p => Object.assign({}, p, { x: +p.id.slice(1, 3), y: +p.id.slice(4, 6) }));
for (const p of NEW) { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); p.isNew = true; plots.push(p); if (p.cells) p.cells.forEach((r, ly) => { if (r.length !== N) throw new Error(p.id + ' row ' + ly); [...r].forEach((ch, lx) => { cells[p.y * N + ly][p.x * N + lx] = ch; }); }); }
const at = {}; plots.forEach(p => { at[p.id] = p; });
for (const d of DIG) { const p = at[d.plot]; for (let y = d.y0; y <= d.y1; y++) for (let x = d.x0; x <= d.x1; x++) if (cells[p.y * N + y][p.x * N + x] === 'x') cells[p.y * N + y][p.x * N + x] = 'n'; }   // n = newly dug walkway

/* the nine ways out that stand today (from draw-sewers.js) + the new one */
const WAYS = [
    { plot: 'P03-00', sq: [6.5, 0.4], kind: 'open', to: 'Disaster City: the Pump court', how: 'a stair and a bulkhead door', side: 'T' },
    { plot: 'P05-02', sq: [11.6, 4.5], kind: 'open', to: 'Disaster City: the Dock edge', how: 'the drowned manhole: climb up', side: 'R' },
    { plot: 'P05-01', sq: [11.6, 6.5], kind: 'hidden', to: 'the Stadium (east stand)', how: 'a draught in the wall', side: 'R' },
    { plot: 'P03-04', sq: [6.5, 11.6], kind: 'open', to: 'the Platform (the city\'s subway)', how: 'the track, now 42 m longer', side: 'B', dy: 0 },
    { plot: 'P01-03', sq: [5.5, 9.5], kind: 'hq', to: 'DOOR HQ: the Garden well', how: 'a well: the rope', side: 'B', dy: 0 },
    { plot: 'P00-03', sq: [0.4, 6.5], kind: 'hq', to: 'DOOR HQ: the Tunnel', how: 'the track', side: 'L' },
    { plot: 'P00-02', sq: [0.4, 6.5], kind: 'hidden', to: 'The Woods: the storm drain', how: 'a grate', side: 'L' },
    { plot: 'P00-01', sq: [0.4, 5.5], kind: 'open', to: 'The Cavern: the Oubliette', how: 'the old portcullis', side: 'L' },
    { plot: 'P00-00', sq: [0.4, 5.5], kind: 'hq', to: 'DOOR HQ: Room 24601', how: 'a cell door', side: 'L' },
    { plot: 'P04-04', sq: [8.5, 11.6], kind: 'isNew', to: 'NEW · Disaster City: the Power station', how: 'a service stair and a bulkhead door (question 2)', side: 'B', dy: 58 },
];

/* ---- the json ---- */
const QUESTIONS = [
    'The sludge: LOOK ONLY (glowing green, but you wade it like the rest of the sewer water), or the game\'s own POISON liquid (the toxic green of the poison bogs: it poisons whoever stands in it)? No new rule either way.',
    'The door up: INSIDE the Power station (A: the turbine hall, by the boilers) or OUTSIDE in its yard (B: by the east door)? Either way the city\'s end is one DOOR_HQ.links row; no city file is edited.',
    'Who lives there? I place nobody unless you name units the game has (in the list today: mad scientist, black goo, zombie, ghoul, swamp monster, flesheater ...).',
    'Size: two plots, like the Holding Cells and the Old Workings. Enough, or bigger?',
];
const out = {
    area: 'The Sewers', piece: 'district R, the radioactive district', date: '2026-11-16', status: 'PROPOSAL: waits mondo\'s OK; nothing is built',
    his: ['one sewer district could be radioactive sludge if it connects to the power plant', 'start a thread to do the radioactive district that meets the power station'],
    frame: 'a fifth row on the south side: the block becomes 6 x 5 plots (252 x 210 m); two plots dug for R, one carries the track on, three stay solid',
    levelMeters: 1.75, levels: { 'P04-04': 4, 'P05-04': 0, 'P03-04': 0 },
    plots: NEW.map(p => p.solid ? { id: p.id, solid: true, what: 'not dug: solid ground' } : { id: p.id, name: p.name, d: p.d, level: p.level, what: p.what, cells: p.cells, note: p.own }),
    openings: OPEN_NEW, digsInStandingPlots: DIG,
    wayUp: { link: 'a new DOOR_HQ.links row (sewer end: the south wall of P04-04; city end: the Power station, plot P02-08, district I)', cityEndOptions: { A: 'inside the turbine hall, by the boilers', B: 'in the yard, by the east door' } },
    look: 'the sludge is this district\'s only: a glowing green look row (three-renderer.js _LIQUID_STYLES) picked per stream, so the other four districts keep their brown water; green light off the channel and the tank',
    toolChanges: ['layout.json: rows 5, twelve more rows of squares, six plot rows (three solid), three openings, districts.R', 'bake-sewers.js: a plot may be `solid` (no walk check, no vault); a `walk` opening between two plots of one level (today every opening changes level) or none at all; the way `power` (a spur to the south wall + its link row in WANT); a stream row may carry a `look`',
        'data.js by hand: the room is 42 m longer to the south, so its middle moves 21 m: the z of six link rows (docks_sewer, stadium_sewers, tunnels_works, sewers_drain, workings_oubliette, cells_dungeon) and of well_garden changes by 21 (the tool prints each row); a new link row for the Power station',
        'three-renderer.js: `_hqWaterLook` reads a stream\'s own `look` before the room\'s; one more style row (the sludge)'],
    questions: QUESTIONS, legend: { s: 'sludge', n: 'newly dug walkway in a plot that stands today' },
};
fs.writeFileSync(path.join(__dirname, 'sewers-r-layout.json'), JSON.stringify(out, null, 1) + '\n');

/* ---- the picture ---- */
const S = 192, c = S / 12, MX = 330, MY = 170, MW = COLS * S, MH = ROWS * S, LEGX = MX + MW + 300, LEGW = 640, Wd = LEGX + LEGW + 30;
const TBY = MY + MH + 150, Ht = TBY + 330;
const C = { bg: '#141614', ink: '#f2f2f2', dim: '#a2a9b0', open: '#4ef07a', hidden: '#ff7ad1', hq: '#ffc93a', id: '#ffd75e', isNew: '#59c8ff', sludge: '#a6ff2a' };
const GROUND = { o: '#8a867e', w: '#3a74b4', f: '#a4a8aa', j: '#b08a5a', b: '#c9a36a', s: C.sludge, n: '#59c8ff' };
const o = [], esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const txt = (x, y, s, sz = 12, fill = C.ink, w = 400, anchor = 'start') => o.push(`<text x="${x}" y="${y}" font-size="${sz}" fill="${fill}" font-weight="${w}" text-anchor="${anchor}">${esc(s)}</text>`);
const wrap = (s, n) => { const r = []; let l = ''; for (const w of s.split(' ')) { if ((l + ' ' + w).trim().length > n) { r.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) r.push(l); return r; };
const tw = (s, sz) => s.length * sz * 0.63;
o.push(`<rect width="${Wd}" height="${Ht}" fill="${C.bg}"/>`);
o.push('<defs><pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#0c0e0d"/><line x1="0" y1="0" x2="0" y2="10" stroke="#2a2f2c" stroke-width="3"/></pattern></defs>');
txt(30, 44, 'THE SEWERS  ·  district R, the radioactive district, for your OK  ·  2 new plots under the south-east corner  ·  it meets the Power station', 22, C.ink, 700);
txt(30, 70, 'Your words: "one sewer district could be radioactive sludge if it connects to the power plant". The glowing green sludge is in this district only; the other four keep their brown water.', 13.5, C.dim);
txt(30, 90, 'This is a plan drawing, not the game. Nothing is built. The 24 plots that stand today are drawn dim, from the built plan. One small square = 3.5 m; one plot = 42 m.', 13.5, C.dim);

for (const p of plots) {
    const X = MX + p.x * S, Y = MY + p.y * S;
    if (p.solid) { o.push(`<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="url(#hatch)"/>`, `<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="none" stroke="#000" stroke-opacity=".55"/>`); continue; }
    const d = DIST[p.d], g = [];
    g.push(`<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="#0c0e0d"/>`, `<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="${d.col}" fill-opacity="${p.d === 'R' ? 0.55 : 0.40}"/>`);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const ch = cells[p.y * N + y][p.x * N + x]; if (ch !== 'x' && ch !== 'n') g.push(`<rect x="${X + x * c}" y="${Y + y * c}" width="${c + 0.4}" height="${c + 0.4}" fill="${GROUND[ch]}"/>`); }
    o.push(`<g opacity="${p.isNew ? 1 : 0.5}">${g.join('')}</g>`);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) if (cells[p.y * N + y][p.x * N + x] === 'n') o.push(`<rect x="${X + x * c}" y="${Y + y * c}" width="${c}" height="${c}" fill="${GROUND.o}" stroke="${C.isNew}" stroke-width="1.5"/>`);
    o.push(`<rect x="${X}" y="${Y}" width="${S}" height="${S}" fill="none" stroke="#000" stroke-opacity=".55"/>`);
}
for (const p of plots) {   // a white line where the next plot is another district or the edge; district R in its own green
    if (p.solid) continue;
    const X = MX + p.x * S, Y = MY + p.y * S, nb = (dx, dy) => { const q = at['P0' + (p.x + dx) + '-0' + (p.y + dy)]; return q && !q.solid && q.d === p.d; };
    const col = p.d === 'R' ? C.sludge : '#fff', wdt = p.d === 'R' ? 4 : 2, ln = (x1, y1, x2, y2) => o.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${wdt}"/>`);
    if (!nb(0, -1)) ln(X, Y, X + S, Y); if (!nb(0, 1)) ln(X, Y + S, X + S, Y + S); if (!nb(-1, 0)) ln(X, Y, X, Y + S); if (!nb(1, 0)) ln(X + S, Y, X + S, Y + S);
}
const label = (x, y, s, sz, fill, w = 700, anchor = 'start') => o.push(`<text x="${x}" y="${y}" font-size="${sz}" fill="${fill}" font-weight="${w}" text-anchor="${anchor}" stroke="#000" stroke-width="3.5" stroke-opacity=".9" paint-order="stroke">${esc(s)}</text>`);
for (const p of plots) { const X = MX + p.x * S, Y = MY + p.y * S;
    if (p.solid) { label(X + 100, Y + S / 2 - 4, 'not dug', 12.5, '#6f7873', 600); label(X + 100, Y + S / 2 + 12, p.id, 10, '#6f7873', 500); continue; }
    const nm = p.name.replace(' (label mine)', '');
    label(X + 6, Y + 18, nm, p.isNew && p.d === 'R' ? 12 : 13, p.isNew ? C.ink : '#c9cdd0'); label(X + 6, Y + 33, `${p.id}  level ${p.level}` + (p.isNew && p.d === 'R' ? '  · NEW' : ''), 10.5, p.isNew ? C.id : '#b9a866', 600); }
/* the openings that stand today: small white diamonds */
for (const i of PLAN.openings) { const a = at[i.a], b = at[i.b], X = MX + ((a.x + b.x) / 2 + 0.5) * S, Y = MY + ((a.y + b.y) / 2 + 0.5) * S;
    o.push(`<rect x="${X - 5}" y="${Y - 5}" width="10" height="10" fill="#cfd4d8" stroke="#000" stroke-width="1.2" transform="rotate(45 ${X} ${Y})"/>`); }
/* the new openings */
const LBL = { 'P04-03|P04-04': [-250, -4], 'P04-04|P05-04': [-262, -44], 'P05-03|P05-04': [20, -4] };
for (const i of OPEN_NEW) { const a = at[i.a], b = at[i.b], X = MX + ((a.x + b.x) / 2 + 0.5) * S, Y = MY + ((a.y + b.y) / 2 + 0.5) * S + (a.y === b.y ? 0 : 0), off = LBL[i.a + '|' + i.b];
    o.push(`<rect x="${X - 8}" y="${Y - 8}" width="16" height="16" fill="${C.isNew}" stroke="#000" stroke-width="1.5" transform="rotate(45 ${X} ${Y})"/>`);
    const w = tw(i.label, 11) + 10, lx = X + off[0], ly = Y + off[1];
    if (off[1] < -30) o.push(`<line x1="${X}" y1="${Y - 10}" x2="${lx + w - 20}" y2="${ly + 5}" stroke="${C.isNew}" stroke-width="1.2"/>`);
    o.push(`<rect x="${lx - 3}" y="${ly - 12}" width="${w}" height="17" fill="#000" fill-opacity=".9" stroke="${C.isNew}" stroke-width="1"/>`); txt(lx + 2, ly + 1, i.label, 11, C.isNew, 700); }
/* ways out */
for (const w of WAYS) {
    const p = at[w.plot], X = MX + p.x * S + w.sq[0] * c, Y = MY + p.y * S + w.sq[1] * c, col = C[w.kind], big = w.kind === 'isNew', lw = Math.max(tw(w.to, big ? 13 : 12) * 1.1, tw(w.how, 10.5)) + 14;
    let lx, ly, ax, ay;
    if (w.side === 'L') { lx = MX - 22 - lw; ly = Y - 16; ax = lx + lw; ay = ly + 17; }
    if (w.side === 'R') { lx = MX + MW + 22; ly = Y - 16; ax = lx; ay = ly + 17; }
    if (w.side === 'T') { lx = X - lw / 2; ly = MY - 62; ax = X; ay = ly + 34; }
    if (w.side === 'B') { lx = X - lw / 2; ly = MY + MH + 26 + (w.dy || 0); ax = X; ay = ly; }
    o.push(`<line x1="${X}" y1="${Y}" x2="${ax}" y2="${ay}" stroke="${col}" stroke-width="${big ? 2.6 : 1.6}" ${w.plot === 'P01-03' ? 'stroke-dasharray="4 4"' : ''}/>`, `<circle cx="${X}" cy="${Y}" r="${big ? 11 : 7.5}" fill="${col}" stroke="#000" stroke-width="2"/>`);
    o.push(`<rect x="${lx}" y="${ly}" width="${lw}" height="34" fill="#000" stroke="${col}" stroke-width="${big ? 2.2 : 1.2}"/>`); txt(lx + 7, ly + 14, w.to, big ? 13 : 12, col, 700); txt(lx + 7, ly + 28, w.how, 10.5, '#d9dde0');
}
o.push(`<rect x="${MX}" y="${MY}" width="${MW}" height="${MH}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>`);

/* ---- the right column ---- */
let ly = MY - 60; const LX = LEGX;
const head = s => { txt(LX, ly, s, 14.5, C.ink, 700); ly += 22; };
const para = (s, n = 96, fill = '#d9dde0', sz = 11.8) => { wrap(s, n).forEach(l => { txt(LX, ly, l, sz, fill); ly += 15.5; }); };
const sw = (col, s, stroke) => { o.push(`<rect x="${LX}" y="${ly - 11}" width="15" height="13" fill="${col}" stroke="${stroke || '#fff'}" stroke-opacity="${stroke ? 1 : 0.7}" stroke-width="${stroke ? 1.6 : 1}"/>`); txt(LX + 24, ly, s, 12); ly += 20; };
head('WHERE IT GOES');
para('A fifth row on the south side. The city\'s Industrial district (the Power station) is the city\'s south-east block, so the new plots sit under the Sewers\' south-east corner: under the Depot and under the Outfall. Every other side of the block has ways out in it; this corner has none.'); ly += 4;
para('It closes a new ring, so the maze gets one more loop: Depot > stair up > the Drain > down beside the sludge fall > the Sludge Pit > the Outfall (a dead end today) > ladder up to the Docks\' Outfall.'); ly += 12;
head('KEY');
sw(C.sludge, 'radioactive sludge (district R only)'); sw(GROUND.w, 'water, as today (brown and murky in the game)'); sw(GROUND.o, 'walkway'); sw(GROUND.f, 'concrete room'); sw(GROUND.j, 'rail track');
sw(GROUND.o, 'squares dug in a plot that stands today (5 in all)', C.isNew); sw('url(#hatch)', 'not dug: solid ground');
const dia = (col, s, r = 11) => { o.push(`<rect x="${LX + 1}" y="${ly - 10}" width="${r}" height="${r}" fill="${col}" stroke="#000" transform="rotate(45 ${LX + 7} ${ly - 4})"/>`); txt(LX + 24, ly, s, 12); ly += 20; };
const dot = (col, s) => { o.push(`<circle cx="${LX + 7}" cy="${ly - 4}" r="7" fill="${col}" stroke="#000" stroke-width="2"/>`); txt(LX + 24, ly, s, 12); ly += 20; };
dia(C.isNew, 'NEW opening between plots (three)'); dia('#cfd4d8', 'opening that stands today', 9); dot(C.isNew, 'NEW way out: up to the Power station');
dot(C.open, 'way out, open (today)'); dot(C.hidden, 'way out, hidden (today)'); dot(C.hq, 'DOOR HQ door (today)'); ly += 10;

/* the side view */
head('SIDE VIEW  ·  the walk from the Depot to the Outfall');
{ const x0 = LX, w = LEGW - 20, y0 = ly + 6, h = 150, gy = y0 + h - 24, m = 9.2;   // 1 m = 9.2 px high; floor of level 0 at gy
  const seg = w / 4, top4 = gy - 7 * m, B = '#5a4a3c';
  o.push(`<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#0c0e0d" stroke="#3a3f3c"/>`);
  /* ground blocks */
  o.push(`<rect x="${x0}" y="${gy}" width="${w}" height="24" fill="${B}"/>`);                                    // under level 0
  o.push(`<rect x="${x0 + seg}" y="${top4}" width="${seg * 1.25}" height="${gy - top4}" fill="${B}"/>`);          // the drain's plateau
  o.push(`<polygon points="${x0 + seg - 62},${gy} ${x0 + seg},${top4} ${x0 + seg},${gy}" fill="#8a867e"/>`);     // the stair
  o.push(`<rect x="${x0 + seg + 30}" y="${top4 - 3}" width="${seg * 1.25 - 30}" height="6" fill="${C.sludge}"/>`);   // the channel
  o.push(`<rect x="${x0 + seg * 2.25}" y="${top4 - 3}" width="7" height="${gy - top4 + 1}" fill="${C.sludge}"/>`);   // the fall
  o.push(`<rect x="${x0 + seg * 2.25}" y="${gy - 4}" width="${seg * 0.95}" height="8" fill="${C.sludge}"/>`);        // the tank
  o.push(`<rect x="${x0 + seg * 3.3}" y="${gy - 3}" width="${seg * 0.55}" height="6" fill="${GROUND.w}"/>`);         // the Outfall's pool
  o.push(`<rect x="${x0 + seg * 3.2 - 4}" y="${y0 + 1}" width="8" height="${gy - 34 - y0}" fill="#5a4a3c"/>`); txt(x0 + seg * 3.2 + 8, gy - 38, 'doorway', 9.5, C.dim);   // the wall with its doorway
  o.push(`<line x1="${x0 + seg * 1.7}" y1="${top4}" x2="${x0 + seg * 1.7}" y2="${y0 + 4}" stroke="${C.isNew}" stroke-width="3" stroke-dasharray="5 3"/>`);  // the way up
  txt(x0 + seg * 1.7 + 6, y0 + 14, 'up to the Power station', 10.5, C.isNew, 700);
  txt(x0 + 6, gy - 8, 'the Depot', 11, C.ink, 600); txt(x0 + 6, gy + 15, 'level 0', 10, C.dim);
  txt(x0 + seg + 34, top4 - 10, 'the Drain', 11, C.ink, 600); txt(x0 + seg + 8, top4 + 16, 'level 4 = 7 m up', 10, '#d9dde0');
  txt(x0 + seg * 2.25 + 14, top4 + 30, '7 m fall', 10.5, C.sludge, 700); txt(x0 + seg * 2.25 + 12, gy - 12, 'the Sludge Pit', 11, C.ink, 600); txt(x0 + seg * 2.25 + 12, gy + 15, 'level 0', 10, C.dim);
  txt(x0 + seg * 3.3 + 4, gy - 12, 'the Outfall', 11, C.ink, 600);
  ly = y0 + h + 22; }
para('A fall is your 7 m: an upper way pours into a lower ROOM. It can be 14 m (the Drain on level 8, a ladder from the Depot, not a stair) if you want it taller.', 96, C.dim, 11.2); ly += 10;

/* the city end */
head('THE CITY END  ·  the Power station (plot P02-08, Industrial)');
{ const p = CITY.plots.find(q => q.id === 'P02-08'), cs = 15, x0 = LX, y0 = ly + 2, COL = { '#': '#2b302d', P: '#8f9498', I: '#a8744f', D: '#ffd75e' };
  p.cells.forEach((r, y) => [...r].forEach((ch, x) => o.push(`<rect x="${x0 + x * cs}" y="${y0 + y * cs}" width="${cs}" height="${cs}" fill="${COL[ch] || '#555'}" stroke="#000" stroke-opacity=".35"/>`)));
  const mark = (x, y, s) => { o.push(`<circle cx="${x0 + (x + 0.5) * cs}" cy="${y0 + (y + 0.5) * cs}" r="10" fill="${C.isNew}" stroke="#000" stroke-width="2"/>`); txt(x0 + (x + 0.5) * cs, y0 + (y + 0.5) * cs + 4.5, s, 12, '#000', 700, 'middle'); };
  mark(4, 8, 'A'); mark(10, 7, 'B'); txt(x0 + 6 * cs, y0 - 4, 'north', 9.5, C.dim, 400, 'middle');
  const tx = x0 + 12 * cs + 18; let ty = y0 + 12;
  const line = (s, fill = '#d9dde0', wgt = 400) => { wrap(s, 62).forEach(l => { txt(tx, ty, l, 11.5, fill, wgt); ty += 15; }); ty += 5; };
  line('brown = the building (turbine hall, boilers, control room); grey = its yard; yellow = its two doors.', C.dim);
  line('A · INSIDE: a bulkhead door in the turbine hall, by the boilers. You come up in the middle of the station.', C.ink, 600);
  line('B · OUTSIDE: a bulkhead door in the yard, by the east door. Like the Pump court\'s door today.', C.ink, 600);
  line('Either way it is one link row in the game\'s data; the city\'s files are not edited. The exact square is picked at the build.', C.dim);
  ly = y0 + 12 * cs + 26; }

/* ---- under the map: the plots + the questions ---- */
txt(30, TBY, 'THE NEW PLOTS  ·  what stands on each', 15, C.ink, 700);
let y = TBY + 26;
for (const p of NEW.filter(q => !q.solid)) { o.push(`<rect x="30" y="${y - 10}" width="10" height="11" fill="${DIST[p.d].col}" stroke="#fff" stroke-opacity=".6"/>`); txt(46, y, p.id, 11.5, C.id); txt(110, y, `${p.d} · ${p.name}`, 12, C.ink, 700); txt(430, y, 'level ' + p.level, 11.5);
    y += 16; wrap(p.what, 150).forEach(l => { txt(110, y, l, 11.5, '#d9dde0'); y += 15; }); y += 8; }
txt(110, y, 'P00-04, P01-04, P02-04: not dug. In plots that stand today: 3 x 2 squares in the Depot\'s south wall (the stair\'s foot), 3 squares in the Outfall\'s south wall (the doorway).', 11.5, C.dim); y += 15;
txt(110, y, 'Names: the two plots have no name in the game, so they carry plain labels marked "(label mine)". Props: only models already in the game. No new art.', 11.5, C.dim);
const QX = 1130; txt(QX, TBY, 'FOUR QUESTIONS ONLY YOU CAN ANSWER', 15, C.isNew, 700);
let qy = TBY + 26; QUESTIONS.forEach((q, i) => { wrap(q, 150).forEach((l, k) => { txt(QX + (k ? 20 : 0), qy, (k ? '' : (i + 1) + '.  ') + l, 12, k ? '#d9dde0' : C.ink, k ? 400 : 600); qy += 16; }); qy += 9; });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Ht}" viewBox="0 0 ${Wd} ${Ht}" font-family="DejaVu Sans, Arial, sans-serif">${o.join('')}</svg>`;
const svgPath = path.join(__dirname, 'sewers_r_plot_plan.svg'); fs.writeFileSync(svgPath, svg);
console.log(`sewers district R plan: ${NEW.filter(p => p.d === 'R').length} plots for R, ${OPEN_NEW.length} new openings, ${Wd} x ${Ht}`);
(async () => {
    let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('/opt/node-tools/node_modules/playwright'); } catch (e2) { console.log('no playwright: open the .svg in a browser and save a PNG'); return; } }
    const b = await pw.chromium.launch(); const pg = await b.newPage({ viewport: { width: Wd, height: Ht } });
    await pg.setContent(`<body style="margin:0;background:${C.bg}">${svg}</body>`); await pg.screenshot({ path: path.join(__dirname, 'sewers_r_plot_plan.png') }); await b.close(); fs.unlinkSync(svgPath);
    console.log('wrote sewers_r_plot_plan.png');
})();
