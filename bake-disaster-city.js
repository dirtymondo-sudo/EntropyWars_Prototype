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
/* THE DISTRICT FILES (2026-11-13, the one hook for the nine district threads): docs/disaster-city/districts/<LETTER>.js (R C F U H E I S B),
   one per district, so no district's code lands in this tool. A file may export any of: tailor(PLAN, plotOf) = here, before the plan is read;
   apply(ctx) = after the buildings + their door steps exist, before the street furniture (take() cells there to keep them clear);
   build(ctx) = after every row exists. ctx = { PLAN, plotOf, features, props, bInfo, lateRows, gx, gc, r3, take, free, cellAt, setCell,
   roofB, ROOF_H, C, N, HALF }. A district edits its own rows by id ('dc:' + building id) and pushes its own rows (arch rows to lateRows). */
const DISTRICTS = (() => { const dir = path.join(REPO, 'docs/disaster-city/districts'); return !fs.existsSync(dir) ? [] : fs.readdirSync(dir).filter(f => /^[A-Z]\.js$/.test(f)).sort().map(f => require(path.join(dir, f))); })();
const PROPS = require(path.join(REPO, 'docs/disaster-city/props.js'));   // THE PROP PASS: the kerb's road signs, the set dressing, the prop check
const dcOwn = new Set();                                                 // the props a district file stood (checked and reported, never moved)
let dcCtx = null;
const dcRun = stage => { const before = new Set(dcCtx.props); DISTRICTS.forEach(m => { if (typeof m[stage] === 'function') m[stage](dcCtx); }); dcCtx.props.forEach(q => { if (!before.has(q)) dcOwn.add(q); }); };
DISTRICTS.forEach(m => { if (typeof m.tailor === 'function') m.tailor(PLAN, plotOf); });
/* THE ROOM PAST THE PLOTS (2026-11-13, Bayside's beach: mondo "bayside needs to have the actual bayside in it too (the beach), with sand and a
   pier"): a district file may export `room = { east: <cells>, sea: { y, key, field } }`. `east` grows the room that many cells past the
   east edge of the plot grid; the engine's field is centred, so the shell grows the same on the west (closed behind a ghost wall on the
   city's old edge) and NO written coordinate moves. Cells with cx >= 144 are nobody's plot: a district paints them with
   ctx.paintCell(cx, cy, sheet) (the palette holds 8 sheets: 6 are the city's) and builds on them with its own rows. `backdropOpen` = boxes [x0, z0, x1, z1]
   (metres) where no skyline building stands (three-renderer.js _hqBuildCityBackdrop); the west skyline keeps the city's own edge (backdropInset). `sea` = the room's
   one water surface (data.js terrain.sea); the city's ground stays at 0, so only ground a district sinks under it is water. */
const ROOM = { east: Math.max(0, ...DISTRICTS.map(m => (m.room && +m.room.east) || 0)), sea: DISTRICTS.map(m => m.room && m.room.sea).filter(Boolean)[0] || null, backdropOpen: [].concat(...DISTRICTS.map(m => (m.room && m.room.backdropOpen) || [])) };
const paintExt = new Map();
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
/* the pack blocks' own size in metres, [along the front, deep] (data.js HQ_PACK_BUILDINGS) */
const PACK_W = { pack_bld_00: [28.18, 19.43], pack_bld_01: [34.05, 19.51], pack_bld_02: [40.8, 22.88], pack_bld_03: [23.19, 17.15], pack_bld_04: [25.49, 18.15], pack_bld_05: [29.79, 19.1],
    pack_bld_06: [33.45, 18.67], pack_bld_07: [24.88, 16.24], pack_bld_08: [15.52, 13.95], pack_bld_09: [16.89, 13.86] };
/* THE PACK FIT: the block (or two / three side by side) that fills a front `fw` metres long and `fd` deep at 0.9 to 1.15 of its true size, its depth
   stretched no more than 0.7 to 1.5 → { keys, s } or null. `want` (the plot's old pick) wins a tie. District threads: call this, never write a pack row's `w` by hand. */
function packFit(fw, fd, want) {
    const K = Object.keys(PACK_W); let best = null;
    const tryRow = keys => {
        const sum = keys.reduce((a, k) => a + PACK_W[k][0], 0), s = fw / sum; if (s < 0.9 || s > 1.15) return;
        let zs = 0; for (const k of keys) { const z = fd / (PACK_W[k][1] * s); if (z < 0.7 || z > 1.5) return; zs += Math.abs(Math.log(z)); }
        const cost = Math.abs(s - 1) * 4 + zs / keys.length + (keys.length - 1) * 0.15 - (keys.includes(want) ? 0.05 : 0);
        if (!best || cost < best.cost) best = { keys, s, cost };
    };
    K.forEach(a => { tryRow([a]); K.forEach(b => { if (b !== a) { tryRow([a, b]); K.forEach(c => { if (c !== a && c !== b) tryRow([a, b, c]); }); } }); });
    return best;
}
const PAL = ['urban:TileGeneric1a', 'grass_2', 'urban:ConcreteStriped2a', 'urban:TileGeneric2a', 'urban:TileGeneric3a', 'urban:ConcreteUnderTiles1'];   // 1 pavement · 2 grass · 3 yard concrete · 4 marble (financial) · 5 plaza paving (civic, hero plaza) · 6 bare concrete (industrial); 0 = the room's asphalt

/* ── the roof-route buildings (solid tiers whose roofs are walked) ── */
const roofB = new Set(); PLAN.roofEdges.forEach(e => { roofB.add(e.a); roofB.add(e.b); });
const ROOF_H = 7.0;   // two storeys of 3.5 m: every roof on a route stands level with the next (a bridge is level)

const features = [], props = [], bInfo = [], lateRows = [];
const count = { texb: 0, roofb: 0, infill: 0, bridges: 0, escapes: 0, trees: 0 };

/* ── THE BUILDINGS ── */
PLAN.plots.forEach(p => {
    const dd = D[p.d], ox = p.x * N, oy = p.y * N;
    p.buildings.forEach((b, bi) => {
        const x0 = ox + b.x, y0 = oy + b.y, x = r3((gx(x0) + gx(x0 + b.w)) / 2), z = r3((gx(y0) + gx(y0 + b.h)) / 2);
        const door = b.doors[0], side = door ? door.side : 'S';
        const rot = { S: 0, W: 90, N: 180, E: 270 }[side];
        /* THE FRONT IS THE ROW'S `w` (2026-11-13): a texbuilding's `w` runs ALONG ITS FRONT and `d` back from it, in the building's own turned
           frame (data.js hqTexBuildingRows), so a building that faces east or west has the plan's two sides the other way round. (They were
           written unturned: every east / west facing building that is not square stood a quarter turn off its footprint.) */
        const ew = side === 'E' || side === 'W', w = (ew ? b.h : b.w) * C, d = (ew ? b.w : b.h) * C;
        /* the doorway's square of the front, 1 = its left as you face the front from outside */
        let col = 0;
        if (door) { const k = side === 'S' ? (door.x - b.x) : side === 'N' ? (b.x + b.w - 1 - door.x) : side === 'E' ? (b.y + b.h - 1 - door.y) : (door.y - b.y); col = Math.round(k * C / 1.75) + 1; }   // the front's face squares are 1.75 m: the doorway is the left half of the plan's door square
        const style = pick(dd.styles);
        let st = TALL[b.name] || pick(dd.storeys);
        const info = { id: b.id, name: b.name, plot: p.id, d: p.d, x, z, w: b.w * C, d2: b.h * C, side, cx0: x0, cy0: y0, cw: b.w, ch: b.h, st };
        if (roofB.has(b.id)) {
            /* a roof-route building: a solid building tier, its flat roof the walk (the plan's inside stair is a fire escape outside) */
            features.push({ k: 'plateau', id: 'dc:' + b.id, x, z, w: r3(b.w * C), d: r3(b.h * C), h: ROOF_H, edge: 0.3, bld: { style, seed: features.length } });
            info.roof = ROOF_H; count.roofb++;
        } else {
            const row = { k: 'texbuilding', id: 'dc:' + b.id, x, z, w: r3(w), d: r3(d), rot, storeys: st, style, seed: features.length };
            if (b.name === 'Church') { row.key = 'church_1'; delete row.style; }
            else if (PACKED[b.name] && bi === 0) {
                /* THE SHOP BLOCKS AT THEIR OWN SIZE (2026-11-13, mondo: "make sure their scale is correct, right now they are way too small and i
                   am taller than the door"): a pack block is a whole model the engine fits to the row's `w` (one scale, the height and the
                   doors with it), so a 33 m block on a 10 m front stood at a third of its size. packFit picks the block, or the row of blocks
                   side by side, whose own width fills the front at 0.9 to 1.15 of true size; the front is the first door side that takes one. */
                let fit = null, fs = side;
                for (const dr of b.doors.length ? b.doors : [{ side }]) { const e2 = dr.side === 'E' || dr.side === 'W'; fit = packFit((e2 ? b.h : b.w) * C, (e2 ? b.w : b.h) * C, PACKED[b.name]); if (fit) { fs = dr.side; break; } }
                if (!fit) { row.key = 'shop'; row.storeys = Math.min(st, 3); delete row.style; }   // a front no block fits at true size: the painted shop
                else {
                    const e2 = fs === 'E' || fs === 'W', fw = (e2 ? b.h : b.w) * C, fd = (e2 ? b.w : b.h) * C, q = { S: 0, W: 90, N: 180, E: 270 }[fs] * Math.PI / 180;
                    let u = -fw / 2;
                    fit.keys.forEach((k, i) => {
                        const bw = PACK_W[k][0] * fit.s, cu = u + bw / 2; u += bw;
                        const r2 = i === 0 ? row : { k: 'texbuilding', id: 'dc:' + b.id + '-s' + (i + 1), storeys: st, seed: 9000 + lateRows.length };
                        r2.x = r3(x + cu * Math.cos(q)); r2.z = r3(z + cu * Math.sin(q)); r2.w = r3(bw); r2.d = r3(fd); r2.rot = { S: 0, W: 90, N: 180, E: 270 }[fs]; r2.key = k; delete r2.style;
                        if (i > 0) { lateRows.push(r2); count.texb++; }   // written after every other row, so no other building's seed moves
                    });
                    count.packs = (count.packs || 0) + fit.keys.length;
                }
            }
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
let edgeCut = 0;
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
        const row = { k: 'texbuilding', id: 'dc:in' + count.infill, x: r3((gx(x0) + gx(x1)) / 2), z: r3((gx(z0) + gx(z1)) / 2), w: r3((horizontal ? x1 - x0 : z1 - z0) * C), d: r3((horizontal ? z1 - z0 : x1 - x0) * C), rot, storeys: deep === 1 ? pick([1, 1, 2]) : pick([1, 2, 2, 3]), seed: features.length };
        if (len <= 3 && rnd() < 0.55) row.key = pick(INFILL[p.d]); else row.style = pick(dd.styles);
        /* THE NATURAL EDGES (2026-11-13, mondo: "having these fake buildings as barriers doesnt feel right"): no filler building on the
           city's OUTER line (the land past it is the view: mountains, forest, desert, the bay). The draw is still made and the id still
           counted, so no other building's seed, id or look moves; the band stays '#', so THE BOUNDARIES give it the side's own edge stop.
           Bayside's east line is the beach's (the Bayside thread's). */
        if (r.outer && !(p.d === 'B' && !horizontal && L === N)) { count.infill++; edgeCut++; count.edgeCut = edgeCut; return; }
        row.seed += edgeCut;
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
const free = (cx, cy, ok) => { if (cx < 0 || cy < 0 || cx >= 144 || cy >= 144) return false; const ch = cellAt(cx, cy); return (ok || '.#').indexOf(ch) >= 0 && !occ.has(cx + ',' + cy); };
const take = (cx, cy) => occ.add(cx + ',' + cy);
bInfo.forEach(b => (plotOf[b.plot].buildings.find(q => q.id === b.id).doors || []).forEach(dr => take(plotOf[b.plot].x * N + dr.ox, plotOf[b.plot].y * N + dr.oy)));   // a door's step stays clear
const paintCell = (cx, cy, key) => { let i = PAL.indexOf(key); if (i < 0) { if (PAL.length >= 8) throw new Error('the ground palette is full (8 sheets): ' + key); PAL.push(key); i = PAL.length - 1; } paintExt.set(cx + ',' + cy, i + 1); };
/* ── THE LEVELS (THE VERTICAL CITY, 2026-11-13 — mondo: "Streets that slope, ramps, stairs ... different districts should have different
   elevations, bayside being the lowest (sea level), and there can be different elevations within the districts from plot to plot and even
   within plots"; his OK on the elevation plan 18:30). docs/disaster-city/levels.js holds a level per plot (one level = 1.75 m). The room's
   ground is `terrain.slope.cells` (data.js hqTerrainSlopeFn): every square with its own four corner heights, written at the end of this
   tool (THE LEVELS, THE GROUND). Here, before anything is dressed: THE CROSSINGS' STAIRS. Where the plan lets a walk cross two plots on
   different levels, a flight of the stairs pack climbs it (one level a square: the stair pitch), on the lower plot's squares first, then cut
   into the upper plot's; where one level is crossed on a walk two squares wide, one square is the stair and the other a smooth ramp three
   squares long (a bank to skate). Their squares are taken, so nothing is dressed onto a flight. ── */
const LEVELS = require(path.join(REPO, 'docs/disaster-city/levels.js')), LVM = LEVELS.M;
const lvOf = p => LEVELS.grid[p.y][p.x];
const plotAtCell = (cx, cy) => plotOf[pid(Math.floor(cx / N), Math.floor(cy / N))];
const roadFollow = (cx, cy) => {   // a carriageway square, or the pavement square beside one (the kerb walk): they ride the street's slope
    if (!inCity(cx, cy)) return false; const ch = cellAt(cx, cy); if (ch === 'R') return true; if (ch !== 'P') return false;
    const px = Math.floor(cx / N), py = Math.floor(cy / N);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (inCity(x, y) && Math.floor(x / N) === px && Math.floor(y / N) === py && cellAt(x, y) === 'R') return true; }
    return false;
};
const npcSpots = [];   // THE PEOPLE a district stands in the city (ctx.npcSpots: { x, z, face, race, say }), written to the room's npcSpots
dcCtx = { PLAN, plotOf, features, props, bInfo, lateRows, npcSpots, gx, gc, r3, take, free, cellAt, setCell, roofB, ROOF_H, C, N, HALF, LEVELS, lvOf, ROOM, paintCell };
dcRun('apply');

/* ── THE DOORS (mondo 11-13 14:10, the decision card: "Replace today's streets with it"): this room IS `site_prebuilt_downtown_streets` now, so every
   door that led to the old streets leads here. Each stands FREE (wall: 'free') where the plan has its place: the tower's on the Superhero Tower's
   doorway, the mall's on the Mall concourse's, the sewer's on the Pump court's, the metro stair in the Transit square, the harbour at the Boardwalk
   exit, the bay door (D.O.O.R.) in the Arrival court (the plan's start), the two roads at the road net's two dead ends, the taxi at the Taxi rank. ── */
const FACE = { N: 0, E: 90, S: 180, W: 270 }, JOIN = {};
const plotNamed = n => plotOf[n] || PLAN.plots.find(p => p.name === n);
const bldDoor = (plotName, bName) => { const p = plotNamed(plotName), b = p.buildings.find(q => q.name === bName) || p.buildings[0], dr = b.doors[0], v = SIDE[dr.side];
    const cx = p.x * N + dr.ox, cy = p.y * N + dr.oy; take(cx, cy); take(cx + v[0], cy + v[1]);
    return { x: r3(gc(cx) - v[0] * (C / 2 - 0.25)), z: r3(gc(cy) - v[1] * (C / 2 - 0.25)), face: FACE[dr.side] }; };
const spot = (plotName, lx, ly, face, ok) => { const p = plotNamed(plotName); let best = null;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (!free(p.x * N + x, p.y * N + y, ok || '.P')) continue; const d = Math.hypot(x - lx, y - ly); if (!best || d < best[0]) best = [d, x, y]; }
    const cx = p.x * N + best[1], cy = p.y * N + best[2]; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) take(cx + dx, cy + dy);
    return { x: gc(cx), z: gc(cy), face }; };
JOIN.tower = bldDoor('Superhero Tower', 'Superhero Tower'); JOIN.mall = bldDoor('Mall concourse', 'Mall concourse'); JOIN.sewer = bldDoor('Pump court', 'Pump court');
JOIN.metro = spot('Transit square', 5, 2, 180); JOIN.harbour = spot('Boardwalk exit', 9, 9, 180); JOIN.bay = spot('Arrival court', 9, 6, 270);
JOIN.downtown_strip = spot('P00-07', 1, 6, 270, 'RP.'); JOIN.stadium_downtown = spot('P03-00', 5, 1, 0, 'RP.');
JOIN.garage_taxi = spot('Taxi rank', 3, 3, 270, '.P'); JOIN.streets_strip = spot('Church', 8, 8, 270); JOIN.streets_drain = spot('Canal walk', 6, 8, 270); JOIN.docks_sewer = spot('Dock edge', 6, 6, 90);

/* THE LEVELS, THE CROSSINGS' STAIRS (after the doors above have their squares, before anything is dressed) */
const lvCut = new Map(), lvStairs = [], lvCount = { flights: 0, ramps: 0, cut: 0, steep: 0, closed: 0 };
PLAN.plots.forEach(p => {
    [['E', 1, 0], ['S', 0, 1]].forEach(([s, dx, dy]) => {
        const q = plotOf[pid(p.x + dx, p.y + dy)]; if (!q || p.ports[s] !== 'walk') return;
        const d = Math.abs(lvOf(p) - lvOf(q)); if (!d) return;
        const hiP = lvOf(p) > lvOf(q) ? p : q, loP = hiP === p ? q : p, lineC = (dx ? p.x + 1 : p.y + 1) * N;   // the plot line, in squares
        const toLo = loP === q ? 1 : -1;                                                                            // the lower plot is on the line's + side or its − side
        /* a square of the crossing: `k` along the line (a global square index), `i` squares back from the line on a side */
        const sq = (k, side, i) => { const a = side > 0 ? lineC + i : lineC - 1 - i; return dx ? [a, k] : [k, a]; };
        const walkSq = (c) => inCity(c[0], c[1]) && 'P.G'.indexOf(cellAt(c[0], c[1])) >= 0 && !roadFollow(c[0], c[1]);
        const ks = []; for (let k = 0; k < N; k++) { const g = (dx ? p.y : p.x) * N + k; if (walkSq(sq(g, 1, 0)) && walkSq(sq(g, -1, 0))) ks.push(g); }
        if (!ks.length) { console.warn("THE LEVELS: a walk the plan joins has no open square on the line", p.id, s, q.id); lvCount.closed++; return; }
        const runs = []; ks.forEach(k => { const r = runs[runs.length - 1]; if (r && r[r.length - 1] === k - 1) r.push(k); else runs.push([k]); });
        runs.forEach(run => {
            const avail = (side, cols, max) => { let n = 0; while (n < max && cols.every(k => { const c = sq(k, side, n); return walkSq(c) && !occ.has(c[0] + ',' + c[1]); })) n++; return n; };
            /* one level on a walk two squares wide: a stair on one square, a ramp three squares long on the other */
            let cols = run, rampK = null;
            if (d === 1 && run.length >= 2) { const rk = ((p.x + p.y) % 2) ? run[run.length - 1] : run[0]; if (avail(toLo, [rk], 4) >= 4) { rampK = rk; cols = run.filter(k => k !== rk); } }
            const nLo = Math.min(d, avail(toLo, cols, d + 1)), nHi = Math.min(d - nLo, avail(-toLo, cols, d + 1)), m = nLo + nHi;
            if (!m) { console.warn('THE LEVELS: no room for a stair', p.id, s, q.id); lvCount.closed++; return; }
            const per = d * LVM / m;   // metres a square
            if (per / C > 1.001) { console.warn('THE LEVELS: a stair steeper than the walk climbs', p.id, s, q.id, 'squares', m, 'levels', d); lvCount.steep++; }
            const along = (cols[0] + cols[cols.length - 1] + 1) / 2, lineM = gx(lineC), fa = r3(lineM + toLo * nLo * C), ta = r3(lineM - toLo * nHi * C), am = gx(along);
            const row = { k: 'ramp', id: 'dc:stair:' + p.id + s + (runs.length > 1 ? ':' + run[0] : ''), absY: true, x0: dx ? fa : am, z0: dx ? am : fa, x1: dx ? ta : am, z1: dx ? am : ta, w: r3(cols.length * C), h0: r3(lvOf(loP) * LVM), h1: r3(lvOf(hiP) * LVM), stairs: true, model: LEVELS.stairs[loP.d] || 'concrete', edge: 0.01 };
            features.push(row); lvStairs.push(row); lvCount.flights++;
            cols.forEach(k => {
                for (let i = 0; i < nHi; i++) { const c = sq(k, -toLo, i); lvCut.set(c[0] + ',' + c[1], { x: !!dx, line: lineC, dir: -toLo, m: nHi, h0: lvOf(hiP) * LVM - nHi * per, h1: lvOf(hiP) * LVM }); lvCount.cut++; }
                for (let i = 0; i <= nLo; i++) { const c = sq(k, toLo, i); take(c[0], c[1]); }
                for (let i = 0; i <= nHi; i++) { const c = sq(k, -toLo, i); take(c[0], c[1]); }
            });
            if (rampK != null) {
                const rm = gc(rampK), f3 = r3(lineM + toLo * 3 * C);
                features.push({ k: 'ramp', id: 'dc:ramp:' + p.id + s, absY: true, x0: dx ? f3 : rm, z0: dx ? rm : f3, x1: dx ? lineM : rm, z1: dx ? rm : lineM, w: C, h0: r3(lvOf(loP) * LVM), h1: r3(lvOf(hiP) * LVM), edge: 0.2 });
                for (let i = 0; i <= 3; i++) { const c = sq(rampK, toLo, i); take(c[0], c[1]); }
                { const c = sq(rampK, -toLo, 0); take(c[0], c[1]); }
                lvCount.ramps++;
            }
        });
    });
});

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
/* THE NATURAL EDGES (2026-11-13): what the land past each side is (three-renderer.js _hqBuildEdgeLand reads `terrain.edges`), and what
   stands on the city's outer line in front of it. North = the high side: steep mountains (they turn the north-west corner and run a way
   down the west side, and end in a headland over the bay in the north-east); west = tall forest on the hillside; south = flat desert;
   east = the bay (sea cliffs north of Bayside's beach). */
const EDGES = { reach: 440, n: { kind: 'mountain' }, w: { kind: 'forest', cap: { kind: 'mountain', at: 'n', len: 170 } }, s: { kind: 'desert' }, e: { kind: 'coast' } };
const EDGE_STOP = { n: ['trees', 'wall:1.2'], w: ['trees', 'trees'], s: ['rail:guard', 'rail:cable_fence'], e: ['rail:parapet', 'rail:pipe'] };
const edgeN = {};
for (let L = 0; L <= N; L++) for (const horizontal of [true, false]) for (let k = 0; k < N; k++) {
    const line = L * N, PA = plotOf[horizontal ? pid(k, L - 1) : pid(L - 1, k)], PB = plotOf[horizontal ? pid(k, L) : pid(L, k)];
    const joined = !!(PA && PB && conn.has(PA.id + '|' + PB.id)), home = (PA && PB) ? (rnd() < 0.5 ? PA : PB) : (PA || PB), dd = D[home.d];
    const list = (joined ? LOW : HIGH)[home.d]; let first = pick(list), second = pick(list); if (second === first) second = list[(list.indexOf(first) + 1) % list.length];
    /* THE NATURAL EDGES: the city's outer line wears its side's own edge stop (EDGE_STOP), never a district's yard wall: you see the land
       past it. Bayside's own outer lines stay the district's (the beach is the Bayside thread's). */
    if (!(PA && PB) && home.d !== 'B') { const es = EDGE_STOP[horizontal ? (L === 0 ? 'n' : 's') : (L === 0 ? 'w' : 'e')]; first = es[0]; second = es[1]; }
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
            const tl = sideA ? 1 : -1, inFace = horizontal ? (sideA ? 0 : 180) : (sideA ? 270 : 90), off = (kind === 'hedge' ? 0.2 : 0.29) * C * tl;   // THE PROP PASS: a bench's back a hand's width clear of the fence (0.36 touched it; a hedge is 0.9 m thick)
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
    const open2 = (cx, cy) => inCity(cx, cy) && '.#P'.indexOf(cellAt(cx, cy)) >= 0;
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
    /* THE STEEL LANDING (2026-11-13, mondo: no raised terrain lump beside a ladder): the halfway landing is a `landing` row, a steel
       platform the walker stands on (data.js hqTerrainLandings), the ladders as before: the yard to the landing, the landing to the roof */
    if (side === 'E') features.push({ k: 'landing', x: r3(E + 0.85), z: zc, w: 1.7, d: 2.6, h: h2, back: 270 }, { k: 'climb', x: r3(E + 1.7), z: r3(zc + 0.6), face: 270, look: 'fireescape' }, { k: 'climb', x: r3(E), z: r3(zc - 0.6), face: 270, look: 'fireescape' });
    if (side === 'W') features.push({ k: 'landing', x: r3(W - 0.85), z: zc, w: 1.7, d: 2.6, h: h2, back: 90 }, { k: 'climb', x: r3(W - 1.7), z: r3(zc - 0.6), face: 90, look: 'fireescape' }, { k: 'climb', x: r3(W), z: r3(zc + 0.6), face: 90, look: 'fireescape' });
    if (side === 'S') features.push({ k: 'landing', x: xc, z: r3(Sz + 0.85), w: 2.6, d: 1.7, h: h2, back: 0 }, { k: 'climb', x: r3(xc - 0.6), z: r3(Sz + 1.7), face: 0, look: 'fireescape' }, { k: 'climb', x: r3(xc + 0.6), z: r3(Sz), face: 0, look: 'fireescape' });
    if (side === 'N') features.push({ k: 'landing', x: xc, z: r3(Nz - 0.85), w: 2.6, d: 1.7, h: h2, back: 180 }, { k: 'climb', x: r3(xc + 0.6), z: r3(Nz - 1.7), face: 180, look: 'fireescape' }, { k: 'climb', x: r3(xc - 0.6), z: r3(Nz), face: 180, look: 'fireescape' });
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
const DECOR = new Set(['city_bench', 'park_bench', 'city_bin', 'signpost', 'fire_hydrant', 'traffic_cone', 'cardboard_boxes', 'psx_planter_pot_mp_1_full', 'round_table', 'pool_umbrella', 'vending_machine']);
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
at('Civic plaza', p => { put(p, 'fountain', 2.5, 1.9, 0, { span: [[1, 0], [-1, 0]] }); put(p, 'angel_statue', 8.5, 1.9, 180); put(p, 'city_bench', 4.6, 10.4, 0); put(p, 'city_bench', 9.5, 10.2, 0); put(p, 'planter', 1.5, 9.5); put(p, 'planter', 10.5, 9.5); });
at('Memorial walk', p => { put(p, 'angel_statue', 9.0, 5.9, 270, { span: [[0, 1]] }); put(p, 'planter', 8.5, 4.5); put(p, 'planter', 8.5, 7.5); put(p, 'city_bench', 2.5, 2.5, 90); put(p, 'city_bench', 2.5, 8.5, 90); tree(p, 1.5, 1.5, 'tree_3', 3.6); tree(p, 10.5, 1.5, 'tree_3', 3.6); tree(p, 1.5, 10.5, 'tree_3', 3.6); tree(p, 10.5, 10.5, 'tree_3', 3.6); });
at('Transit square', p => { put(p, 'bus_shelter', 2.5, 8.2, 0); put(p, 'bus_shelter', 8.5, 8.2, 0); put(p, 'school_bus', 5.5, 9.8, 90, { span: [[1, 0], [-1, 0]] }); });   // the metro entrance + the bus terminal's roof: districts/C.js
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
at('Fire Station', p => { put(p, 'fire_truck', 4.71, 10.75, 180, { quiet: true, walk: true }); });   // nosing out of the middle engine bay (districts/C.js)
at('Police desk', p => { put(p, 'car_cop', 4.6, 2.75, 20, { quiet: true, walk: true }); put(p, 'car_cop', 4.65, 6.95, 165, { quiet: true, walk: true }); });   // either side of the precinct's entrance
at('Military offices', p => { put(p, 'military_tank', 2.7, 9.7, 0, { quiet: true, walk: true }); });
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
        /* THE VENDING MACHINES (mondo 11-13): two squares along the wall from the door, backs to the wall, facing out: a pair at every door of
           the entertainment district, one at the first door of a civic / university / sports / plaza / bayside plot */
        if ('E'.indexOf(p.d) >= 0 || (bi === 0 && 'CUSHB'.indexOf(p.d) >= 0)) {
            const vs = (dr.side === 'N' || dr.side === 'S') ? [[dr.ox + 2, dr.oy], [dr.ox - 2, dr.oy]] : [[dr.ox, dr.oy + 2], [dr.ox, dr.oy - 2]];
            let n = 0;
            for (const q of vs) { if (n >= (p.d === 'E' && bi === 0 ? 2 : 1)) break; if (q[0] < 0 || q[1] < 0 || q[0] >= N || q[1] >= N) continue;
                const wallBehind = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[dr.side];
                if ('I'.indexOf(cellAt(p.x * N + q[0] + wallBehind[0], p.y * N + q[1] + wallBehind[1])) < 0) continue;
                if (put(p, 'vending_machine', q[0] + 0.5, q[1] + 0.5, { N: 0, S: 180, W: 270, E: 90 }[dr.side], { quiet: true, walk: true })) { n++; count.vending = (count.vending || 0) + 1; } }
        }
        if (bi === 0 && 'REIB'.indexOf(p.d) >= 0) {
            const sides = [['N', 0, -1], ['S', 0, 1], ['W', -1, 0], ['E', 1, 0]].filter(sd => !(b.doors || []).some(d => d.side === sd[0]));
            for (const sd of sides) { const lx = sd[1] ? (sd[1] < 0 ? b.x - 1 : b.x + b.w) : b.x + Math.floor(b.w / 2), ly = sd[2] ? (sd[2] < 0 ? b.y - 1 : b.y + b.h) : b.y + Math.floor(b.h / 2);
                if (lx < 0 || ly < 0 || lx >= N || ly >= N || p.cells[ly][lx] !== '.') continue;
                if (put(p, 'dumpster', lx + 0.5, ly + 0.5, { N: 180, S: 0, W: 90, E: 270 }[sd[0]], { quiet: true })) break; }
        }
    });
    if (p.d === 'B') [[1.5, 1.5], [10.5, 10.5]].forEach(q => put(p, 'palm_tree', q[0], q[1], null, { quiet: true }));
});
/* THE KERBS (mondo 11-13: "so many street lamps ... What about fire hydrants? Vending machines? Bus stations?"), one rule for every street,
   counted on each plot's own twelve squares so every block reads the same:
   - THE STREET LAMPS stand on the kerb, ON THE LINE BETWEEN TWO SQUARES (never on a square's middle), head over the road: the +side kerb on
     lines 2 and 8, the other kerb on lines 5 and 11 (a lamp every 21 m a side, staggered across the street)
   - a FIRE HYDRANT on square 2 of the +side kerb, a signpost on square 2 of the other, a bin on square 8 of both, at the square's road edge
   - a BUS STOP (the shelter, centred on its walk square, open to the road) on squares 4-6 of one kerb of every other road plot */
let kerbN = 0; const lamps = [], busAt = new Set(); count.bus = 0; count.hydrants = 0;
const kerbSides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isKerb = (cx, cy, sd) => cellAt(cx, cy) === 'P' && cellAt(cx + sd[0], cy + sd[1]) === 'R';
const lampAdd = (x, z, nx, nz) => { if (lamps.some(l => Math.hypot(l.x - x, l.z - z) < 3)) return; lamps.push({ x: r3(x), z: r3(z), nx, nz }); };
/* the bus stops first (they take three squares) */
PLAN.plots.forEach(p => {
    if ((p.x + p.y * 2) % 2) return;
    for (const sd of kerbSides) {
        let done = false;
        for (let t = 0; t < N && !done; t++) {
            const run = [4, 5, 6].map(a => sd[0] ? [p.x * N + t, p.y * N + a] : [p.x * N + a, p.y * N + t]);
            if (!run.every(c => isKerb(c[0], c[1], sd) && !occ.has(c[0] + ',' + c[1]))) continue;
            run.forEach(c => { take(c[0], c[1]); busAt.add(c[0] + ',' + c[1]); });
            props.push({ key: 'bus_shelter', x: r3(gc(run[1][0])), z: r3(gc(run[1][1])), face: sd[0] > 0 ? 90 : sd[0] < 0 ? 270 : sd[1] > 0 ? 180 : 0 });
            count.bus++; done = true;
        }
        if (done) break;
    }
});
/* THE BUS LINE (THE CITY TRAFFIC, mondo 11-13: "Bus sections placed in each district with a bus route"): Bus Line 1 has one named stop in
   every district, on a plot its route drives through. A stop uses the shelter the rule above already stood on that plot's kerb; a plot
   with none gets one where three kerb squares in a row are free, nearest the plot's middle, without moving a lamp, a hydrant or a bin. Each stop: the point on the road's middle where the bus
   waits, a stop sign pole on the kerb two squares along from the shelter and one on the kerb across the road (poles at the square's road
   edge, never on a square's middle). The ninth stop is the line's end at the police line (THE TRAFFIC below turns the bus round there). */
const BUS_LINE = ['P03-02', 'P04-01', 'P08-02', 'P08-05', 'P06-07', 'P03-05', 'P03-09', 'P04-11'];
const BUS_END = { x: 7.4, y: 11, back: 12 };   // the turn-round on the south street, in plot squares; the bus waits `back` m after it
const busStops = []; count.busNew = 0;
const cellOf = v => Math.floor((v + HALF) / C);
const shFace = sd => sd[0] > 0 ? 90 : sd[0] < 0 ? 270 : sd[1] > 0 ? 180 : 0;
BUS_LINE.forEach(id => {
    const p = plotOf[id]; let sh = null;
    props.forEach(q => { if (sh || q.key !== 'bus_shelter') return; const cx = cellOf(q.x), cy = cellOf(q.z); if (Math.floor(cx / N) !== p.x || Math.floor(cy / N) !== p.y) return;
        const sd = kerbSides.find(k => isKerb(cx, cy, k)); if (sd) sh = { cx, cy, sd }; });
    if (!sh) {
        let best = null;
        for (const sd of kerbSides) for (let t = 0; t < N; t++) for (let a = 1; a <= 8; a++) {
            const run = [a, a + 1, a + 2].map(k => sd[0] ? [p.x * N + t, p.y * N + k] : [p.x * N + k, p.y * N + t]);
            if (!run.every(c => isKerb(c[0], c[1], sd) && !occ.has(c[0] + ',' + c[1]))) continue;
            /* nothing the kerb rule stands moves for it: the shelter fills its middle square only, so that square is never a hydrant's, a
               signpost's or a bin's (2 and 8) nor one beside a lamp's line (the + kerb's 2 and 8, the other's 5 and 11) */
            const mid = a + 1, plus = sd[0] > 0 || sd[1] > 0, clash = mid === 2 || mid === 8 || (plus ? [1, 7] : [4, 5, 10, 11]).includes(mid);
            const score = Math.abs(a - 4) + (clash ? 100 : 0); if (!best || score < best.score) best = { run, sd, score };
        }
        if (!best) { console.warn('no free kerb for a bus stop on', id, p.name); return; }
        if (best.score >= 100) console.warn('a bus stop moves kerb furniture on', id, p.name);
        { const c = best.run[1]; take(c[0], c[1]); busAt.add(c[0] + ',' + c[1]); }
        props.push({ key: 'bus_shelter', x: r3(gc(best.run[1][0])), z: r3(gc(best.run[1][1])), face: shFace(best.sd) });
        count.bus++; count.busNew++;
        sh = { cx: best.run[1][0], cy: best.run[1][1], sd: best.sd };
    }
    const sd = sh.sd, al = sd[0] ? [0, 1] : [1, 0], signs = [];
    const pole = (cx, cy, k) => ({ x: r3(gc(cx) + k[0] * 0.36 * C), z: r3(gc(cy) + k[1] * 0.36 * C), ns: !!sd[0] });
    for (const k of [2, -2]) { const cx = sh.cx + al[0] * k, cy = sh.cy + al[1] * k; if (isKerb(cx, cy, sd) && !busAt.has(cx + ',' + cy)) { signs.push(pole(cx, cy, sd)); break; } }
    { const cx = sh.cx + sd[0] * 5, cy = sh.cy + sd[1] * 5, op = [-sd[0], -sd[1]]; if (isKerb(cx, cy, op) && !busAt.has(cx + ',' + cy)) signs.push(pole(cx, cy, op)); }
    busStops.push({ x: r3(sd[0] ? gc(sh.cx) + sd[0] * 2.5 * C : gc(sh.cx)), z: r3(sd[0] ? gc(sh.cy) : gc(sh.cy) + sd[1] * 2.5 * C), name: D[p.d].label, signs });
});
{ const ex = r3(-HALF + (BUS_END.x + 0.5) * PL - BUS_END.back), ez = r3(-HALF + (BUS_END.y + 0.5) * PL), cx = cellOf(ex), cy = cellOf(ez) - 3, signs = [];
  if (isKerb(cx, cy, [0, 1])) signs.push({ x: r3(gc(cx)), z: r3(gc(cy) + 0.36 * C), ns: false }); else console.warn('no kerb for the end stop sign');
  busStops.push({ x: ex, z: ez, name: 'BAYSIDE GATE', end: true, signs }); }
count.busStops = busStops.length;
for (let cy = 0; cy < 144; cy++) for (let cx = 0; cx < 144; cx++) {
    if (cellAt(cx, cy) !== 'P') continue;
    kerbSides.forEach(sd => {
        if (!isKerb(cx, cy, sd)) return;
        const plus = sd[0] > 0 || sd[1] > 0, along = (sd[0] ? cy : cx), a = along % N;
        /* the lamp on the line before this square */
        if (a === (plus ? 2 : 5) || a === (plus ? 8 : 11)) {
            const px = sd[0] ? cx : cx - 1, py = sd[0] ? cy - 1 : cy;
            if (isKerb(px, py, sd) && !busAt.has(cx + ',' + cy) && !busAt.has(px + ',' + py))
                lampAdd(sd[0] ? gc(cx) + sd[0] * 0.4 * C : gc(cx) - C / 2, sd[0] ? gc(cy) - C / 2 : gc(cy) + sd[1] * 0.4 * C, -sd[0], -sd[1]);
        }
    });
    if (occ.has(cx + ',' + cy)) continue;
    const sd = kerbSides.find(q => isKerb(cx, cy, q)); if (!sd) continue;
    if (cellAt(cx + 1, cy) === 'P' && cellAt(cx - 1, cy) === 'P' && cellAt(cx, cy + 1) === 'P' && cellAt(cx, cy - 1) === 'P') continue;
    const plus = sd[0] > 0 || sd[1] > 0, a = (sd[0] ? cy : cx) % N;
    /* THE PROP PASS (mondo 11-13): the kerb's sign is a real road sign turned to its lane's traffic (was a wooden country signpost); the kerb's bin is the green subway bin */
    const key = a === 2 ? (plus ? 'fire_hydrant' : 'signpost') : a === 8 ? 'metro_bin' : null; if (!key) continue;
    kerbN++; if (key === 'fire_hydrant') count.hydrants++;
    take(cx, cy);
    if (key === 'signpost') { const sg = PROPS.kerbSign(sd, cx, cy, ['P03-00', 'P00-07'].includes(plotAtCell(cx, cy).id)); props.push({ key: sg.key, x: r3(gc(cx) + sd[0] * 0.4 * C), z: r3(gc(cy) + sd[1] * 0.4 * C), face: sg.face, h: sg.h }); count.signs = (count.signs || 0) + 1; }
    else props.push({ key, x: r3(gc(cx) + sd[0] * (key === 'metro_bin' ? 0.36 : 0.4) * C), z: r3(gc(cy) + sd[1] * (key === 'metro_bin' ? 0.36 : 0.4) * C), face: sd[0] > 0 ? 90 : sd[0] < 0 ? 270 : sd[1] > 0 ? 180 : 0 });
}
/* a plot with no street (a plaza, a park, a court): a lamp where four open squares meet, at the plot's quarter points, head to the middle */
PLAN.plots.forEach(p => {
    if (p.cells.some(r => r.indexOf('R') >= 0)) return;
    [[3, 3], [9, 3], [3, 9], [9, 9]].forEach(q => {
        const cx = p.x * N + q[0], cy = p.y * N + q[1];
        if (![[0, 0], [-1, 0], [0, -1], [-1, -1]].every(d => '.P'.indexOf(cellAt(cx + d[0], cy + d[1])) >= 0)) return;
        lampAdd(gc(cx) - C / 2, gc(cy) - C / 2, q[0] < 6 ? -0.71 : 0.71, q[1] < 6 ? -0.71 : 0.71);
    });
});
count.lamps = lamps.length;

/* ── THE GROUND: a sheet per square (0 the asphalt, 1 pavement, 2 grass, 3 yard concrete) ── */
const NXP = 144 + ROOM.east, paint = new Uint8Array(NXP * 144);
for (let cy = 0; cy < 144; cy++) for (let cx = 0; cx < NXP; cx++) {
    const own = paintExt.get(cx + ',' + cy);
    if (own != null) { paint[cy * NXP + cx] = own; continue; }
    if (cx >= 144) continue;   // past the plots: the room's own floor unless a district painted it
    const ch = cellAt(cx, cy), dd = D[plotOf[pid(Math.floor(cx / N), Math.floor(cy / N))].d];
    paint[cy * NXP + cx] = ch === 'R' ? 0 : (ch === 'P' || ch === 'D') ? 1 : ch === 'I' ? 3 : dd.yard;
}
if (ROOM.east) lateRows.push({ k: 'wall', x0: r3(-HALF - 0.4), z0: -HALF, x1: r3(-HALF - 0.4), z1: HALF, h: 8, t: 0.4, key: 'urban:ConcreteStriped2a', ghost: true, rail: false });   // the west strip the centred shell adds: closed on the city's old edge
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

/* ── THE TRAFFIC (THE CITY TRAFFIC, mondo 11-13: "traffic lights and intersections planned out for actual traffic and car routes"; his OK on
   the plan 17:33). Sixteen vehicles; every route keeps to the right (lane 3.5 m off the road's middle) and none enters the police streets
   round the mall (x = 8 south of the cross street, the south street east of x = 8, x = 11):
   - THE RING both ways (west avenue, north street, east avenue, cross street), three cars each
   - THE WEST AVENUE RUN: the avenue's north end (it stops at the boxing gym) to the cross street's west end (the campus gate) and back,
     turning round at both ends (the plan has no road out of the city), four cars
   - THE FREIGHT RUN: the campus gate, down the west avenue through Industrial, along the south street to the police line and back, two trucks
   - THE STRIP TAXIS: the cross street's east end, turning round short of the east avenue and at the far corner, two taxis
   - BUS LINE 1, one bus each way: the police line (Bayside Gate), the south street, up the west avenue, round the ring, back down
   THE SIGNALS: lights at the three big junctions (a mast for every arm), and the T at the police staging blinking red.
   three-renderer.js _hqBuildSignals / _hqBuildBusStops / _hqBuildTraffic read the three rows. ── */
const ctr = (x, y) => pc({ x, y });
const ring = [ctr(3, 1), ctr(8, 1), ctr(8, 7), ctr(3, 7)];
const busEnd = ctr(BUS_END.x, BUS_END.y);
const TRAFFIC = [
    { pts: ring, loop: true, n: 3, speed: 4.2, lane: 3.5, kinds: ['suv', 'taxi', 'cadillac'] },
    { pts: ring.slice().reverse(), loop: true, n: 3, speed: 4.2, lane: 3.5, kinds: ['taxi', 'copcar', 'suv'] },
    { pts: [ctr(3, 0.2), ctr(3, 7), ctr(0, 7), ctr(3, 7)], loop: true, n: 4, speed: 4.0, lane: 3.5, kinds: ['cadillac', 'suv', 'taxi', 'suv'] },
    { pts: [ctr(0, 7), ctr(3, 7), ctr(3, 11), ctr(6.6, 11), ctr(3, 11), ctr(3, 7)], loop: true, n: 2, speed: 3.6, lane: 3.5, kinds: ['truck', 'truck'] },
    { pts: [ctr(8.62, 7), ctr(11, 7)], loop: true, n: 2, speed: 3.8, lane: 3.5, kinds: ['taxi', 'taxi'] },
    { pts: [busEnd, ctr(3, 11), ctr(3, 7), ctr(3, 1), ctr(8, 1), ctr(8, 7), ctr(3, 7), ctr(3, 11)], loop: true, n: 1, speed: 3.8, lane: 3.5, kinds: ['citybus'], bus: true },
    { pts: [busEnd, ctr(3, 11), ctr(3, 7), ctr(8, 7), ctr(8, 1), ctr(3, 1), ctr(3, 7), ctr(3, 11)], loop: true, n: 1, speed: 3.8, lane: 3.5, kinds: ['citybus'], bus: true },
];
const sigAt = (x, y, arms, o) => { const c = ctr(x, y); return Object.assign({ x: c[0], z: c[1], arms }, o || {}); };
const SIGNALS = [sigAt(3, 1, 'NES', { off: 0 }), sigAt(3, 7, 'NESW', { off: 11 }), sigAt(8, 7, 'NESW', { off: 24 }), sigAt(8, 11, 'NEW', { flash: true })];
/* every mast stands on a walk square at its junction's corner */
SIGNALS.forEach(g => g.arms.split('').forEach(a => { const k = { S: [1, 1], W: [-1, 1], N: [-1, -1], E: [1, -1] }[a], ch = cellAt(cellOf(g.x + k[0] * 7.9), cellOf(g.z + k[1] * 7.9));
    if (ch !== 'P') console.warn('signal mast off the walk', g.x, g.z, a, ch); }));
count.vehicles = TRAFFIC.reduce((n, t) => n + t.n, 0); count.signals = SIGNALS.reduce((n, g) => n + g.arms.length, 0);
/* ── the room ── */
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/"/g, "'");
const spawnP = plotOf[PLAN.progression.start], sp = pc(spawnP);
const lines = [];
lines.push("        /* DC144-BEGIN — DISASTER CITY, THE 144 PLOTS (2026-11-13): written by `node bake-disaster-city.js` from docs/disaster-city/city-layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
lines.push("        site_prebuilt_downtown_streets: {");
lines.push("            label: 'DISASTER CITY',");
lines.push("            sub: 'NINE DISTRICTS · 144 PLOTS',");
lines.push("            kind: 'box', site: 'prebuilt_downtown', part: 'streets',");
lines.push("            shell: hqCityShell({ w: " + (2 * HALF + 2 * ROOM.east * C) + ", d: " + (2 * HALF) + ", plate: { x: " + sp[0] + ", z: " + sp[1] + ", y: 4.6 } }),");
lines.push("            parti: 'Nine districts of sixteen plots, every plot a twelve by twelve board: a city walked as a maze of yards, alleys, doors and roofs between a few plain roads.',");
lines.push("            typology: 'grid',");
lines.push("            dc144: { cell: " + C + ", plot: " + PL + ", plots: " + N + " },");
lines.push("            terrain: {");
lines.push("                res: 0.875,");
if (ROOM.sea) lines.push("                sea: " + J(ROOM.sea) + ",");
if (ROOM.east) lines.push("                backdropInset: { w: " + r3(ROOM.east * C) + " }," + (ROOM.backdropOpen.length ? " backdropOpen: " + J(ROOM.backdropOpen) + "," : ""));
lines.push("                /* THE NATURAL EDGES: no ring of backdrop buildings; the land past each side in place of the concrete outer ground (three-renderer.js _hqBuildEdgeLand) */");
/* the grown room (Bayside's beach, ROOM.east): the west strip the centred shell adds is under the forest (the land starts behind the ghost wall on
   the city's old edge); the bay lies past the city's east edge, so the mountains and the desert fall into it over the strip's width */
if (ROOM.east) { const sw = ROOM.east * C; EDGES.w.inset = r3(sw - 0.1); EDGES.n.cap = { kind: 'coast', at: 'e', off: r3(sw), len: 60 }; EDGES.s.cap = { kind: 'coast', at: 'e', off: 25, len: 40 }; }
lines.push("                backdrop: false, edges: " + J(EDGES) + ",");
lines.push("                floor: 'urban:PlasterWallPainted1b', cliff: 'urban:ConcreteStriped2a', path: 'urban:TileGeneric1a', floorTint: '#8a8a8e',");
lines.push("                /* THE LEVELS: the ground's height, square by square (four corners each, cm): docs/disaster-city/levels.js through this tool */");
const lvLine = lines.length; lines.push('');   // (written once the ground is known: THE LEVELS, THE GROUND)
lines.push("                gen: { kind: 'city', seed: 144, allOpen: true, noRescue: true, walkW: 0, kerb: 0, prisms: false, yardsOpen: false, packP: 0, streets: " + J(streets) + ",");
const lampLine = lines.length; lines.push("");   // written after the district files' build (a district may take a lamp off a square it built on: ctx.lamps)
lines.push("                       open: [] },");
lines.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + gc(0) + ", z0: " + gc(0) + ", nx: " + NXP + ", nz: 144, d: '" + b64 + "' },");
lines.push("                features: [");
dcCtx.lamps = lamps;
dcRun('build');
lines[lampLine] = "                    lamps: " + J(lamps) + ",";
features.push(...lateRows);
/* ── THE LEVELS, THE GROUND: every square's four corner heights (NW NE SW SE, centimetres) → `terrain.slope.cells`.
   - a BUILDING's squares are flat at its base: the plot's level, or the kerb walk's height at its door when its door opens on a sloping
     street (the doorway meets the pavement; along the rest of that front the wall's foot is buried or stands on a plinth, as on any hill);
   - a STREET square (the carriageway + the kerb walk) follows the street: flat for two squares either side of the plot's middle (the
     junction, the bus stop), then a straight grade to the half-way height at the plot line: one level a plot = 6.25 %, two = 12.5 %;
   - an open square takes, corner by corner: its building's base where it touches a building, the street's height where it touches the kerb
     walk (an apron, never a step at a kerb), else the plot's level plus the plot's own piece (levels.js `pieces`: a bowl, a mound);
   - two plots on different levels never share a corner's height: the plot line is a retaining wall, except where a flight crosses it.
   Then the rows that name a height are put on it: the roof bridges (a bridge between two roofs at different heights lies at the higher
   roof, a flight on the lower roof climbs to it), the architecture rows (each at its building's base), a prop hung at a height. ── */
const LV = (() => {
    const W = 144, K = (cx, cy) => cy * W + cx, base = new Float32Array(W * W).fill(NaN), rf = new Uint8Array(W * W);
    for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) rf[K(cx, cy)] = roadFollow(cx, cy) ? 1 : 0;
    const grade = t => Math.min(1, Math.max(0, (t - 2) / 4)) * 0.5;
    const roadM = (p, lx, ly) => {   // the street's height at a plot-local point (squares from the plot's NW corner)
        const ox = lx - 6, oy = ly - 6; let s, t, q;
        if (Math.abs(oy) >= Math.abs(ox)) { s = oy > 0 ? 'S' : 'N'; t = Math.abs(oy); q = plotOf[pid(p.x, p.y + (oy > 0 ? 1 : -1))]; }
        else { s = ox > 0 ? 'E' : 'W'; t = Math.abs(ox); q = plotOf[pid(p.x + (ox > 0 ? 1 : -1), p.y)]; }
        return (lvOf(p) + ((p.ports[s] === 'road' && q) ? (lvOf(q) - lvOf(p)) * grade(t) : 0)) * LVM;
    };
    /* the buildings' squares and bases */
    const planB = {}; PLAN.plots.forEach(p => p.buildings.forEach(b => { planB[b.id] = { p, b }; }));
    const baseOf = {};
    const bldBase = (id, x, z, ex, ez) => {
        const m = /^dc:(P\d\d-\d\d-B\d+)/.exec(id || ''), pb = m && planB[m[1]];
        if (!pb) {   // a building the plan does not have (an infill, a stand): the lowest plot level under it — its walls reach the ground on every side, the uphill side stands buried
            let lo = Infinity; for (const u of [-1, 1]) for (const v of [-1, 1]) { const p = plotAtCell(Math.max(0, Math.min(143, Math.floor((x + u * ex + HALF) / C))), Math.max(0, Math.min(143, Math.floor((z + v * ez + HALF) / C)))); lo = Math.min(lo, lvOf(p)); }
            return lo * LVM; }
        if (baseOf[m[1]] != null) return baseOf[m[1]];
        const dr = pb.b.doors && pb.b.doors[0], p = pb.p; let h = lvOf(p) * LVM;
        if (dr && rf[K(p.x * N + dr.ox, p.y * N + dr.oy)]) h = roadM(p, dr.ox + 0.5, dr.oy + 0.5);
        return (baseOf[m[1]] = Math.round(h * 100) / 100);
    };
    let mixed = 0; const flag = new Uint8Array(W * W);   // 1 = a walk-in building's floor (its height stands to the square's line: hqTerrainSlopeFn ON A LINE)
    features.forEach(f => {
        if (!(f.k === 'texbuilding' || (f.k === 'plateau' && f.bld)) || !(f.w > 0) || !(f.d > 0)) return;
        const turned = Math.round((f.rot || 0) / 90) % 2 !== 0, ex = (turned ? f.d : f.w) / 2 - 0.06, ez = (turned ? f.w : f.d) / 2 - 0.06, h = bldBase(f.id, f.x, f.z, ex, ez);
        for (let cy = Math.max(0, Math.floor((f.z - ez + HALF) / C)); cy <= Math.min(W - 1, Math.floor((f.z + ez + HALF) / C)); cy++)
            for (let cx = Math.max(0, Math.floor((f.x - ex + HALF) / C)); cx <= Math.min(W - 1, Math.floor((f.x + ex + HALF) / C)); cx++) { const k = K(cx, cy); if (!isNaN(base[k]) && Math.abs(base[k] - h) > 0.02) mixed++; if (isNaN(base[k]) || h < base[k]) base[k] = h; if (f.hollow) flag[k] = 1; }
    });
    /* the plots' pieces */
    const pieces = {}; (LEVELS.pieces || []).forEach(q => { (pieces[q.plot] = pieces[q.plot] || []).push(q); });
    const pieceM = (p, lx, ly) => { let v = 0; (pieces[p.id] || []).forEach(q => { const t = Math.min(lx - q.x0, q.x1 - lx, ly - q.y0, q.y1 - ly); if (t > 0) v += (q.k === 'bowl' ? -1 : 1) * Math.min(q.by, t * (q.rate || 1)); }); return v * LVM; };
    (LEVELS.pieces || []).forEach(q => { const p = plotOf[q.plot]; for (let y = q.y0; y < q.y1; y++) for (let x = q.x0; x < q.x1; x++) { const cx = p.x * N + x, cy = p.y * N + y; if (!isNaN(base[K(cx, cy)]) || rf[K(cx, cy)]) console.warn('THE LEVELS: piece on a building / a street square', q.plot, x, y); } });
    /* THE DOOR STOOPS: a walk-in building grown to its plot's line opens onto the NEXT plot; where that ground stands at another height
       than the building's floor, a flight one square wide joins them outside the doorway (cut into the ground when the door is lower) */
    const natural = (cx, cy) => { const k = K(cx, cy), p = plotAtCell(cx, cy); return !isNaN(base[k]) ? base[k] : rf[k] ? roadM(p, cx - p.x * N + 0.5, cy - p.y * N + 0.5) : lvOf(p) * LVM; };
    const stoops = [];
    features.forEach(f => {
        if (f.k !== 'texbuilding' || !f.hollow) return;
        const L = Math.max(2, f.w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols, col = (isFinite(+f.door) && +f.door >= 1) ? Math.min(cols - 1, Math.round(+f.door) - 1) : Math.floor((cols - 1) / 2), lx = -L / 2 + (col + 0.5) * cw;   // data.js hqTexbDoor
        const q = (f.rot || 0) * Math.PI / 180, c = Math.round(Math.cos(q)), sn = Math.round(Math.sin(q)), wx = f.x + lx * c + (f.d / 2) * sn, wz = f.z - lx * sn + (f.d / 2) * c;   // the doorway's middle on the wall line; (sn, c) points out
        const hb = bldBase(f.id, f.x, f.z, 1, 1), cellOf = t => [Math.floor((wx + sn * t + HALF) / C), Math.floor((wz + c * t + HALF) / C)];
        const c0 = cellOf(0.5); if (!inCity(c0[0], c0[1]) || !isNaN(base[K(c0[0], c0[1])])) return;
        const g0 = natural(c0[0], c0[1]); if (Math.abs(g0 - hb) <= 0.3) return;
        const m = Math.max(1, Math.ceil(Math.abs(g0 - hb) / LVM - 0.01)), cells = [];
        for (let i = 0; i < m; i++) { const cc = cellOf(0.5 + i * C); if (!inCity(cc[0], cc[1]) || !isNaN(base[K(cc[0], cc[1])]) || cellAt(cc[0], cc[1]) === 'R') break; cells.push(cc); }
        if (!cells.length) { console.warn('THE LEVELS: no room for a door stoop', f.id); return; }
        const g1 = natural(cells[cells.length - 1][0], cells[cells.length - 1][1]), n = cells.length, axisX = sn !== 0, line = ((axisX ? wx : wz) + HALF) / C, dir = axisX ? sn : c;
        if (Math.abs(g1 - hb) / (n * C) > 1.001) console.warn('THE LEVELS: a door stoop steeper than the walk climbs', f.id);
        cells.forEach(cc => lvCut.set(cc[0] + ',' + cc[1], { x: axisX, line, dir, m: n, h0: hb, h1: g1 }));
        const ex = wx + sn * n * C, ez = wz + c * n * C, up = g1 > hb;
        stoops.push({ k: 'ramp', id: 'dc:stoop:' + String(f.id).replace(/^dc:/, ''), absY: true, x0: r3(up ? wx : ex), z0: r3(up ? wz : ez), x1: r3(up ? ex : wx), z1: r3(up ? ez : wz), w: 3.4, h0: r3(Math.min(hb, g1)), h1: r3(Math.max(hb, g1)), stairs: true, model: LEVELS.stairs[plotAtCell(c0[0], c0[1]).d] || 'concrete', edge: 0.01 });
    });
    const cm = new Int16Array(W * W * 4);
    for (let cy = 0; cy < W; cy++) for (let cx = 0; cx < W; cx++) {
        const k = K(cx, cy), p = plotAtCell(cx, cy), px = p.x * N, py = p.y * N, cut = lvCut.get(cx + ',' + cy);
        [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([ax, ay], ci) => {
            const vx = cx + ax, vy = cy + ay, lx = vx - px, ly = vy - py; let h;
            if (!isNaN(base[k])) h = base[k];
            else if (cut) h = cut.h0 + (cut.h1 - cut.h0) * Math.min(1, Math.max(0, ((cut.x ? vx : vy) - cut.line) * cut.dir / cut.m));
            else if (rf[k]) h = roadM(p, lx, ly);
            else {
                let bs = 0, bn = 0, road = false;
                for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 0; dx++) { const x = vx + dx, y = vy + dy; if (x < px || y < py || x >= px + N || y >= py + N) continue; const kk = K(x, y); if (!isNaN(base[kk])) { bs += base[kk]; bn++; } else if (rf[kk]) road = true; }
                h = bn ? bs / bn : road ? roadM(p, lx, ly) : lvOf(p) * LVM + pieceM(p, lx, ly);
            }
            cm[k * 4 + ci] = Math.round(h * 100);
        });
    }
    const at = (x, z) => {   // the ground at a room point (data.js hqTerrainSlopeFn's own arithmetic)
        let fx = (x + HALF) / C, fz = (z + HALF) / C, i = Math.floor(fx), j = Math.floor(fz);
        if (i < 0) { i = 0; fx = 0; } else if (i >= W) { i = W - 1; fx = W; } if (j < 0) { j = 0; fz = 0; } else if (j >= W) { j = W - 1; fz = W; }
        const u = fx - i, v = fz - j, o = (j * W + i) * 4;
        return ((cm[o] * (1 - u) + cm[o + 1] * u) * (1 - v) + (cm[o + 2] * (1 - u) + cm[o + 3] * u) * v) / 100;
    };
    return { cm, at, baseOf, bldBase, mixed, stoops, f64: Buffer.from(flag).toString('base64'), b64: Buffer.from(cm.buffer, cm.byteOffset, cm.byteLength).toString('base64') };
})();
features.push(...LV.stoops); lvCount.stoops = LV.stoops.length;
if (LV.mixed) console.warn('THE LEVELS: squares under two buildings of different bases:', LV.mixed);
/* the roof bridges: each at its roofs' real height; two roofs at different heights → the slab at the higher, a flight on the lower roof up to it */
{
    const rowOf = {}; features.forEach(f => { if (f.id) rowOf[f.id] = f; });
    const roofY = id => { const r = rowOf['dc:' + id]; return !r ? null : r.k === 'plateau' ? LV.at(r.x, r.z) + r.h : LV.at(r.x, r.z) + (r.storeys || 2) * 3.5 + 0.02; };   // a tier's top; a walked texbuilding's roof slab (data.js hqTexBuildingRows)
    let stepped = 0;
    PLAN.roofEdges.forEach(e => {
        const br = rowOf['dc:' + e.id], A = bInfo.find(b => b.id === e.a), B = bInfo.find(b => b.id === e.b); if (!br || !A || !B) return;
        const horiz = Math.abs(br.z1 - br.z0) < 0.01, first = horiz ? (A.x < B.x ? A : B) : (A.z < B.z ? A : B), second = first === A ? B : A;   // end 0 stands on `first`, end 1 on `second`
        const y0 = roofY(first.id), y1 = roofY(second.id); if (y0 == null || y1 == null) return;
        br.y = r3(Math.max(y0, y1)); br.absY = true;
        const dh = Math.abs(y0 - y1); if (dh <= 0.5) return;
        const low = y0 < y1 ? first : second, end = y0 < y1 ? [br.x0, br.z0] : [br.x1, br.z1], dir = y0 < y1 ? -1 : 1;   // the flight runs from the slab's end back into the lower roof
        if (rowOf['dc:' + low.id].k !== 'plateau') console.warn('THE LEVELS: the lower roof of', e.id, 'is a walk-in building (its roof is a slab, a flight cannot stand on it): put the two plots on one level in levels.js');
        const depth = (horiz ? low.w : low.d2) - 1.5 - 1.0, run = Math.min(dh / 0.5, depth);
        if (run < dh - 0.01) console.warn('THE LEVELS: roof flight too steep', e.id, 'rise', dh.toFixed(2), 'run', run.toFixed(2));
        const fx = horiz ? end[0] + dir * run : end[0], fz = horiz ? end[1] : end[1] + dir * run;
        features.push({ k: 'ramp', id: 'dc:roofstair:' + e.id, absY: true, x0: r3(fx), z0: r3(fz), x1: r3(end[0]), z1: r3(end[1]), w: 3.2, h0: r3(Math.min(y0, y1)), h1: r3(Math.max(y0, y1)), stairs: true, model: 'steel', edge: 0.01 });
        stepped++;
    });
    lvCount.roofFlights = stepped;
    /* the architecture rows: each on its building's base (a row with no building of the plan: the ground under its origin, a hair inside its plot) */
    features.forEach(f => {
        if (f.k !== 'arch') return;
        const m = /(P\d\d-\d\d-B\d+)/.exec(f.id || ''), g = (m && LV.baseOf[m[1]] != null) ? LV.baseOf[m[1]] : LV.at(f.x + 0.01, f.z + 0.01);
        f.y = r3((typeof f.y === 'number' ? f.y : 0) + g);
    });
    /* a prop hung at a height (a stacked container): the height is from the room's floor (three-renderer.js THE TIER HEIGHT), so the ground under it is added */
    props.forEach(q => { if (typeof q.y === 'number' && (q.y >= 1 || q.y <= -0.5)) q.y = r3(q.y + LV.at(q.x, q.z)); });
}
count.levels = lvCount;
/* ── THE PROP PASS (docs/disaster-city/props.js; mondo 11-13: "cars on top of stuff, benches on top of fences, street signs half way inside
   buildings ... way more attention to detail and care"): the set dressing, then THE PROP CHECK over every prop of the room, last of all ── */
{
    Object.assign(dcCtx, { own: dcOwn, at: LV.at, lamps, busStops, signals: SIGNALS, REPO });
    count.dressing = PROPS.dress(dcCtx);
    const pc = PROPS.check(dcCtx); count.propCheck = pc.tally;
    fs.writeFileSync(path.join(REPO, 'docs/disaster-city/prop-check.txt'), 'THE PROP CHECK, written by node bake-disaster-city.js. A district file\'s own prop that stands in something is listed here for its thread; a shared prop with no clear spot is left out.\n' + JSON.stringify(pc.tally) + '\n' + pc.report.map(r => r.join('  ')).join('\n') + '\n');
}
lines[lvLine] = "                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gx(0) + ", nx: 144, nz: 144, f: '" + LV.f64 + "', d: '" + LV.b64 + "' } },";
features.forEach(f => lines.push("                    " + J(f) + ","));
lines.push("                ],");
lines.push("                /* the cars: the ring (west avenue, the north street, the east avenue, the cross street), never the response streets round the mall */");
lines.push("                traffic: " + J(TRAFFIC) + ",");
lines.push("                /* THE CITY TRAFFIC: the junctions with traffic lights, and Bus Line 1's stops (the point the bus waits at, its sign poles) */");
lines.push("                signals: " + J(SIGNALS) + ",");
lines.push("                busStops: " + J(busStops) + ",");
lines.push("            },");
const dj = o => "wall: 'free', x: " + o.x + ", z: " + o.z + ", face: " + o.face;
lines.push("            doors: [");
lines.push("                { id: 'harbour', " + dj(JOIN.harbour) + ", leaf: null, label: 'THE HARBOUR', sub: 'THE BOARDWALK · OUT ON THE PIER', action: { room: 'site_prebuilt_downtown_harbour', at: 'quay' },");
lines.push("                  desc: 'The quay stops and the water starts. A pier goes on out into it, with a skiff tied at the end that nobody is minding.' },");
lines.push("                { id: 'tower', " + dj(JOIN.tower) + ", leaf: 'leaf_entrance', label: 'THE TOWER', sub: 'THE PLAZA DOORS · INTO THE LOBBY', action: { room: 'site_prebuilt_downtown_lobby', at: 'avenue' },");
lines.push("                  desc: 'The tower\\'s other doors, onto the avenue. The lobby is behind them, the intersection is behind the lobby, and the tower is above all of it for the rest of the year.' },");
lines.push("                { id: 'mall', " + dj(JOIN.mall) + ", leaf: 'leaf_glass', label: 'THE MALL', sub: 'THE MAIN ENTRANCE · INTO THE MALL', action: { room: 'site_prebuilt_downtown_mall', at: 'street' },");
lines.push("                  desc: 'The mall\\'s main entrance: sliding glass, a mat that says WELCOME, a sign that says OPEN and a smaller one, taped under it, that says NOTHING HAPPENED HERE.' },");
lines.push("                { id: 'metro', " + dj(JOIN.metro) + ", way: 'stairway', passage: { model: 'metro_stairs', w: 3.6, h: 3.6, len: 10, deep: 6.5, rise: -0.55, land: 3.2, wall: 'urban:MetroWallTile', wallColor: 0xf0eee8, trim: 'urban:MetroConcrete', lift: 0.3 },");
lines.push("                  label: 'THE METRO', sub: 'THE STAIR DOWN · THE PLATFORM', action: { room: 'site_prebuilt_downtown_subway', at: 'street' },");
lines.push("                  desc: 'A stair down under a sign for every line. The platform under the tower has never once been touched; this is the other way onto it.' },");
lines.push("                { id: 'sewer', " + dj(JOIN.sewer) + ", leaf: 'leaf_bulkhead', wide: true, label: 'THE SEWERS', sub: 'THE PUMPING STATION · DOWN INTO THE CULVERTS', action: { room: 'site_prebuilt_downtown_sewers', at: 'pump' },");
lines.push("                  desc: 'A pumping station at the end of an alley, its bulkhead door open and its pumps running for a city that stopped paying them. The ladder inside goes down further than the tower ever went up.' },");
lines.push("            ],");
lines.push("            counters: [],");
lines.push("            props: [");
props.forEach(f => lines.push("                " + J(f) + ","));
lines.push("            ],");
lines.push("            agents: [], npcSpots: [" + npcSpots.map(J).join(", ") + "],");
lines.push("            spawn: { x: " + r3(JOIN.bay.x - 3.5) + ", z: " + JOIN.bay.z + ", face: 270 },");
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
/* THE JOINS: the rows outside the markers that named a spot in the old streets (each found by its own text; a rerun re-writes the same rows) */
const sub = (re, to, what) => { if (!re.test(src)) { console.warn('JOIN not found:', what); return; } src = src.replace(re, to); };
/* the old streets room keeps its place in the file under a new id (its fight board is cut from it: HQ_ARENA_RULES) */
const blockEnd = src.indexOf('        /* DC144-END */');
{ const i = src.indexOf("        site_prebuilt_downtown_streets: {\n            label: 'DISASTER CITY · DOWNTOWN',", blockEnd);
  if (i > 0) { src = src.slice(0, i) + "        site_prebuilt_downtown_oldstreets: {   // THE OLD STREETS (2026-11-13): replaced by the 144 plots above (mondo's decision); kept, unlinked, as the room the site's fight board is cut from\n            label: 'DISASTER CITY · DOWNTOWN'," + src.slice(i + "        site_prebuilt_downtown_streets: {\n            label: 'DISASTER CITY · DOWNTOWN',".length);
      const j = src.indexOf("kind: 'box', site: 'prebuilt_downtown', part: 'streets',", i); src = src.slice(0, j) + "kind: 'box', site: 'prebuilt_downtown', part: 'oldstreets'," + src.slice(j + "kind: 'box', site: 'prebuilt_downtown', part: 'streets',".length); } }
['downtown_strip', 'stadium_downtown', 'garage_taxi', 'streets_strip', 'streets_drain', 'docks_sewer'].forEach(id => {
    const i = src.indexOf("{ id: '" + id + "',"); if (i < 0) { console.warn('JOIN link not found:', id); return; }
    const seg = src.slice(i, i + 900), o = JOIN[id];
    const out = seg.replace(/(\{ site: 'prebuilt_downtown', part: 'streets', )[^\n]*?(sub: )/, "$1wall: 'free', x: " + o.x + ", z: " + o.z + ", face: " + o.face + ", $2");
    if (out === seg) console.warn('JOIN link end not found:', id); src = src.slice(0, i) + out + src.slice(i + 900);
});
sub(/(prebuilt_downtown:  \{ room: 'site_prebuilt_downtown_streets',  door: \{ id: 'bay', )[^}]*\}/, "$1wall: 'free', x: " + JOIN.bay.x + ", z: " + JOIN.bay.z + ", face: " + JOIN.bay.face + " }", 'entry');
const hero = pc(plotNamed('Hero plaza'));
sub(/site_prebuilt_downtown_streets: \{ x: [-\d.]+, z: [-\d.]+ \},(   \/\/ DISASTER CITY: the plaza)/, "site_prebuilt_downtown_streets: { x: " + hero[0] + ", z: " + r3(hero[1] + 1.75) + " },$1", 'marker');
sub(/city: \{ room: 'site_prebuilt_downtown_streets', x: [-\d.]+, z: [-\d.]+, face: \d+ \}/, "city: { room: 'site_prebuilt_downtown_streets', x: " + r3(hero[0] - 3.5) + ", z: " + r3(hero[1] + 1.75) + ", face: 90 }", 'hub');
const tapeB = bInfo.find(b => b.roof && b.d === 'R') || bInfo.find(b => b.roof);
sub(/site_prebuilt_downtown_streets: \{ tape: \{ x: [-\d.]+, z: [-\d.]+ \} \}/, "site_prebuilt_downtown_streets: { tape: { x: " + tapeB.x + ", z: " + tapeB.z + " } }", 'tape');
src = src.replace(/prebuilt_downtown: \{ room: 'site_prebuilt_downtown_streets', x: -24\.5, z: -14, r: 2\.6 \}/, "prebuilt_downtown: { room: 'site_prebuilt_downtown_oldstreets', x: -24.5, z: -14, r: 2.6 }");
src = src.replace(/prebuilt_downtown: \{"room":"site_prebuilt_downtown_streets"/g, 'prebuilt_downtown: {"room":"site_prebuilt_downtown_oldstreets"');
fs.writeFileSync(file, src);
console.log('data.js written');
