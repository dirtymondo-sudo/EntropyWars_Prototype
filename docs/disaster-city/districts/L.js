/* DISASTER CITY · THE LANDMARKS (file L: no district of its own; the old Downtown's pieces put into the 144 plots) — 2026-11-15, mondo:
   "add a canal, like a little mini venice or san antonoio board walk, leading out to the ocean" · "add a parking deck and overpass" · the
   Collapse "still fits among the other plots" · "Add whatever makes sense in a plot or district where it makes sense". His OK on the drawn
   plan 08:15 ("Build it as drawn"). Repo tooling only: `node bake-disaster-city.js` loads this file with the district files (the one hook)
   and runs it AFTER Bayside and Hero Plaza (file order), so their rows exist. Notes: docs/notes/areas-complexes.md "DISASTER CITY, THE
   LANDMARKS". Cells are city squares (cx west to east 0..143, cy north to south 0..143; one square = 3.5 m); gx(c) = a square LINE.

   1. THE CANAL (Bayside, the row-11 plots' north yard: squares cy 133-134): the ground sunk under the room's one sea (data.js terrain.sea,
      -1.45), so the bay's own water stands in it. From the west avenue's kerb (cx 105) east to the bay road (a culvert under its six
      squares), on under the boardwalk and through the sand to the bay. A plank walk on the north bank (cy 132), the south road's kerb walk
      the south bank (cy 135). Four footbridges, the boardwalk's bridge, a water stair at the west end. Nothing of Bayside's is removed: the
      staging's props that stood in the yard move to the banks, the plot fences that crossed the yard end at the walk.
   2. THE PARKING DECK + THE OVERPASS (the Medical staging plot's south band, cx 126-131 · cy 141-142): a 3.5 m concrete deck, a car ramp
      up its north side from the west, rails round the roof, cars parked on it; a footbridge from the roof over the south road AND the
      canal to a landing on the north walk, a stair down to the walk (the way to the mall). The ambulance and the tent stand west of the ramp.
   3. THE COLLAPSE (Hero Plaza, Memorial walk P05-06, the open west half; the memorial stays as Hero Plaza built it): the rubble mound,
      the fallen pillars, the wrecks, the barrel fires in the north-west quarter; THE TERRACE (3.5 m, a stair up its north side) in the
      south-west quarter.
   4. THE SET PIECES of the old city that had no place yet: the fortune tent + the high striker (Entertainment, Night market), the subway
      cart (Industrial, Rail service). Each stands on a free yard square found at bake time; with none free it is reported, never forced.
   PERFORMANCE: every piece is a catalogue prop (the instance pass, inside the plot chunks) or a terrain row; no new model, no new sheet. */
'use strict';
const N = 12;
const CAN = { x0: 105, x1: 135, y0: 133, y1: 135, bed: -2.6, mouth0: 141, mouth1: 154 };   // squares; the culvert is cx 135..140
const FOOT = [[108.5, 3.5], [114, 7], [121.5, 3.5], [130.5, 3.5]];                        // a footbridge: its middle (square lines), its width (m)
const DECK = { x0: 126, x1: 132, y0: 141, y1: 143, h: 3.5, ramp0: 123 };                  // the deck's squares; the car ramp starts at cx 123
const OVER = { cx: 131 };                                                                   // the overpass's square column
const COL = { plot: 'P05-06' };

/* before the street furniture: the ground sheets (the bake reads the paint before `build`), the infill shop on the canal's mouth */
function apply(ctx) {
    const { features, gx, paintCell, cellAt } = ctx;
    for (let cx = CAN.x0; cx < 144; cx++) if ('.#'.indexOf(cellAt(cx, 132)) >= 0) paintCell(cx, 132, 'wood_planks');   // the north walk: planks
    /* the back-lot shop that closed the yard's east end (an infill of the tool's, 10.5 m along the plot line): one square now, north of the water */
    const X = gx(143) + 1.75;
    features.forEach(f => { if (f.k === 'texbuilding' && /^dc:in\d+$/.test(f.id || '') && Math.abs(f.x - X) < 0.1 && Math.abs(f.z - (gx(132) + 5.25)) < 0.1) { f.w = 3.5; f.z = ctx.r3(gx(132) + 1.75); } });
}

function build(ctx) {
    const { features, lateRows, props, gx, gc, r3, take, free, plotOf } = ctx;
    const cellOf = v => Math.floor((v + ctx.HALF) / 3.5);
    const mine = new Set();
    const prop = (key, x, z, face, o) => { const q = Object.assign({ key, x: r3(x), z: r3(z) }, face != null ? { face } : {}, o || {}); props.push(q); mine.add(q); return q; };
    const takeRect = (x0, y0, x1, y1) => { for (let cy = y0; cy < y1; cy++) for (let cx = x0; cx < x1; cx++) take(cx, cy); };
    /* a prop that stands on squares a piece needs moves to the square the piece names for it (never dropped) */
    const moveOut = (x0, y0, x1, y1, to) => props.forEach(q => { if (mine.has(q)) return; const cx = cellOf(q.x), cy = cellOf(q.z); if (cx < x0 || cx >= x1 || cy < y0 || cy >= y1) return; const t = to(q, cx, cy); if (t) { q.x = r3(t[0]); q.z = r3(t[1]); if (t[2] != null) q.face = t[2]; } });

    /* ═══ 1 · THE CANAL ═══ */
    const ZC = gx(134), Z0 = gx(CAN.y0), Z1 = gx(CAN.y1);
    const sink = (x0, x1) => lateRows.push({ k: 'plateau', id: 'dc:canal:' + x0, x: r3((gx(x0) + gx(x1)) / 2), z: ZC, w: r3(gx(x1) - gx(x0)), d: r3(Z1 - Z0), h: CAN.bed, sink: true, edge: 0.25, absY: true });
    /* what stood in the yard: the cars to the deck's forecourt, the row of palms and the cordon's pieces onto the banks (the palms keep their
       spacing on the north walk; a piece from the yard's south row goes to the kerb walk's inner edge) */
    let car = 0;
    moveOut(CAN.x0, CAN.y0, CAN.x1, CAN.y1, (q, cx, cy) => /^car_/.test(q.key) ? null : (cy === CAN.y0 ? [q.x, gc(132) + (q.key === 'palm_tree' ? -0.9 : 0.6)] : [q.x, gx(135) + 0.55]));
    moveOut(CAN.mouth0, CAN.y0, CAN.mouth1, CAN.y1, (q, cx, cy) => { if (cx < 146) return [q.x, gc(132) - 0.9]; if (q.key === 'rowboat') { q.y = r3(-1.62 - CAN.bed); return null; } return [q.x, q.z - (q.key === 'lifeguard_chair' ? 7 : 10.5)]; });   // the boardwalk's palm; the sunbeds and the lifeguard's chair three squares up the sand
    sink(CAN.x0, CAN.x1); sink(CAN.mouth0, CAN.mouth1);
    takeRect(CAN.x0, CAN.y0, CAN.x1, CAN.y1); takeRect(CAN.mouth0, CAN.y0, 144, CAN.y1);
    /* the tool's plot fences that ran north to south across the yard: cut back to the plot line (the walk and the water are one stretch) */
    for (let i = features.length - 1; i >= 0; i--) { const f = features[i];
        if ((f.k !== 'rail' && f.k !== 'wall') || f.ghost || f.x0 !== f.x1 || f.x0 < gx(CAN.x0) || f.x0 > gx(144)) continue;
        const a = Math.min(f.z0, f.z1), b = Math.max(f.z0, f.z1); if (b <= gx(132) + 0.1 || a >= Z1 - 0.1) continue;
        if (a < gx(132) - 0.1) { f.z0 = a; f.z1 = gx(132); } else features.splice(i, 1); }
    /* the water stair at the west end (the way out of the water; the other is the beach) */
    lateRows.push({ k: 'ramp', id: 'dc:canal:stair', absY: true, x0: r3(gx(CAN.x0) + 0.05), z0: ZC, x1: gx(CAN.x0 + 2), z1: ZC, w: 7, h0: 0, h1: CAN.bed, stairs: true, edge: 0.01 });
    /* the footbridges, the boardwalk's own bridge over the mouth */
    /* (BRIDGE rows, a second surface: the water runs on under them and a swimmer passes. A slab 0.3 m over the banks and 0.2 m thick leaves
       the swimmer's headroom over the sea; 0.3 m is a step the walker and the residents take. A `deck` row is written into the ground: a dam.) */
    const span = (id, cx, w, o) => lateRows.push(Object.assign({ k: 'bridge', id: 'dc:canal:' + id, x0: gx(cx), z0: r3(Z0 - 0.75), x1: gx(cx), z1: r3(Z1 + 0.75), w, y: 0.3, thick: 0.2, key: 'wood_planks', absY: true }, o || {}));
    FOOT.forEach(b => span('bridge:' + b[0], b[0], b[1]));
    span('boardwalk', 145, 7);
    /* Bayside's sea-wall rail ran on across the mouth: it stops either side of the boardwalk's bridge */
    features.concat(lateRows).forEach(f => { if (f.k !== 'rail' || f.x0 !== f.x1 || f.x0 < gx(144) || f.x0 > gx(146)) return; const a = Math.min(f.z0, f.z1), b = Math.max(f.z0, f.z1);
        if (a < Z0 - 0.5 && b > Z1 + 0.5) { f.z0 = a; f.z1 = r3(Z0 - 0.8); lateRows.push(Object.assign({}, f, { z0: r3(Z1 + 0.8), z1: b })); } });
    /* the culvert under the bay road: a dark arch in a stone face at either end of the six solid squares, a kerb stone along the two road edges */
    const stone = 0xb9b2a4, dark = 0x0b0e12;
    const mouth = (id, x, rot) => lateRows.push({ k: 'arch', id: 'dc:canal:' + id, x: r3(x), z: ZC, rot, parts: [
        { s: 'box', p: [0, -1.9, 0.02], size: [5.6, 1.7, 0.12], tint: dark },
        { s: 'box', p: [-3.15, -2.6, 0.06], size: [0.7, 2.6, 0.3], key: 'marble_light', tint: stone, uv: 1.75 }, { s: 'box', p: [3.15, -2.6, 0.06], size: [0.7, 2.6, 0.3], key: 'marble_light', tint: stone, uv: 1.75 },
        { s: 'box', p: [0, -0.2, 0.06], size: [7, 0.2, 0.3], key: 'marble_light', tint: stone, uv: 1.75 },
        { s: 'box', p: [0, 0, -0.2], size: [7, 0.55, 0.4], key: 'marble_light', tint: stone, uv: 1.75 } ] });
    mouth('culvert-w', gx(135) - 0.02, 270); mouth('culvert-e', gx(141) + 0.02, 90);
    /* the life on it: boats on the water (a small `y` lifts a prop off the bed, to the surface), benches and urns on the plank walk, café
       tables by the mall's side, the old quay's flood masts at the two ends. Decor stands off the squares' middles (the fence side). */
    const float = r3(-1.62 - CAN.bed);
    [[110.5, 133.45, 92], [117, 134.5, 268], [123.6, 133.45, 88], [127.2, 134.55, 272], [142.4, 134.4, 100]].forEach(b => prop('rowboat', gx(b[0]), gx(b[1]), b[2], { y: float }));
    [111, 116.5, 119.2].forEach(c => prop('iron_garden_bench', gx(c), gx(132) + 0.75, 0));
    FOOT.forEach(b => { for (const s of [-1, 1]) { const x = gx(b[0]) + s * (b[1] / 2 + 0.45); if (x > gx(125) - 0.5 && x < gx(130) + 0.5) continue; prop('stone_urn', x, gx(132) + 2.95); } });   // (not in the back-lot building on squares 125-129)
    [[122.5, 132.28], [123.75, 132.28]].forEach(t => { prop('tulip_table', gx(t[0]), gx(t[1]), 0); prop('cafeteria_chair', gx(t[0]), gx(t[1]) + 1.05, 0); });
    prop('flood_mast', gx(106) - 0.6, gx(132) + 1.2, 0); prop('flood_mast', gx(143) - 0.5, gx(135) + 0.6, 0);

    /* ═══ 2 · THE PARKING DECK + THE OVERPASS ═══ */
    const DX0 = gx(DECK.x0), DX1 = gx(DECK.x1), DZ0 = gx(DECK.y0), DZ1 = gx(DECK.y1), H = DECK.h, RZ = gc(DECK.y0);
    /* the staging's pieces on the deck's squares and the ramp's: the ambulance and the tent stand west of the ramp, the rest in front */
    moveOut(DECK.ramp0, DECK.y0, DECK.x1, DECK.y1, (q, cx, cy) => q.key === 'car_ambulance' ? [gx(124.2), gx(142.65), 90] : q.key === 'carnival_tent' ? [gx(121.6), gx(142.4)] : q.key === 'palm_tree' ? [gx(132) + 1.2, gc(142)] : [q.x, gx(141) - 0.55]);
    props.forEach(q => { if (/^car_/.test(q.key) && !mine.has(q) && cellOf(q.x) >= CAN.x0 && cellOf(q.x) < CAN.x1 && cellOf(q.z) >= CAN.y0 && cellOf(q.z) < CAN.y1) { const c = car++; q.x = gx(c === 0 ? 127 : 129.6); q.z = gc(142) + 0.3; q.face = c === 0 ? 0 : 180; q.y = H; } });   // the yard's two parked cars: up on the deck
    lateRows.push({ k: 'plateau', id: 'dc:deck', x: r3((DX0 + DX1) / 2), z: r3((DZ0 + DZ1) / 2), w: r3(DX1 - DX0), d: r3(DZ1 - DZ0), h: H, edge: 0.05, absY: true });
    lateRows.push({ k: 'ramp', id: 'dc:deck:ramp', absY: true, x0: gx(DECK.ramp0), z0: RZ, x1: r3(DX0 + 0.7), z1: RZ, w: 3.5, h0: 0, h1: H, edge: 0.2 });
    takeRect(120, DECK.y0, DECK.x1, DECK.y1 + 1);
    /* the roof's rails (open where the ramp arrives and where the overpass leaves), the ramp's own on its road side */
    const rail = (x0, z0, x1, z1) => lateRows.push({ k: 'rail', x0: r3(x0), z0: r3(z0), x1: r3(x1), z1: r3(z1), model: 'guard' });
    rail(DX0 + 0.3, DZ0 + 0.3, gx(OVER.cx), DZ0 + 0.3); rail(DX1 - 0.3, DZ0 + 0.3, DX1 - 0.3, DZ1 - 0.3); rail(DX0 + 0.3, DZ1 - 0.3, DX1 - 0.3, DZ1 - 0.3); rail(DX0 + 0.3, DZ0 + 3.5, DX0 + 0.3, DZ1 - 0.3);
    rail(gx(DECK.ramp0) + 0.4, DZ0 + 0.25, DX0, DZ0 + 0.25);
    /* its look: dark bays between concrete piers along the road face, a white band, PARKING over the ramp */
    { const W = DX1 - DX0, parts = [];
      for (let i = 0; i < DECK.x1 - DECK.x0; i++) parts.push({ s: 'box', p: [-W / 2 + (i + 0.5) * 3.5, 0.5, 0.02], size: [2.7, 2.2, 0.1], tint: 0x14171b });
      parts.push({ s: 'box', p: [0, 2.9, 0.03], size: [W, 0.5, 0.12], tint: 0xf2f0e8 }, { s: 'box', p: [0, 0, 0.03], size: [W, 0.45, 0.12], tint: 0xe0b020 });
      parts.push({ s: 'quad', p: [-W / 2 + 5.25, 2.93, 0.12], ry: 0, size: [4.4, 0.44], key: 'txt:PARKING|#20242a||10', uv: 'fit', kind: 'over' });
      lateRows.push({ k: 'arch', id: 'dc:deck:arch', x: r3((DX0 + DX1) / 2), z: r3(DZ0 - 0.02), rot: 180, parts }); }
    prop('car_suv', gx(130.9), gc(142) + 0.3, 0, { y: H }); prop('car_cadillac', gx(128.3), gc(142) + 0.3, 180, { y: H });
    /* the overpass: the roof → over the south road and the canal → the landing on the north walk, its stair east along the walk */
    const OX = gc(OVER.cx);
    lateRows.push({ k: 'plateau', id: 'dc:overpass:landing', x: OX, z: gc(132), w: 3.5, d: 3.5, h: H, edge: 0.05, absY: true });
    lateRows.push({ k: 'bridge', id: 'dc:overpass', x0: OX, z0: r3(DZ0 + 0.7), x1: OX, z1: gc(132), w: 3.2, y: H, absY: true });   // (to the landing's MIDDLE: a one-square tier's rim reads low on the 0.875 m field)
    lateRows.push({ k: 'ramp', id: 'dc:overpass:stair', absY: true, x0: r3(gx(134) + 0.35), z0: gc(132), x1: r3(gx(132) + 0.1), z1: gc(132), w: 3.2, h0: 0, h1: H, stairs: true, model: 'concrete', edge: 0.01 });
    moveOut(OVER.cx, 132, 134, 133, q => [q.x, gx(132) - 0.6]);
    takeRect(OVER.cx, 132, 134, 133);

    /* ═══ 3 · THE COLLAPSE (Memorial walk's west half) ═══ */
    { const p = plotOf[COL.plot], PX = gx(p.x * N), PZ = gx(p.y * N), L = (lx, ly) => [r3(PX + lx * 3.5), r3(PZ + ly * 3.5)];
      const at = (key, lx, ly, face, o) => { const q = L(lx, ly); return prop(key, q[0], q[1], face, o); };
      /* Hero Plaza's benches and trees on these squares move to the walk's edge beside them (never dropped) */
      moveOut(p.x * N + 1, p.y * N + 1, p.x * N + 5, p.y * N + 5, q => [L(4.72, 0)[0], q.z]);
      moveOut(p.x * N + 2, p.y * N + 7, p.x * N + 5, p.y * N + 11, q => [L(4.72, 0)[0], q.z]);
      features.forEach(f => { if (f.k !== 'tree') return; const lx = (f.x - PX) / 3.5, ly = (f.z - PZ) / 3.5; if (lx >= 1 && lx < 5 && ly >= 1 && ly < 5) { f.x = L(0.5, 0)[0]; f.z = L(0, 0.5)[1]; } });   // the north-west tree: onto the plot's corner square
      /* the rubble mound where the tower came down, its stones and blocks, the fallen pillars, the wrecks, the barrel fires, the tape */
      { const c = L(3, 3); lateRows.push({ k: 'hill', id: 'dc:collapse:mound', x: c[0], z: c[1], r: 5.4, h: 1.5, open: true }); }
      [[2.2, 2.3], [3.4, 2.6], [4.2, 3.3], [3.3, 4.3], [1.9, 3.7], [2.55, 3.35], [1.5, 2.6]].forEach((s, i) => at('cave_stone', s[0], s[1], (i * 67) % 360));
      [[1.6, 1.7], [2.7, 1.5], [4.5, 2.7], [4.5, 3.9], [3.9, 4.6], [2.6, 4.6], [2.0, 3.2], [3.1, 3.7], [2.4, 2.6]].forEach((s, i) => at('cinder_block', s[0], s[1], (i * 41) % 360));
      at('concrete_pillar', 1.5, 1.5, 0); at('concrete_pillar', 4.5, 4.5, 0);
      at('crashed_car', 1.5, 4.5, 300); at('crashed_car_2', 3.75, 1.5, 20);
      at('brazier', 1.3, 3.2, 0); at('brazier', 4.7, 3.3, 0); at('brazier', 2.3, 1.25, 0);
      at('warning_tape', 3, 4.95, 0);
      takeRect(p.x * N + 1, p.y * N + 1, p.x * N + 5, p.y * N + 5);
      /* THE TERRACE: 3 x 2 squares at 3.5 m, the stair up its north side on the middle square */
      { const a = L(2, 9), b = L(5, 11), s0 = L(3.5, 7), s1 = L(3.5, 9);
        lateRows.push({ k: 'plateau', id: 'dc:collapse:terrace', x: r3((a[0] + b[0]) / 2), z: r3((a[1] + b[1]) / 2), w: r3(b[0] - a[0]), d: r3(b[1] - a[1]), h: 3.5, edge: 0.05 });
        lateRows.push({ k: 'ramp', id: 'dc:collapse:stair', x0: s0[0], z0: s0[1], x1: s1[0], z1: r3(s1[1] + 0.7), w: 3.2, h0: 0, h1: 3.5, stairs: true, model: 'concrete', edge: 0.01 });
        lateRows.push({ k: 'rail', x0: r3(a[0] + 0.3), z0: r3(b[1] - 0.3), x1: r3(b[0] - 0.3), z1: r3(b[1] - 0.3), model: 'guard' }, { k: 'rail', x0: r3(b[0] - 0.3), z0: r3(a[1] + 0.3), x1: r3(b[0] - 0.3), z1: r3(b[1] - 0.3), model: 'guard' });
        at('brazier', 4.5, 10.5, 0, { y: 3.5 }); at('cinder_block', 2.4, 9.4, 20, { y: 3.5 }); at('cinder_block', 2.6, 10.6, 70, { y: 3.5 });
        takeRect(p.x * N + 2, p.y * N + 7, p.x * N + 5, p.y * N + 11); } }

    /* ═══ 4 · THE SET PIECES ═══ */
    const freeIn = (name, w, h, lx0, ly0) => { const p = ctx.PLAN.plots.find(q => q.name === name); if (!p) return null;
        for (let ly = ly0 || 1; ly + h <= 11; ly++) for (let lx = lx0 || 1; lx + w <= 11; lx++) { let ok = true;
            for (let dy = 0; dy < h && ok; dy++) for (let dx = 0; dx < w && ok; dx++) if (!free(p.x * N + lx + dx, p.y * N + ly + dy, '.')) ok = false;
            if (ok) { takeRect(p.x * N + lx, p.y * N + ly, p.x * N + lx + w, p.y * N + ly + h); return [p.x * N + lx, p.y * N + ly]; } }
        console.warn('[landmarks] no free yard for a set piece on', name); return null; };
    { const c = freeIn('Night market', 2, 1); if (c) { prop('fortune_tent', gc(c[0]), gc(c[1]), 180); prop('high_striker', gc(c[0] + 1), gc(c[1]), 180); } }
    { const c = freeIn('Rail service', 3, 1, 7, 10); if (c) prop('subway_cart', gc(c[0] + 1), gc(c[1]), 90); }
    console.warn('[landmarks]', JSON.stringify({ props: mine.size }));
}

module.exports = { apply, build };
