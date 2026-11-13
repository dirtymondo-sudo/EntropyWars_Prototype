#!/usr/bin/env node
/* bake-disaster-city.js (2026-11-13) — DISASTER CITY, THE 144 PLOTS.
   Reads mondo's layout (docs/disaster-city/city-layout.json: 12 x 12 plots, each 12 x 12 cells, nine districts of 16 plots) and
   writes the room `site_prebuilt_downtown_city` into data.js between the DC144 markers. Repo tooling only (RULE #1 TOOLING).

     node bake-disaster-city.js            write the room
     node bake-disaster-city.js --dry-run  print the counts, write nothing

   THE TAILORING (what the plan became in Entropy Wars):
   - a plan cell (3 to 4 m in the plan) is ONE battle square, 3.5 m (HQ_ARENA_RULES.squareDefault): a plot is 42 m, exactly a
     12 x 12 battle board; the city 504 m a side.
   - NO WALLS on the plot lines (mondo 11-13; see THE PLOT EDGES). Was: a closed plot edge is a thin wall ON the plot line (brick, concrete, corrugated or railings by district); the plan's
     one-cell boundary band on either side of it is yard, so every square of a plot is a square of its board.
   - a building is the urban pack's textured building with an inside (texbuilding hollow), its doorway on the plan's first door.
   - a roof-route building is a solid building tier whose flat roof is walked; the plan's inside stairs are fire escapes in the
     yard and its roof bridges are bridge rows (a second surface over the ground).
   - roads are the city plan's streets (road paint, manholes, lamps, traffic), the ground sheets are painted per square.
   Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE 144 PLOTS". */
'use strict';
const fs = require('fs'), path = require('path');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const PLAN = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/disaster-city/city-layout.json'), 'utf8'));
const C = 3.5, N = 12, PL = N * C, HALF = PL * N / 2;            // square, cells per plot, plot side, half the city
const r3 = v => Math.round(v * 1000) / 1000;
const gx = c => r3(-HALF + c * C);                                 // a cell LINE (0..144) in room metres
const gc = c => r3(-HALF + (c + 0.5) * C);                         // a cell CENTRE
const plotOf = {}; PLAN.plots.forEach(p => { plotOf[p.id] = p; });
/* THE CROSSINGS (tailoring): the plan leaves a one-cell nub where a walk crosses a road (PPPPPPPRPPPP, RRRRRRRRPRRR). A row / column that is
   mostly pavement becomes a whole paved crossing; a lone pavement cell in a carriageway becomes road. */
PLAN.plots.forEach(p => {
    const g = p.cells.map(r => r.split(''));
    for (let pass = 0; pass < 2; pass++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const rowP = g[y].filter(c => c === 'P').length, rowR = g[y].filter(c => c === 'R').length, colP = g.filter(r => r[x] === 'P').length, colR = g.filter(r => r[x] === 'R').length;
        if (g[y][x] === 'R' && ((rowP >= 9 && rowR <= 2) || (colP >= 9 && colR <= 2))) g[y][x] = 'P';
        else if (g[y][x] === 'P' && ((rowR >= 9 && rowP <= 2 && x > 0 && x < N - 1) || (colR >= 9 && colP <= 2 && y > 0 && y < N - 1))) g[y][x] = 'R';
    }
    p.cells = g.map(r => r.join(''));
});
const pid = (x, y) => 'P' + String(x).padStart(2, '0') + '-' + String(y).padStart(2, '0');
const cellAt = (cx, cy) => { if (cx < 0 || cy < 0 || cx >= 144 || cy >= 144) return '#'; const p = plotOf[pid(Math.floor(cx / N), Math.floor(cy / N))]; return p.cells[cy % N][cx % N]; };
let seed = 144; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];

/* ── THE PLOT EDGES (mondo 11-13: "i dont like how it looks like the plots are separated by literal walls, and they are all the same wall"):
   no wall stands on a plot line. The plan rings every plot with a blocked band ('#') and a few gaps; here
   1. a building one square from its plot's edge GROWS into the band (two plots' buildings meet back to back: a street front, not a yard wall);
   2. some of the band on a side the plan does NOT connect is built on (THE INFILL);
   3. the rest gets a BOUNDARY picked per district and per run (THE BOUNDARIES: fences from the structural pack's railings, hedges, short walls,
      rows of planters / police barricades / dumpsters / trees), never one wall everywhere (mondo 11-13 14:09: "there can still be walls ... get creative"). ── */
const conn = new Set(); PLAN.groundEdges.forEach(e => { conn.add(e.a + '|' + e.b); conn.add(e.b + '|' + e.a); });
const SIDE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const sideOpen = (p, s) => conn.has(p.id + '|' + pid(p.x + SIDE[s][0], p.y + SIDE[s][1]));
PLAN.plots.forEach(p => {
    const g = p.cells.map(r => r.split(''));
    const all = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y][x] !== '#') return false; return true; };
    p.buildings.forEach(b => {
        const has = sd => (b.doors || []).some(d => d.side === sd);
        if (b.x === 1 && !has('W') && all(0, b.y, 0, b.y + b.h - 1)) { b.x = 0; b.w++; }
        if (b.x + b.w === N - 1 && !has('E') && all(N - 1, b.y, N - 1, b.y + b.h - 1)) b.w++;
        if (b.y === 1 && !has('N') && all(b.x, 0, b.x + b.w - 1, 0)) { b.y = 0; b.h++; }
        if (b.y + b.h === N - 1 && !has('S') && all(b.x, N - 1, b.x + b.w - 1, N - 1)) b.h++;
        for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) if (g[y][x] === '#') g[y][x] = 'I';
    });
    p.cells = g.map(r => r.join(''));
});
const setCell = (cx, cy, ch) => { const p = plotOf[pid(Math.floor(cx / N), Math.floor(cy / N))], r = p.cells[cy % N].split(''); r[cx % N] = ch; p.cells[cy % N] = r.join(''); };
const inCity = (cx, cy) => cx >= 0 && cy >= 0 && cx < 144 && cy < 144;

/* ── THE DISTRICTS: the look per district (the urban pack's sheets; MODEL_LIST) ── */
const D = {
    R: { label: 'SOUTHSIDE',      yard: 2, wall: 'urban:PlasterWallStucco1a',       wallH: 2.1, styles: ['residential', 'stucco', 'residential'], storeys: [2, 3, 3, 4], trees: ['tree_3', 'tree', 'tree_2'], treeP: 0.5 },
    C: { label: 'CIVIC CENTER',   yard: 5, wall: 'urban:ConcreteStriped1c',        wallH: 2.1, styles: ['office', 'stucco'],                   storeys: [3, 4, 4, 5], trees: ['tree_3'], treeP: 0.25 },
    F: { label: 'FINANCIAL',      yard: 4, wall: 'urban:TileMarble2d',              wallH: 2.6, styles: ['tower', 'office', 'tower'],           storeys: [5, 6, 8, 10], trees: ['tree_4'], treeP: 0.12 },
    U: { label: 'UNIVERSITY',     yard: 2, wall: 'urban:PlasterWallStucco2c',       wallH: 1.9, styles: ['stucco', 'residential', 'office'],    storeys: [2, 3, 3, 4], trees: ['tree_3', 'tree_4', 'tree'], treeP: 0.55 },
    H: { label: 'HERO PLAZA',     yard: 5, wall: 'urban:ConcreteStriped1a',        wallH: 2.1, styles: ['office', 'tower'],                    storeys: [4, 5, 6, 8], trees: ['tree_3'], treeP: 0.2 },
    E: { label: 'ENTERTAINMENT',  yard: 3, wall: 'urban:PlasterWallPainted1d',     wallH: 2.6, styles: ['stucco', 'office', 'residential'],    storeys: [3, 3, 4, 5], trees: ['tree_3'], treeP: 0.1 },
    I: { label: 'INDUSTRIAL',     yard: 6, wall: 'urban:MetalCorrugatedPainted2a', wallH: 2.2, styles: ['factory'],                            storeys: [2, 2, 3], trees: [], treeP: 0 },
    S: { label: 'SPORTS + CULTURE', yard: 2, wall: 'urban:ConcreteStriped1e',        wallH: 1.9, styles: ['office', 'stucco', 'factory'],        storeys: [2, 3, 4], trees: ['tree_3', 'tree_2'], treeP: 0.45 },
    B: { label: 'BAYSIDE',        yard: 3, wall: 'urban:PlasterWallPainted2a',     wallH: 2.1, styles: ['stucco', 'office'],                   storeys: [3, 4, 5, 6], trees: [], treeP: 0 },
};
/* the storeys a named landmark stands (the plan gives two floors to nearly everything; "no exact height limit is established") */
const TALL = { 'Superhero Tower': 12, 'Goblin Bank': 6, 'Luxury hotel': 10, 'City Hall': 5, 'Waterfront hotel': 9, 'Bank offices': 9, 'News office': 7, 'Courthouse': 4, 'Concert hall': 4, 'Casino': 4,
    'Cinema': 3, 'Museum': 3, 'Wrestling hall': 3, 'Power station': 4, 'Mall concourse': 2, 'Church': 3, 'Observatory': 3, 'Members club': 4, 'Penthouse stair': 11, 'Military offices': 4, 'Time Bureau': 5, 'Intelligence office': 6 };
/* the plan's filler buildings wear the game's painted building sprites (solid, a painted front); its shop rows the Buildings pack's shop blocks (MODEL_LIST: Elbolilloduro, CC0) */
const FILLER = { 'Residence / annex': ['building_2', 'building_4', 'building_6', 'building_8', 'building_9'], 'Local shop': ['shop', 'building_7', 'building_10'], 'Street kiosk / annex': ['shop', 'building_5', 'building_3'], 'Workshop / store': ['building_3', 'building_10', 'building_1'] };
const PACKED = { 'Corner shops': 'pack_bld_08', 'West shops': 'pack_bld_09', 'East shops': 'pack_bld_07', 'Tailor shops': 'pack_bld_03', 'Bookshops': 'pack_bld_04', 'Costume shops': 'pack_bld_05', 'Coffee arcade': 'pack_bld_06', 'Repair shops': 'pack_bld_00', 'Pawnshop court': 'pack_bld_09', 'Restaurant court': 'pack_bld_08' };
const PAL = ['urban:TileGeneric1a', 'grass_2', 'urban:ConcreteStriped2a', 'urban:TileGeneric2a', 'urban:TileGeneric3a', 'urban:ConcreteUnderTiles1'];   // 1 pavement · 2 grass · 3 yard concrete · 4 marble (financial) · 5 plaza paving (civic, hero plaza) · 6 bare concrete (industrial); 0 = the room's asphalt

/* ── the roof-route buildings (solid tiers whose roofs are walked) ── */
const roofB = new Set(); PLAN.roofEdges.forEach(e => { roofB.add(e.a); roofB.add(e.b); });
const ROOF_H = 7.0;   // two storeys of 3.5 m: every roof on a route stands level with the next (a bridge is level)

const features = [], props = [], bInfo = [];
const count = { texb: 0, roofb: 0, infill: 0, bridges: 0, escapes: 0, trees: 0 };

/* ── THE BUILDINGS ── */
PLAN.plots.forEach(p => {
    const dd = D[p.d], ox = p.x * N, oy = p.y * N;
    p.buildings.forEach((b, bi) => {
        const x0 = ox + b.x, y0 = oy + b.y, w = b.w * C, d = b.h * C, x = r3((gx(x0) + gx(x0 + b.w)) / 2), z = r3((gx(y0) + gx(y0 + b.h)) / 2);
        const door = b.doors[0], side = door ? door.side : 'S';
        const rot = { S: 0, W: 90, N: 180, E: 270 }[side];
        /* the doorway's square of the front, 1 = its left as you face the front from outside */
        let col = 0;
        if (door) { const k = side === 'S' ? (door.x - b.x) : side === 'N' ? (b.x + b.w - 1 - door.x) : side === 'E' ? (b.y + b.h - 1 - door.y) : (door.y - b.y); col = Math.round(k * C / 1.75) + 1; }   // the front's face squares are 1.75 m: the doorway is the left half of the plan's door square
        const style = pick(dd.styles);
        let st = TALL[b.name] || pick(dd.storeys);
        const info = { id: b.id, name: b.name, plot: p.id, d: p.d, x, z, w, d2: d, side, cx0: x0, cy0: y0, cw: b.w, ch: b.h, st };
        if (roofB.has(b.id)) {
            /* a roof-route building: a solid building tier, its flat roof the walk (the plan's inside stair is a fire escape outside) */
            features.push({ k: 'plateau', id: 'dc:' + b.id, x, z, w: r3(w), d: r3(d), h: ROOF_H, edge: 0.3, bld: { style, seed: features.length } });
            info.roof = ROOF_H; count.roofb++;
        } else {
            const row = { k: 'texbuilding', id: 'dc:' + b.id, x, z, w: r3(w), d: r3(d), rot, storeys: st, style, seed: features.length };
            if (b.name === 'Church') { row.key = 'church_1'; delete row.style; }
            else if (PACKED[b.name] && bi === 0) { row.key = PACKED[b.name]; delete row.style; }
            else if (FILLER[b.name]) { row.key = pick(FILLER[b.name]); row.storeys = Math.min(st, 5); delete row.style; }
            else { row.hollow = true; if (col) row.door = col; }
            features.push(row); count.texb++;
        }
        bInfo.push(info);
    });
});

/* ── THE INFILL: the band left on a side the plan does not connect (and round the city's edge) is built on — back-lot buildings a square
   or two deep, each its own length, height and front; a park plot's band is planted instead (the trees go in with the dressing) ── */
const GREEN = /park|green|canal|memorial|campus|garden/i, hedgeCells = [];
const INFILL = { R: ['building_2', 'building_4', 'building_8', 'building_9'], C: ['building_1', 'building_6'], F: ['building_1', 'building_5'], U: ['building_4', 'building_6', 'building_9'], H: ['building_1', 'building_5'],
    E: ['shop', 'building_7', 'building_10', 'building_3'], I: ['building_3', 'building_10'], S: ['building_3', 'building_6'], B: ['shop', 'building_7', 'building_5'] };
const usedBand = new Set();
for (let L = 0; L <= N; L++) for (const horizontal of [true, false]) {
    const line = L * N; let run = null;
    const flush = () => {
        if (!run) return; const r = run; run = null;
        const cells = []; for (let c = r.a; c <= r.b; c++) { if (r.pat & 1) cells.push(horizontal ? [c, line - 1] : [line - 1, c]); if (r.pat & 2) cells.push(horizontal ? [c, line] : [line, c]); }
        const lenI = r.b - r.a + 1; if (r.open || lenI < 2 || rnd() > (r.outer ? 0.55 : 0.4)) return;
        cells.forEach(q => usedBand.add(q[0] + ',' + q[1]));
        const home = cells[0], p = plotOf[pid(Math.floor(home[0] / N), Math.floor(home[1] / N))], dd = D[p.d];
        const lo = (r.pat & 1) ? line - 1 : line, hi = (r.pat & 2) ? line + 1 : line, deep = hi - lo, len = r.b - r.a + 1;
        const x0 = horizontal ? r.a : lo, x1 = horizontal ? r.b + 1 : hi, z0 = horizontal ? lo : r.a, z1 = horizontal ? hi : r.b + 1;
        const front = r.pat === 1 ? 'a' : r.pat === 2 ? 'b' : (rnd() < 0.5 ? 'a' : 'b');
        const rot = horizontal ? (front === 'a' ? 180 : 0) : (front === 'a' ? 90 : 270);
        const row = { k: 'texbuilding', id: 'dc:in' + count.infill, x: r3((gx(x0) + gx(x1)) / 2), z: r3((gx(z0) + gx(z1)) / 2), w: r3((x1 - x0) * C), d: r3((z1 - z0) * C), rot, storeys: deep === 1 ? pick([1, 1, 2]) : pick([1, 2, 2, 3]), seed: features.length };
        if (len <= 3 && rnd() < 0.55) row.key = pick(INFILL[p.d]); else row.style = pick(dd.styles);
        features.push(row); count.infill++;
        cells.forEach(q => setCell(q[0], q[1], 'I'));
    };
    for (let c = 0; c <= 144; c++) {
        let pat = 0, open = false, outer = (L === 0 || L === N);
        if (c < 144) {
            const k = Math.floor(c / N), PA = plotOf[horizontal ? pid(k, L - 1) : pid(L - 1, k)], PB = plotOf[horizontal ? pid(k, L) : pid(L, k)]; open = !!(PA && PB && conn.has(PA.id + '|' + PB.id));
            const A = horizontal ? [c, line - 1] : [line - 1, c], B = horizontal ? [c, line] : [line, c];
            if (inCity(A[0], A[1]) && cellAt(A[0], A[1]) === '#' && !usedBand.has(A[0] + ',' + A[1])) pat |= 1;
            if (inCity(B[0], B[1]) && cellAt(B[0], B[1]) === '#' && !usedBand.has(B[0] + ',' + B[1])) pat |= 2;
        }
        if (run && (pat !== run.pat || c - run.a >= run.max || c % N === 0)) flush();
        if (pat && !run) run = { a: c, b: c, pat, open, outer, max: 2 + Math.floor(rnd() * 4) }; else if (run) run.b = c;
    }
    flush();
}

/* ── THE ROOF ROUTES: a bridge per crossing, a fire escape at each end of every district's route ── */
const bById = {}; bInfo.forEach(b => { bById[b.id] = b; });
PLAN.roofEdges.forEach(e => {
    const A = bById[e.a], B = bById[e.b]; if (!A || !B) return;
    /* the plan's span runs between the two footprints along one axis; the slab lands 0.9 m inside each roof */
    const fx = e.from[0], fy = e.from[1], tx = e.to[0], ty = e.to[1];
    const horiz = Math.abs(ty - fy) < 0.01;
    let x0, z0, x1, z1;
    if (horiz) { const z = gc(Math.min(Math.floor(fy), Math.ceil(fy - 0.5))); const lo = fx < tx ? A : B, hi = fx < tx ? B : A; x0 = r3(lo.x + lo.w / 2 - 1.5); x1 = r3(hi.x - hi.w / 2 + 1.5); z0 = z1 = Math.max(Math.max(lo.z - lo.d2 / 2, hi.z - hi.d2 / 2) + 1.75, Math.min(Math.min(lo.z + lo.d2 / 2, hi.z + hi.d2 / 2) - 1.75, z)); }
    else { const x = gc(Math.min(Math.floor(fx), Math.ceil(fx - 0.5))); const lo = fy < ty ? A : B, hi = fy < ty ? B : A; z0 = r3(lo.z + lo.d2 / 2 - 1.5); z1 = r3(hi.z - hi.d2 / 2 + 1.5); x0 = x1 = Math.max(Math.max(lo.x - lo.w / 2, hi.x - hi.w / 2) + 1.75, Math.min(Math.min(lo.x + lo.w / 2, hi.x + hi.w / 2) - 1.75, x)); }
    features.push({ k: 'bridge', id: 'dc:' + e.id, x0: r3(x0), z0: r3(z0), x1: r3(x1), z1: r3(z1), w: 3.5, y: ROOF_H });
    count.bridges++;
});

/* ── the squares something stands on (a prop, a tree, a landing): one thing a square ── */
const occ = new Set();
const free = (cx, cy, ok) => { const ch = cellAt(cx, cy); return (ok || '.#').indexOf(ch) >= 0 && !occ.has(cx + ',' + cy); };
const take = (cx, cy) => occ.add(cx + ',' + cy);
bInfo.forEach(b => (plotOf[b.plot].buildings.find(q => q.id === b.id).doors || []).forEach(dr => take(plotOf[b.plot].x * N + dr.ox, plotOf[b.plot].y * N + dr.oy)));   // a door's step stays clear

/* ── THE BOUNDARIES: what stands where the plan closes a plot line. Per border (two plots' shared side) a first and a second recipe from the
   district's list (LOW where the plan connects the plots: you see over it; TALL where it does not), alternating run by run.
   A fence / hedge / wall stands ON the plot line (between squares); a row of planters / barricades / dumpsters / trees stands CENTRED on the
   band's squares (it is the map: it blocks); a bench / bin beside a fence stands against it, OFF its square's centre (a unit stands on the centre). ── */
const LOW = { R: ['rail:ranch', 'rail:spear', 'hedge:1.2', 'wall:1.2', 'planters', 'trees'], C: ['rail:bars', 'rail:balusters', 'planters', 'hedge:1.1', 'rail:parapet'], F: ['planters', 'rail:parapet', 'rail:balusters_d', 'rail:glass_panels'],
    U: ['hedge:1.3', 'rail:ranch', 'trees', 'rail:parapet', 'planters'], H: ['planters', 'rail:balusters', 'rail:parapet', 'hedge:1.1'], E: ['rail:guard', 'barricades', 'rail:pipe', 'planters', 'dumpsters'],
    I: ['rail:guard', 'rail:wire_fence', 'dumpsters', 'rail:cable_fence'], S: ['rail:bars', 'rail:pipe', 'hedge:1.2', 'rail:ranch', 'trees'], B: ['barricades', 'rail:pipe', 'planters', 'trees', 'barricades'] };
const HIGH = { R: ['rail:wood_fence', 'wall:2.1', 'hedge:1.9', 'rail:spear', 'trees'], C: ['rail:spear', 'wall:2.1', 'rail:panel_fence', 'hedge:1.8'], F: ['rail:spear', 'wall:2.6', 'rail:panel_fence', 'planters'],
    U: ['hedge:1.9', 'rail:spear', 'wall:1.9', 'trees'], H: ['rail:spear', 'wall:2.1', 'hedge:1.8'], E: ['rail:wood_fence', 'wall:2.6', 'rail:wire_fence', 'dumpsters'],
    I: ['rail:wire_fence', 'wall:2.2', 'rail:panel_fence', 'rail:cable_fence', 'dumpsters'], S: ['rail:wire_fence', 'wall:1.9', 'rail:spear', 'hedge:1.8'], B: ['rail:wire_fence', 'wall:2.1', 'barricades', 'rail:spear'] };
const BENCH = { R: 'park_bench', U: 'park_bench', S: 'park_bench', C: 'city_bench', H: 'city_bench', F: 'city_bench', B: 'city_bench' }, BIN = { C: 'city_bin', H: 'city_bin', B: 'city_bin', E: 'city_bin', S: 'city_bin', R: 'city_bin' };
const edgeN = {};
for (let L = 0; L <= N; L++) for (const horizontal of [true, false]) for (let k = 0; k < N; k++) {
    const line = L * N, PA = plotOf[horizontal ? pid(k, L - 1) : pid(L - 1, k)], PB = plotOf[horizontal ? pid(k, L) : pid(L, k)];
    const joined = !!(PA && PB && conn.has(PA.id + '|' + PB.id)), home = (PA && PB) ? (rnd() < 0.5 ? PA : PB) : (PA || PB), dd = D[home.d];
    const list = (joined ? LOW : HIGH)[home.d], first = pick(list); let second = pick(list); if (second === first) second = list[(list.indexOf(first) + 1) % list.length];
    const A = c => horizontal ? [c, line - 1] : [line - 1, c], B = c => horizontal ? [c, line] : [line, c];
    const band = q => inCity(q[0], q[1]) && cellAt(q[0], q[1]) === '#';
    const runs = []; let run = null;
    for (let c = k * N; c <= k * N + N; c++) {
        const need = c < k * N + N && (band(A(c)) || band(B(c)));
        if (run && (!need || c - run.a >= 6)) { runs.push(run); run = null; }
        if (need) { if (!run) run = { a: c, b: c }; else run.b = c; }
    }
    runs.forEach((r, ri) => {
        const rec = (ri % 2 === 0) ? first : second, kind = rec.split(':')[0], arg = rec.split(':')[1];
        edgeN[kind] = (edgeN[kind] || 0) + 1;
        const lz = gx(line), a0 = gx(r.a), a1 = gx(r.b + 1);
        const seg = horizontal ? { x0: a0, z0: lz, x1: a1, z1: lz } : { x0: lz, z0: a0, x1: lz, z1: a1 };
        const onLine = kind === 'rail' || kind === 'wall' || kind === 'hedge';
        if (kind === 'rail') features.push(Object.assign({ k: 'rail' }, seg, { model: arg }));
        if (kind === 'wall') features.push(Object.assign({ k: 'wall' }, seg, { h: Number(arg), t: 0.3, key: dd.wall, tint: '#ffffff' }));
        if (kind === 'hedge') features.push(Object.assign({ k: 'wall' }, seg, { h: Number(arg), t: 0.9, key: 'leaves_3', tint: '#ffffff' }));
        for (let c = r.a; c <= r.b; c++) {
            const qa = A(c), qb = B(c), ba = band(qa), bb = band(qb), q = ba ? qa : qb, sideA = ba;
            if (ba) setCell(qa[0], qa[1], '.'); if (bb) setCell(qb[0], qb[1], '.');
            const i = c - r.a, cxm = gc(q[0]), czm = gc(q[1]);
            /* toward the line from the square's middle, and the way a thing against the line faces (into its own plot) */
            const tl = sideA ? 1 : -1, inFace = horizontal ? (sideA ? 0 : 180) : (sideA ? 270 : 90), off = 0.36 * C * tl;
            if (onLine) {
                if (i % 4 === 1 && BENCH[home.d] && kind !== 'hedge' ? true : (i % 4 === 1 && BENCH[home.d] && rnd() < 0.5)) { take(q[0], q[1]); props.push({ key: BENCH[home.d], x: r3(cxm + (horizontal ? 0 : off)), z: r3(czm + (horizontal ? off : 0)), face: inFace }); }
                else if (i % 4 === 3 && dd.trees.length && rnd() < dd.treeP * 1.6) { take(q[0], q[1]); features.push({ k: 'tree', x: cxm, z: czm, kind: pick(dd.trees), h: r3(3.4 + rnd() * 0.8) }); count.trees++; }
                else if (i % 4 === 3 && BIN[home.d] && rnd() < 0.5) { take(q[0], q[1]); props.push({ key: BIN[home.d], x: r3(cxm + (horizontal ? 0.3 * C : off)), z: r3(czm + (horizontal ? off : 0.3 * C)), face: inFace }); }
                continue;
            }
            if (occ.has(q[0] + ',' + q[1])) continue; take(q[0], q[1]);
            const along = horizontal ? 0 : 90;
            if (kind === 'planters') props.push({ key: 'planter', x: cxm, z: czm, face: along });
            if (kind === 'trees') { features.push({ k: 'tree', x: cxm, z: czm, kind: pick(dd.trees.length ? dd.trees : ['palm_tree_none']) === 'palm_tree_none' ? 'tree_3' : pick(dd.trees.length ? dd.trees : ['tree_3']), h: r3(3.4 + ((q[0] * 7 + q[1] * 3) % 5) * 0.2) }); count.trees++; }
            if (kind === 'barricades') { if (i % 2 === 0) props.push({ key: 'item_police_barricade', x: cxm, z: czm, face: along });
                else { const e = 0.5 * C * tl; props.push({ key: 'traffic_cone', x: r3(cxm + (horizontal ? -0.25 * C : e)), z: r3(czm + (horizontal ? e : -0.25 * C)) }, { key: 'traffic_cone', x: r3(cxm + (horizontal ? 0.25 * C : e)), z: r3(czm + (horizontal ? e : 0.25 * C)) }); } }
            if (kind === 'dumpsters') props.push(i % 2 === 0 ? { key: 'dumpster', x: cxm, z: czm, face: inFace } : { key: home.d === 'I' ? 'traffic_barrel' : 'psx_wooden_crate_1', x: cxm, z: czm, face: along });
        }
    });
}
count.edges = edgeN;

/* ── THE FIRE ESCAPES: the plan's inside stairs, outside — a landing half way up and two ladders, at both ends of every roof route ── */
const rAdj = {}; PLAN.roofEdges.forEach(e => { (rAdj[e.a] = rAdj[e.a] || []).push(e.b); (rAdj[e.b] = rAdj[e.b] || []).push(e.a); });
const seenR = new Set(), escapeAt = [];
Object.keys(rAdj).sort().forEach(a => {
    if (seenR.has(a)) return;
    const comp = [], st = [a]; seenR.add(a);
    while (st.length) { const q = st.pop(); comp.push(q); rAdj[q].forEach(n => { if (!seenR.has(n)) { seenR.add(n); st.push(n); } }); }
    const ends = comp.filter(q => rAdj[q].length === 1);
    (ends.length >= 2 ? ends : [comp[0], comp[comp.length - 1]]).forEach(q => { if (!escapeAt.includes(q)) escapeAt.push(q); });
});
escapeAt.forEach(id => {
    const b = bById[id]; if (!b) return;
    const E = b.x + b.w / 2, W = b.x - b.w / 2, Sz = b.z + b.d2 / 2, Nz = b.z - b.d2 / 2, h2 = ROOF_H / 2;
    const tries = [];
    /* the square the landing stands on, and the one past it the ladder's foot is reached from (both open ground) */
    const open2 = (cx, cy) => '.#P'.indexOf(cellAt(cx, cy)) >= 0;
    for (let i = 0; i < b.ch; i++) { if (open2(b.cx0 + b.cw + 1, b.cy0 + i)) tries.push(['E', b.cx0 + b.cw, b.cy0 + i]); if (open2(b.cx0 - 2, b.cy0 + i)) tries.push(['W', b.cx0 - 1, b.cy0 + i]); }
    for (let i = 0; i < b.cw; i++) { if (open2(b.cx0 + i, b.cy0 + b.ch + 1)) tries.push(['S', b.cx0 + i, b.cy0 + b.ch]); if (open2(b.cx0 + i, b.cy0 - 2)) tries.push(['N', b.cx0 + i, b.cy0 - 1]); }
    /* a yard square first, a walk square if the building has no yard beside it; never where a roof bridge lands */
    const nearBridge = (x, z) => features.some(f => f.k === 'bridge' && Math.hypot((f.x0 + f.x1) / 2 - x, (f.z0 + f.z1) / 2 - z) < 9);
    const own = (cx, cy) => cx >= b.cx0 && cx < b.cx0 + b.cw && cy >= b.cy0 && cy < b.cy0 + b.ch;
    const lone = (t) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const cx = t[1] + dx, cy = t[2] + dy; if ('ID'.indexOf(cellAt(cx, cy)) >= 0 && !own(cx, cy)) return false; } return true; };   // no other building touches the landing's square (a ladder's foot within 0.3 m of a second roof climbs the wrong one)
    for (let i = tries.length - 1; i >= 0; i--) if (!lone(tries[i])) tries.splice(i, 1);
    const hit = tries.find(t => free(t[1], t[2], '.#') && !nearBridge(gc(t[1]), gc(t[2]))) || tries.find(t => free(t[1], t[2], '.#P') && !nearBridge(gc(t[1]), gc(t[2]))) || tries.find(t => free(t[1], t[2], '.#P'));
    if (!hit) { console.warn('no fire escape spot for', id); return; }
    const side = hit[0], xc = gc(hit[1]), zc = gc(hit[2]); take(hit[1], hit[2]);
    if (side === 'E') features.push({ k: 'plateau', x: r3(E + 0.9), z: zc, w: 1.6, d: 2.2, h: h2, edge: 0.15 }, { k: 'climb', x: r3(E + 1.7), z: r3(zc + 0.6), face: 270, look: 'fireescape' }, { k: 'climb', x: r3(E), z: r3(zc - 0.6), face: 270, look: 'fireescape' });
    if (side === 'W') features.push({ k: 'plateau', x: r3(W - 0.9), z: zc, w: 1.6, d: 2.2, h: h2, edge: 0.15 }, { k: 'climb', x: r3(W - 1.7), z: r3(zc - 0.6), face: 90, look: 'fireescape' }, { k: 'climb', x: r3(W), z: r3(zc + 0.6), face: 90, look: 'fireescape' });
    if (side === 'S') features.push({ k: 'plateau', x: xc, z: r3(Sz + 0.9), w: 2.2, d: 1.6, h: h2, edge: 0.15 }, { k: 'climb', x: r3(xc - 0.6), z: r3(Sz + 1.7), face: 0, look: 'fireescape' }, { k: 'climb', x: r3(xc + 0.6), z: r3(Sz), face: 0, look: 'fireescape' });
    if (side === 'N') features.push({ k: 'plateau', x: xc, z: r3(Nz - 0.9), w: 2.2, d: 1.6, h: h2, edge: 0.15 }, { k: 'climb', x: r3(xc + 0.6), z: r3(Nz - 1.7), face: 180, look: 'fireescape' }, { k: 'climb', x: r3(xc - 0.6), z: r3(Nz), face: 180, look: 'fireescape' });
    count.escapes++;
});

/* ── THE LANDMARKS + THE DRESSING: models already in the game (MODEL_LIST.md §6), none on a walk square ── */
const byName = {}; PLAN.plots.forEach(p => { (byName[p.name] = byName[p.name] || []).push(p); });
/* put(plot, key, lx, ly, face, o): plot-local squares (0..12, a square's middle is n + 0.5); refuses a building / a taken square (a road only with o.road) */
const put = (p, key, lx, ly, face, o) => {
    o = o || {}; const cx = p.x * N + Math.floor(lx), cy = p.y * N + Math.floor(ly);
    if (!free(cx, cy, o.road ? '.#PR' : (o.walk ? '.#P' : '.#'))) { if (!o.quiet) console.warn('skip', key, p.id, p.name, lx, ly, cellAt(cx, cy)); return false; }
    take(cx, cy); if (o.span) o.span.forEach(q => take(cx + q[0], cy + q[1]));
    /* THE SQUARE'S MIDDLE (mondo 11-13): a unit stands on it. A thing that blocks (cover, a stall, a statue) stands ON the middle; a thing that
       does nothing in a fight (a bench, a bin, a cone, a pot) stands OFF it: against the building beside it, else toward its plot's edge */
    if (!o.road && !o.span && !o.keep) {
        if (DECOR.has(key)) {
            const fx = lx - Math.floor(lx), fy = ly - Math.floor(ly);
            if (Math.abs(fx - 0.5) < 0.3 && Math.abs(fy - 0.5) < 0.3) {
                const solid = (dx, dy) => 'ID'.indexOf(cellAt(cx + dx, cy + dy)) >= 0;
                if (solid(0, -1)) ly = Math.floor(ly) + 0.14; else if (solid(0, 1)) ly = Math.floor(ly) + 0.86; else if (solid(-1, 0)) lx = Math.floor(lx) + 0.14; else if (solid(1, 0)) lx = Math.floor(lx) + 0.86;
                else if (Math.abs(lx - 6) > Math.abs(ly - 6)) lx = Math.floor(lx) + (lx < 6 ? 0.14 : 0.86); else ly = Math.floor(ly) + (ly < 6 ? 0.14 : 0.86);
            }
        } else if (!/^car_|truck|bus$|rowboat|crane|lighthouse|tank$|fountain/.test(key)) { lx = Math.floor(lx) + 0.5; ly = Math.floor(ly) + 0.5; }
    }
    const row = { key, x: r3(-HALF + (p.x * N + lx) * C), z: r3(-HALF + (p.y * N + ly) * C) }; if (face != null) row.face = face; if (o.floor) row.floor = true;
    props.push(row); return true;
};
const DECOR = new Set(['city_bench', 'park_bench', 'city_bin', 'signpost', 'fire_hydrant', 'traffic_cone', 'cardboard_boxes', 'psx_planter_pot_mp_1_full', 'round_table', 'pool_umbrella']);
const at = (name, fn) => (byName[name] || []).forEach(fn);
const tree = (p, lx, ly, kind, h) => { lx = Math.floor(lx) + 0.5; ly = Math.floor(ly) + 0.5; const cx = p.x * N + Math.floor(lx), cy = p.y * N + Math.floor(ly); if (!free(cx, cy, '.#')) return; take(cx, cy); features.push({ k: 'tree', x: r3(-HALF + (p.x * N + lx) * C), z: r3(-HALF + (p.y * N + ly) * C), kind, h }); count.trees++; };
/* a park plot's unconnected band: a tree a square */
if (0) hedgeCells.forEach((q, i) => { const p = plotOf[pid(Math.floor(q[0] / N), Math.floor(q[1] / N))]; tree(p, q[0] % N + 0.5, q[1] % N + 0.5, ['tree_3', 'tree', 'tree_2', 'tree_4'][(q[0] + q[1] + i) % 4], 3.4 + ((q[0] * 7 + q[1] * 3) % 5) * 0.2); });
/* BAYSIDE, the opening: the response outside the mall (cop cars nose to tail down the response streets, barricades at the cordon, the ambulances at the medical staging) */
at('Police staging', p => { [[1.5, 4.9, 70], [3.5, 7.1, 250], [5.6, 4.9, 110], [7.6, 7.1, 290], [9.6, 4.9, 80], [10.6, 7.2, 265]].forEach(q => put(p, 'car_cop', q[0], q[1], q[2], { road: true }));
    [[2.5, 9.5], [5.5, 9.5], [8.5, 9.5]].forEach(q => put(p, 'item_police_barricade', q[0], q[1], 0)); put(p, 'car_cop', 9.5, 10.5, 90); put(p, 'car_cop', 2.5, 10.5, 270); });
at('Arrival court', p => { put(p, 'car_cop', 4.7, 2.5, 20, { road: true }); put(p, 'car_cop', 7.3, 8.5, 200, { road: true }); put(p, 'car_cop', 4.8, 9.6, 340, { road: true }); put(p, 'item_police_barricade', 9.5, 4.5, 0); put(p, 'item_police_barricade', 9.5, 7.5, 0); put(p, 'traffic_cone', 1.5, 5.5); put(p, 'traffic_cone', 2.5, 6.5); });
at('Cordon plaza', p => { [[1.5, 4.5], [3.5, 4.5], [8.5, 4.5], [10.5, 4.5], [1.5, 7.5], [3.5, 7.5], [8.5, 7.5], [10.5, 7.5]].forEach(q => put(p, 'item_police_barricade', q[0], q[1], 0));
    put(p, 'car_cop', 2.5, 2.5, 120); put(p, 'car_cop', 9.5, 2.5, 240); put(p, 'car_ambulance', 2.5, 9.5, 0); put(p, 'traffic_cone', 4.5, 8.5); put(p, 'traffic_cone', 7.5, 8.5); });
at('Medical staging', p => { put(p, 'car_ambulance', 2.5, 5.0, 90, { road: true }); put(p, 'car_ambulance', 5.5, 7.0, 270, { road: true }); put(p, 'fire_truck', 9.0, 5.0, 90, { road: true, span: [[1, 0]] }); put(p, 'car_ambulance', 3.5, 9.8, 60); put(p, 'carnival_tent', 7.5, 10.0, 0, { quiet: true }); put(p, 'car_cop', 2.5, 1.6, 100); });
at('Loading / parking', p => { put(p, 'car_truck', 2.5, 9.7, 90); put(p, 'car_suv', 5.5, 9.7, 80); put(p, 'car_cadillac', 8.5, 9.7, 100); put(p, 'car_cop', 3.5, 5.0, 95, { road: true }); put(p, 'car_cop', 8.5, 7.0, 275, { road: true }); put(p, 'car_taxi', 2.5, 1.6, 0); });
at('Boardwalk exit', p => { put(p, 'car_cop', 2.5, 5.0, 85, { road: true }); put(p, 'palm_tree', 9.5, 3.5); put(p, 'palm_tree', 9.5, 6.5); put(p, 'palm_tree', 5.5, 9.8); put(p, 'city_bench', 8.5, 9.8, 0); put(p, 'rowboat', 2.5, 10.2, 70); });
at('Marina lookout', p => { put(p, 'lighthouse', 9.8, 5.9, 0, { span: [[0, 1], [0, -1]] }); put(p, 'palm_tree', 9.5, 2.5); put(p, 'palm_tree', 9.5, 9.5); put(p, 'city_bench', 1.5, 2.5, 90); put(p, 'rowboat', 1.6, 9.5, 20); });
at('Street market', p => { put(p, 'hot_dog_stand', 1.5, 2.5, 90, { quiet: true }); put(p, 'pool_umbrella', 9.5, 1.5, 0, { quiet: true }); put(p, 'round_table', 10.5, 2.5, 0, { quiet: true }); put(p, 'cardboard_boxes', 1.5, 9.5, 30, { quiet: true }); });
/* the response streets round the mall: a cop car or two on every plot of them (the plan: "multiple blocks of police vehicles") */
['P08-08', 'P08-09', 'P09-11', 'P10-11', 'P11-11', 'P11-10', 'P11-09', 'P11-08'].forEach((id, i) => { const p = plotOf[id]; if (!p) return;
    const vert = p.cells[1][5] === 'R' && p.cells[10][5] === 'R';
    if (vert) { put(p, 'car_cop', 4.9, 1.5 + (i % 3), 10 + i * 7, { road: true, quiet: true }); put(p, 'car_cop', 7.1, 8.5 + (i % 2), 190 - i * 5, { road: true, quiet: true }); }
    else { put(p, 'car_cop', 1.5 + (i % 3), 4.9, 100 - i * 6, { road: true, quiet: true }); put(p, 'car_cop', 9.5 - (i % 2), 7.1, 280 + i * 5, { road: true, quiet: true }); } });
/* the hubs */
at('Hero plaza', p => { put(p, 'fountain', 5.5, 2.5, 0, { span: [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]] }); put(p, 'city_bench', 2.5, 1.5, 180); put(p, 'city_bench', 8.5, 1.5, 180); put(p, 'planter', 1.5, 3.5); put(p, 'planter', 10.5, 3.5); put(p, 'hot_dog_stand', 2.5, 8.5, 90); put(p, 'city_bench', 8.5, 9.5, 0); tree(p, 1.5, 9.5, 'tree_3', 3.8); tree(p, 10.5, 9.5, 'tree_3', 3.8); });
at('Civic plaza', p => { put(p, 'fountain', 2.5, 1.9, 0, { span: [[1, 0], [-1, 0]] }); put(p, 'angel_statue', 8.5, 1.9, 180); put(p, 'city_bench', 2.5, 10.2, 0); put(p, 'city_bench', 9.5, 10.2, 0); put(p, 'planter', 1.5, 9.5); put(p, 'planter', 10.5, 9.5); });
at('Memorial walk', p => { put(p, 'angel_statue', 9.0, 5.9, 270, { span: [[0, 1]] }); put(p, 'planter', 8.5, 4.5); put(p, 'planter', 8.5, 7.5); put(p, 'city_bench', 2.5, 2.5, 90); put(p, 'city_bench', 2.5, 8.5, 90); tree(p, 1.5, 1.5, 'tree_3', 3.6); tree(p, 10.5, 1.5, 'tree_3', 3.6); tree(p, 1.5, 10.5, 'tree_3', 3.6); tree(p, 10.5, 10.5, 'tree_3', 3.6); });
at('Transit square', p => { put(p, 'bus_shelter', 2.5, 8.2, 0); put(p, 'bus_shelter', 8.5, 8.2, 0); put(p, 'school_bus', 5.5, 9.8, 90, { span: [[1, 0], [-1, 0]] }); put(p, 'city_bench', 2.5, 2.5, 90); put(p, 'signpost', 4.5, 4.5); });
at('Transit court', p => { put(p, 'bus_shelter', 1.5, 1.5, 90, { quiet: true }); });
at('Bus stop court', p => { put(p, 'bus_shelter', 1.5, 9.5, 90, { quiet: true }); put(p, 'city_bench', 10.5, 1.5, 270, { quiet: true }); });
at('Taxi rank', p => { put(p, 'car_taxi', 1.6, 1.5, 0); put(p, 'car_taxi', 10.4, 1.5, 0); put(p, 'car_taxi', 1.6, 10.2, 180); put(p, 'car_taxi', 10.4, 10.2, 180); });
at('Taxi court', p => { put(p, 'car_taxi', 1.6, 1.5, 0, { quiet: true }); put(p, 'car_taxi', 1.6, 9.5, 0, { quiet: true }); });
/* the parks and the courts */
[['Park west', 0], ['Park east', 1], ['Campus green', 2]].forEach(a => at(a[0], p => { [[1.5, 1.5], [3.5, 3.5], [8.5, 1.5], [10.5, 3.5], [1.5, 8.5], [3.5, 10.5], [10.5, 10.5], [8.5, 8.5]].forEach((q, i) => tree(p, q[0], q[1], ['tree_3', 'tree', 'tree_2', 'tree_4'][(i + a[1]) % 4], 3.6 + (i % 3) * 0.4));
    put(p, 'park_bench', 4.5, 2.5, 90, { quiet: true }); put(p, 'park_bench', 7.5, 8.5, 270, { quiet: true }); if (a[1] === 1) put(p, 'fountain', 9.0, 5.0, 0, { quiet: true }); }));
at('Practice court', p => { put(p, 'field_goal_post', 2.5, 1.5, 180); put(p, 'field_goal_post', 2.5, 10.5, 0); put(p, 'field_goal_post', 8.5, 1.5, 180); put(p, 'field_goal_post', 8.5, 10.5, 0); put(p, 'park_bench', 1.5, 5.5, 90); put(p, 'park_bench', 10.5, 5.5, 270); });
at('Street court', p => { put(p, 'quarter_pipe', 1.5, 2.5, 90); put(p, 'quarter_pipe', 1.5, 8.5, 90); put(p, 'city_bench', 10.5, 2.5, 270); put(p, 'vending_machine', 10.5, 8.5, 270); });
at('Event square', p => { put(p, 'ticket_booth', 1.5, 1.5, 180, { quiet: true }); put(p, 'popcorn_cart', 10.5, 1.5, 180, { quiet: true }); });
at('Vendor stalls', p => { put(p, 'hot_dog_stand', 1.5, 1.5, 180, { quiet: true }); put(p, 'popcorn_cart', 10.5, 1.5, 180, { quiet: true }); put(p, 'pool_umbrella', 1.5, 10.5, 0, { quiet: true }); });
at('Park gate', p => { tree(p, 1.5, 10.2, 'tree_3', 3.8); tree(p, 4.5, 10.2, 'tree', 3.6); tree(p, 7.5, 10.2, 'tree_3', 3.8); tree(p, 10.5, 10.2, 'tree_2', 3.6); put(p, 'park_bench', 2.5, 1.6, 180); put(p, 'park_bench', 9.5, 1.6, 180); });
at('Canal walk', p => { tree(p, 1.5, 2.5, 'tree_3', 3.6); tree(p, 3.5, 5.5, 'tree', 3.6); tree(p, 2.5, 9.5, 'tree_3', 3.8); tree(p, 9.5, 9.5, 'tree_2', 3.6); put(p, 'park_bench', 8.5, 2.5, 270); put(p, 'park_bench', 6.5, 8.5, 0); });
/* the civic and the working plots */
at('Fire Station', p => { put(p, 'fire_truck', 1.5, 10.4, 90, { quiet: true, walk: true }); });
at('Police desk', p => { put(p, 'car_cop', 1.5, 10.4, 90, { quiet: true, walk: true }); put(p, 'car_cop', 10.5, 10.4, 90, { quiet: true, walk: true }); });
at('Military offices', p => { put(p, 'military_tank', 1.6, 10.3, 90, { quiet: true, walk: true }); });
at('Dock edge', p => { put(p, 'babel_crane', 2.5, 2.5, 90, { span: [[0, 1], [1, 0], [1, 1]] }); put(p, 'babel_crane', 2.5, 8.5, 90, { span: [[0, 1], [1, 0], [1, 1]] }); put(p, 'iso_tank', 8.5, 9.5, 0); put(p, 'iso_tank', 9.5, 8.5, 90); put(p, 'traffic_barrel', 8.5, 2.5); put(p, 'traffic_barrel', 9.3, 3.2); put(p, 'cardboard_boxes', 5.5, 9.5, 20); });
at('Hangar apron', p => { put(p, 'iso_tank', 1.5, 1.5, 0, { quiet: true }); put(p, 'traffic_barrel', 1.5, 10.5, 0, { quiet: true }); put(p, 'traffic_cone', 10.5, 10.5, 0, { quiet: true }); });
at('Observatory', p => { put(p, 'telescope', 10.5, 10.5, 200, { quiet: true, walk: true }); });

/* THE PLOTS' DRESSING, by district: every building's door is flanked (planters centred on the yard squares either side of the step; pots against
   the wall where the step is pavement), and a service district's first building has its dumpster on a yard square against a wall with no door */
const FLANK = { C: 'planter', F: 'planter', H: 'planter', U: 'planter', S: 'planter', B: 'planter', R: 'pot', E: 'bin', I: 'barrel' };
PLAN.plots.forEach(p => {
    p.buildings.forEach((b, bi) => {
        const dr = (b.doors || [])[0]; if (!dr) return;
        const fl = (dr.side === 'N' || dr.side === 'S') ? [[dr.ox - 1, dr.oy], [dr.ox + 1, dr.oy]] : [[dr.ox, dr.oy - 1], [dr.ox, dr.oy + 1]];
        fl.forEach((q, qi) => {
            if (q[0] < 0 || q[1] < 0 || q[0] >= N || q[1] >= N) return; const ch = p.cells[q[1]][q[0]], kind = FLANK[p.d];
            if (ch === '.' && kind === 'planter') put(p, 'planter', q[0] + 0.5, q[1] + 0.5, (dr.side === 'N' || dr.side === 'S') ? 0 : 90, { quiet: true });
            else if (ch === '.' && kind === 'barrel') { if (qi === 0) put(p, 'traffic_barrel', q[0] + 0.5, q[1] + 0.5, 0, { quiet: true }); }
            else if ((ch === '.' || ch === 'P') && kind !== 'barrel') put(p, kind === 'bin' ? (qi === 0 ? 'city_bin' : 'psx_planter_pot_mp_1_full') : 'psx_planter_pot_mp_1_full', q[0] + 0.5, q[1] + 0.5, 0, { quiet: true, walk: true });
        });
        if (bi === 0 && 'REIB'.indexOf(p.d) >= 0) {
            const sides = [['N', 0, -1], ['S', 0, 1], ['W', -1, 0], ['E', 1, 0]].filter(sd => !(b.doors || []).some(d => d.side === sd[0]));
            for (const sd of sides) { const lx = sd[1] ? (sd[1] < 0 ? b.x - 1 : b.x + b.w) : b.x + Math.floor(b.w / 2), ly = sd[2] ? (sd[2] < 0 ? b.y - 1 : b.y + b.h) : b.y + Math.floor(b.h / 2);
                if (lx < 0 || ly < 0 || lx >= N || ly >= N || p.cells[ly][lx] !== '.') continue;
                if (put(p, 'dumpster', lx + 0.5, ly + 0.5, { N: 180, S: 0, W: 90, E: 270 }[sd[0]], { quiet: true })) break; }
        }
    });
    if (p.d === 'B') [[1.5, 1.5], [10.5, 10.5]].forEach(q => put(p, 'palm_tree', q[0], q[1], null, { quiet: true }));
});
/* the kerbs: a hydrant / a signpost / a bin on the walk squares beside the carriageway, at the square's road edge, every few squares */
let kerbN = 0;
for (let cy = 0; cy < 144; cy++) for (let cx = 0; cx < 144; cx++) {
    if (cellAt(cx, cy) !== 'P' || occ.has(cx + ',' + cy)) continue;
    const side = cellAt(cx + 1, cy) === 'R' ? [0.4, 0] : cellAt(cx - 1, cy) === 'R' ? [-0.4, 0] : cellAt(cx, cy + 1) === 'R' ? [0, 0.4] : cellAt(cx, cy - 1) === 'R' ? [0, -0.4] : null; if (!side) continue;
    if (cellAt(cx + 1, cy) === 'P' && cellAt(cx - 1, cy) === 'P' && cellAt(cx, cy + 1) === 'P' && cellAt(cx, cy - 1) === 'P') continue;
    const along = side[0] ? cy : cx; if (along % 6 !== 2) continue;   // one every six squares, the same squares on both kerbs
    const key = ['signpost', 'city_bin', 'fire_hydrant', 'city_bin'][Math.floor(along / 6) % 4]; kerbN++;
    take(cx, cy); props.push({ key, x: r3(gc(cx) + side[0] * C), z: r3(gc(cy) + side[1] * C), face: side[0] > 0 ? 90 : side[0] < 0 ? 270 : side[1] > 0 ? 180 : 0 });
}

/* ── THE GROUND: a sheet per square (0 the asphalt, 1 pavement, 2 grass, 3 yard concrete) ── */
const paint = new Uint8Array(144 * 144);
for (let cy = 0; cy < 144; cy++) for (let cx = 0; cx < 144; cx++) {
    const ch = cellAt(cx, cy), dd = D[plotOf[pid(Math.floor(cx / N), Math.floor(cy / N))].d];
    paint[cy * 144 + cx] = ch === 'R' ? 0 : (ch === 'P' || ch === 'D') ? 1 : ch === 'I' ? 3 : dd.yard;
}
const b64 = Buffer.from(paint).toString('base64');

/* ── THE STREETS: the plan's road connections, joined into straight runs through the plot centres ── */
const pc = (p) => [r3(-HALF + (p.x + 0.5) * PL), r3(-HALF + (p.y + 0.5) * PL)];
const roadAdj = {}; PLAN.groundEdges.filter(e => e.type === 'road').forEach(e => { (roadAdj[e.a] = roadAdj[e.a] || []).push(e.b); (roadAdj[e.b] = roadAdj[e.b] || []).push(e.a); });
const streets = [], usedSeg = new Set();
const segKey = (a, b) => a < b ? a + '|' + b : b + '|' + a;
Object.keys(roadAdj).sort().forEach(a => {
    roadAdj[a].forEach(b => {
        if (usedSeg.has(segKey(a, b))) return;
        /* walk the straight line through a → b both ways */
        const pa = plotOf[a], pb = plotOf[b], dx = Math.sign(pb.x - pa.x), dy = Math.sign(pb.y - pa.y);
        let s = pa, e = pb;
        for (;;) { const nx = pid(s.x - dx, s.y - dy); if (roadAdj[s.id] && roadAdj[s.id].includes(nx)) s = plotOf[nx]; else break; }
        for (;;) { const nx = pid(e.x + dx, e.y + dy); if (roadAdj[e.id] && roadAdj[e.id].includes(nx)) e = plotOf[nx]; else break; }
        for (let q = s; q.id !== e.id;) { const nx = plotOf[pid(q.x + dx, q.y + dy)]; usedSeg.add(segKey(q.id, nx.id)); q = nx; }
        streets.push({ pts: [pc(s), pc(e)], w: 4 * C });
    });
});

/* ── THE TRAFFIC: two cars each way round the ring the plan's roads make north of Bayside ── */
const ctr = (x, y) => pc({ x, y });
const ring = [ctr(3, 1), ctr(8, 1), ctr(8, 7), ctr(3, 7)];
const TRAFFIC = [
    { pts: ring, loop: true, n: 2, speed: 4.0, lane: 3.5, kinds: ['suv', 'taxi', 'cadillac', 'schoolbus', 'truck'] },
    { pts: ring.slice().reverse(), loop: true, n: 2, speed: 4.0, lane: 3.5, kinds: ['taxi', 'suv', 'copcar', 'cadillac'] },
    { pts: [ctr(0, 7), ctr(3, 7)], loop: false, n: 1, speed: 3.4, lane: 3.5, kinds: ['truck', 'suv'] },
];
/* ── the room ── */
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/"/g, "'");
const spawnP = plotOf[PLAN.progression.start], sp = pc(spawnP);
const lines = [];
lines.push("        /* DC144-BEGIN — DISASTER CITY, THE 144 PLOTS (2026-11-13): written by `node bake-disaster-city.js` from docs/disaster-city/city-layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
lines.push("        site_prebuilt_downtown_city: {");
lines.push("            label: 'DISASTER CITY',");
lines.push("            sub: 'SOUTHSIDE · CIVIC CENTER · FINANCIAL · UNIVERSITY · HERO PLAZA · ENTERTAINMENT · INDUSTRIAL · SPORTS + CULTURE · BAYSIDE',");
lines.push("            kind: 'box', site: 'prebuilt_downtown', part: 'city',");
lines.push("            shell: hqCityShell({ w: " + (2 * HALF) + ", d: " + (2 * HALF) + ", plate: { x: " + sp[0] + ", z: " + sp[1] + ", y: 4.6 } }),");
lines.push("            parti: 'Nine districts of sixteen plots, every plot a twelve by twelve board: a city walked as a maze of yards, alleys, doors and roofs between a few plain roads.',");
lines.push("            typology: 'grid',");
lines.push("            dc144: { cell: " + C + ", plot: " + PL + ", plots: " + N + " },");
lines.push("            terrain: {");
lines.push("                res: 0.875,");
lines.push("                floor: 'urban:PlasterWallPainted1b', cliff: 'urban:ConcreteStriped2a', path: 'urban:TileGeneric1a', floorTint: '#8a8a8e',");
lines.push("                gen: { kind: 'city', seed: 144, allOpen: true, walkW: 0, kerb: 0, prisms: false, yardsOpen: false, packP: 0, streets: " + J(streets) + ",");
lines.push("                       open: [] },");
lines.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gc(0) + ", z0: " + gc(0) + ", nx: 144, nz: 144, d: '" + b64 + "' },");
lines.push("                features: [");
features.forEach(f => lines.push("                    " + J(f) + ","));
lines.push("                ],");
lines.push("                /* the cars: the ring (west avenue, the north street, the east avenue, the cross street), never the response streets round the mall */");
lines.push("                traffic: " + J(TRAFFIC) + ",");
lines.push("            },");
lines.push("            doors: [],");
lines.push("            counters: [],");
lines.push("            props: [");
props.forEach(f => lines.push("                " + J(f) + ","));
lines.push("            ],");
lines.push("            agents: [], npcSpots: [],");
lines.push("            spawn: { x: " + gc(spawnP.x * N + 8) + ", z: " + gc(spawnP.y * N + 5) + ", face: 90 },");
lines.push("        },");
lines.push("        /* DC144-END */");
const block = lines.join('\n') + '\n';
console.log(JSON.stringify(Object.assign({ features: features.length, props: props.length, streets: streets.length, bytes: block.length }, count)));
if (process.env.DC_DUMP) fs.writeFileSync(process.env.DC_DUMP, JSON.stringify({ C, HALF, features, props, bInfo, streets, cells: Array.from({ length: 144 }, (_, cy) => Array.from({ length: 144 }, (_, cx) => cellAt(cx, cy)).join('')), plots: PLAN.plots.map(p => ({ id: p.id, x: p.x, y: p.y, d: p.d, name: p.name })), districts: Object.keys(D).map(k => ({ id: k, label: D[k].label })) }));
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const b0 = src.indexOf('        /* DC144-BEGIN'), b1 = src.indexOf('        /* DC144-END */\n');
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + '        /* DC144-END */\n'.length);
else {
    const anchor = "        /* ── THE STREETS — the city round the ring road: the circuit, the traffic, the deck, the collapse ── */\n";
    const at = src.indexOf(anchor); if (at < 0) { console.error('anchor not found'); process.exit(1); }
    src = src.slice(0, at) + block + src.slice(at);
}
fs.writeFileSync(file, src);
console.log('data.js written');
