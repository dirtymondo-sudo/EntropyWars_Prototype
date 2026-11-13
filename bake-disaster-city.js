#!/usr/bin/env node
/* bake-disaster-city.js (2026-11-13) — DISASTER CITY, THE 144 PLOTS.
   Reads mondo's layout (docs/disaster-city/city-layout.json: 12 x 12 plots, each 12 x 12 cells, nine districts of 16 plots) and
   writes the room `site_prebuilt_downtown_city` into data.js between the DC144 markers. Repo tooling only (RULE #1 TOOLING).

     node bake-disaster-city.js            write the room
     node bake-disaster-city.js --dry-run  print the counts, write nothing

   THE TAILORING (what the plan became in Entropy Wars):
   - a plan cell (3 to 4 m in the plan) is ONE battle square, 3.5 m (HQ_ARENA_RULES.squareDefault): a plot is 42 m, exactly a
     12 x 12 battle board; the city 504 m a side.
   - a closed plot edge is a thin wall ON the plot line (brick, concrete, corrugated or railings by district); the plan's
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
const count = { texb: 0, roofb: 0, walls: 0, bridges: 0, escapes: 0, trees: 0 };

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

/* ── THE WALLS: every closed stretch of a plot line (shared lines once) ── */
const wallRun = (horizontal, line, a, b, key, h) => {
    /* a run of squares a..b (cell indices along the line) on cell LINE `line` */
    const row = horizontal ? { k: 'wall', x0: gx(a), z0: gx(line), x1: gx(b + 1), z1: gx(line), h, t: 0.3, key, tint: '#ffffff' } : { k: 'wall', x0: gx(line), z0: gx(a), x1: gx(line), z1: gx(b + 1), h, t: 0.3, key, tint: '#ffffff' };
    features.push(row); count.walls++;
};
const closedAt = (cx, cy, dx, dy) => {
    /* the line between cell (cx, cy) and its neighbour (cx + dx, cy + dy), both across a plot line: closed if either is '#' */
    const a = cellAt(cx, cy), b = cellAt(cx + dx, cy + dy);
    return a === '#' || b === '#';
};
for (let L = 0; L <= N; L++) {
    /* horizontal plot lines z = L * 12 cells; vertical x = L * 12 */
    for (const horizontal of [true, false]) {
        const line = L * N;
        let run = null;
        for (let c = 0; c <= 144; c++) {
            let closed = false, key = null, h = 0;
            if (c < 144) {
                const cx = horizontal ? c : line - 1, cy = horizontal ? line - 1 : c;
                closed = (L === 0 || L === N) ? true : closedAt(cx, cy, horizontal ? 0 : 1, horizontal ? 1 : 0);
                if (closed) {
                    const px = Math.min(N - 1, Math.floor((horizontal ? c : Math.min(143, line)) / N)), py = Math.min(N - 1, Math.floor((horizontal ? Math.min(143, line) : c) / N));
                    const dd = D[plotOf[pid(px, py)].d]; key = dd.wall; h = (L === 0 || L === N) ? 3.2 : dd.wallH;
                }
            }
            if (run && (!closed || key !== run.key || c % N === 0)) { wallRun(horizontal, line, run.a, c - 1, run.key, run.h); run = null; }
            if (closed && !run) run = { a: c, key, h };
        }
    }
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
    const row = { key, x: r3(-HALF + (p.x * N + lx) * C), z: r3(-HALF + (p.y * N + ly) * C) }; if (face != null) row.face = face; if (o.floor) row.floor = true;
    props.push(row); return true;
};
const at = (name, fn) => (byName[name] || []).forEach(fn);
const tree = (p, lx, ly, kind, h) => { const cx = p.x * N + Math.floor(lx), cy = p.y * N + Math.floor(ly); if (!free(cx, cy, '.#')) return; take(cx, cy); features.push({ k: 'tree', x: r3(-HALF + (p.x * N + lx) * C), z: r3(-HALF + (p.y * N + ly) * C), kind, h }); count.trees++; };
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

/* the dressing along the plot walls: a tree or a district piece on the yard band's squares (never a walk square, never by an opening) */
const DRESS = { R: ['city_bin', 'park_bench', 'planter'], C: ['park_bench', 'planter', 'city_bin'], F: ['planter', 'planter', 'city_bench'], U: ['park_bench', 'planter'], H: ['city_bench', 'planter', 'city_bin', 'vending_machine'],
    E: ['dumpster', 'cardboard_boxes', 'vending_machine', 'city_bin'], I: ['dumpster', 'traffic_barrel', 'cardboard_boxes', 'iso_tank', 'psx_metal_barrel_mp_1'], S: ['park_bench', 'city_bin'], B: ['city_bench', 'city_bin', 'planter'] };
PLAN.plots.forEach(p => {
    const dd = D[p.d], ring = [];
    for (let i = 1; i < N - 1; i++) { ring.push([i, 0, 180]); ring.push([i, N - 1, 0]); ring.push([0, i, 90]); ring.push([N - 1, i, 270]); }
    const cand = ring.filter(q => p.cells[q[1]][q[0]] === '#' && free(p.x * N + q[0], p.y * N + q[1], '#'));
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = cand[i]; cand[i] = cand[j]; cand[j] = t; }
    let nT = dd.trees.length ? Math.round(dd.treeP * 5 + rnd()) : 0, nP = 2;
    cand.forEach(q => {
        if (nT > 0) { tree(p, q[0] + 0.5, q[1] + 0.5, pick(dd.trees), 3.4 + rnd() * 0.8); nT--; return; }
        if (nP > 0) { const key = pick(DRESS[p.d]); put(p, key, q[0] + 0.5 + (q[0] === 0 ? -0.12 : q[0] === N - 1 ? 0.12 : 0), q[1] + 0.5 + (q[1] === 0 ? -0.12 : q[1] === N - 1 ? 0.12 : 0), q[2], { quiet: true }); nP--; }
    });
    if (p.d === 'B') [[1.5, 1.5], [10.5, 10.5]].forEach(q => { if (free(p.x * N + 1, p.y * N + 1, '.') || true) put(p, 'palm_tree', q[0], q[1], null, { quiet: true }); });
});
/* the kerbs: a hydrant / a signpost / a bin on the walk squares beside the carriageway, at the square's road edge, every few squares */
let kerbN = 0;
for (let cy = 0; cy < 144; cy++) for (let cx = 0; cx < 144; cx++) {
    if (cellAt(cx, cy) !== 'P' || occ.has(cx + ',' + cy)) continue;
    const side = cellAt(cx + 1, cy) === 'R' ? [0.4, 0] : cellAt(cx - 1, cy) === 'R' ? [-0.4, 0] : cellAt(cx, cy + 1) === 'R' ? [0, 0.4] : cellAt(cx, cy - 1) === 'R' ? [0, -0.4] : null; if (!side) continue;
    if (cellAt(cx + 1, cy) === 'P' && cellAt(cx - 1, cy) === 'P' && cellAt(cx, cy + 1) === 'P' && cellAt(cx, cy - 1) === 'P') continue;
    const along = side[0] ? cy : cx; if ((along * 7 + (side[0] ? cx : cy) * 3) % 11 !== 0) continue;
    const key = ['fire_hydrant', 'signpost', 'city_bin', 'signpost'][kerbN++ % 4];
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
