/* THE BILLBOARDS (2026-11-20, the branding pass; mondo: "There should be neon signs and billboards in disaster city, with the streets that
   have nightlife looking like a major city"). Lit two-faced boards on the roofs of the two nightlife districts (E Entertainment, B Bayside)
   and a few over Hero Plaza and Financial, each an advert for one of the city's chains (docs/notes/branding.md). No district file is
   edited: bake-disaster-city.js calls `apply` on the finished rows, and a board is one new arch row (`bb:<building id>`) over a building.
   Where: per district (PER), the buildings (`texbuilding` rows `dc:Pxx-yy-Bn`, at least 10 x 7 m) with the most storeys whose dressing
   row (`<id>:arch`) has no pitched roof or dome. Two boards a building, one at each long edge of the roof (over the tallest slab the
   dressing lays there), each reading outward. The adverts are dealt in order, so a rebake gives the same city.
   `SIGNS_DUMP=1 node bake-disaster-city.js --dry-run` prints each board's building, place and advert.
   A board: two posts, a lit panel in the brand's ground colour, the name (its chain mark left of it, three-renderer.js HQ_CHAIN_MARKS)
   and the line under it. */
'use strict';
const r2 = v => Math.round(v * 100) / 100, hex = c => parseInt(String(c).slice(1), 16);
/* [name, line, fg, bg, font, mark] */
const ADS = [
    ['ACT OF GOD INSURANCE', 'NOT COVERED.', '#111111', '#ffd21f', 'abril', 'bolt'],
    ['CALAMITY MUTUAL', 'TOO BIG TO FAIL.', '#e9d9a6', '#12332a', 'playfair', 'bank'],
    ['KABOOM! COLA', 'SHAKE WELL.', '#fff04a', '#7a1fd0', 'bungee', 'burst'],
    ['MID RECORDS', 'NEW ALBUM OUT NOW. IT’S FINE.', '#111111', '#e6e2d6', 'dela', 'mid'],
    ['PHOENIX RECONSTRUCTION', 'WE REBUILD. AGAIN.', '#ff8a1f', '#16161c', 'staat', 'flame'],
    ['ICARUS AEROSPACE', 'AIM HIGHER.', '#ffffff', '#163a6b', 'righteous', 'wing'],
    ['MELTDOWN BURGER', 'DANGEROUSLY CHEESY.', '#ffe14a', '#c8202a', 'bungee', 'burger'],
    ['JITTERS COFFEE', 'ONE MORE CUP.', '#fff3df', '#6b2f1a', 'pacifico', 'cup'],
    ['LANDSLIDE REALTY', 'HOMES THAT MOVE YOU.', '#2b2118', '#e9c9a0', 'playfair', ''],
    ['PANDORA SHIPPING', 'WE NEVER OPEN THE BOX.', '#f1e2c0', '#4a2f6b', 'alfa', 'crate'],
    ['HERO ENERGY', 'SAVE THE DAY. AGAIN TOMORROW.', '#ffffff', '#c8202a', 'archivo', ''],
    ['SNAKE EYES CASINO', 'FEELING LUCKY?', '#fff2c0', '#5a0c14', 'fasc', '']
];
const PER = { E: 7, B: 5, F: 2 }, STOREY = 3.5;
/* one board: its own arch row over the building, in world axes (the dressing rows `<id>:arch` are written the same way) */
function board(c, ads) {
    const parts = [], W = r2(Math.min(c.L * 0.8, 12)), Hh = r2(Math.min(W / 2.5, 4.6)), leg = 0.7, t = 0.3, T = c.T, ax = c.alongX;
    /* one board at each long edge of the roof, reading outward over the street below (11-20: a board on the roof's middle was hidden by the roof's own edge) */
    [1, -1].forEach((s, i) => { const ad = ads[i], e = s * (c.S / 2 - 0.3);
        const at = (u, y, off) => ax ? [r2(u), r2(y), r2(e + off)] : [r2(e + off), r2(y), r2(u)];
        const box3 = (u, y, len, hh, th, tint, x) => parts.push(Object.assign({ s: 'box', p: at(u, y, 0), size: ax ? [len, hh, th] : [th, hh, len], tint }, x || {}));
        for (const q of [-1, 1]) box3(q * (W / 2 - 0.5), T, 0.3, leg + Hh, 0.2, 0x2a2c32);
        box3(0, T + leg - 0.12, W + 0.3, Hh + 0.24, t - 0.08, 0x1a1b20);            // the frame
        box3(0, T + leg, W, Hh, t, hex(ad[3]), { glow: 0.55 });                      // the lit panel
        const ry = ax ? (s > 0 ? 0 : 180) : (s > 0 ? 270 : 90), off = s * (t / 2 + 0.02);
        const q = (y, ww, hh, words, font, mark) => parts.push({ s: 'quad', p: at(0, y, off), size: [r2(ww), r2(hh)], ry, uv: 'fit', kind: 'over', glow: 0.95, tint: 16777215,
            key: 'txt:' + words + '|' + ad[2] + '||' + r2(ww / hh) + '||' + font + (mark ? '|' + mark : '') });
        q(T + leg + Hh * 0.36, W * 0.9, Hh * 0.52, ad[0], ad[4], ad[5]); q(T + leg + Hh * 0.1, W * 0.8, Hh * 0.19, ad[1], 'way', ''); });
    return { k: 'arch', id: 'bb:' + c.id, x: c.x, z: c.z, y: c.y, rot: 0, parts };
}
/* rows = the city's rows (new board rows are pushed onto it and returned in `rows`); districtOf(row) = its district letter */
function apply(rows, districtOf) {
    const K = { boards: 0, on: [], rows: [] }, by = {}, dress = {};
    for (const r of rows) if (r.k === 'arch' && /:arch$/.test(String(r.id || '')) && Array.isArray(r.parts)) dress[String(r.id).replace(/:arch$/, '')] = r;
    for (const r of rows) { if (r.k !== 'texbuilding' || !/^dc:P\d\d-\d\d-B\d$/.test(String(r.id || ''))) continue;
        const d = districtOf(r); if (!PER[d]) continue;
        const A = dress[r.id]; if (!A || typeof A.y !== 'number') continue;                       // (the dressing row carries the building's ground level)
        const turned = (((+r.rot || 0) % 180) + 180) % 180 === 90, wx = turned ? r.d : r.w, wz = turned ? r.w : r.d;
        if (Math.max(wx, wz) < 10 || Math.min(wx, wz) < 7 || (r.storeys || 1) > 4) continue;                                   // (no board on a tower's top: nobody reads it from the street)
        if (A.parts.some(p => p.s === 'roof' || p.s === 'cyl' && p.p && p.p[1] > (r.storeys || 1) * STOREY - 0.5 && (p.size || [])[0] > 3)) continue;   // a pitched roof or a dome: no board
        let T = (r.storeys || 1) * STOREY; for (const p of A.parts) if (p.s === 'box' && p.size && p.p && p.size[0] * p.size[2] > wx * wz * 0.3) T = Math.max(T, p.p[1] + p.size[1]);
        if (T > 20) continue;                                                                    // (a dressed tower, e.g. the hotel: same reason)
        (by[d] = by[d] || []).push({ id: r.id, x: r.x, z: r.z, y: A.y, T: r2(T), L: Math.max(wx, wz), S: Math.min(wx, wz), alongX: wx >= wz, st: r.storeys || 1 }); }
    let n = 0;
    for (const d of Object.keys(PER)) { const L = (by[d] || []).sort((a, c) => c.st - a.st || String(a.id).localeCompare(String(c.id))).slice(0, PER[d]);
        for (const c of L) { const ads = [ADS[n++ % ADS.length], ADS[n++ % ADS.length]], row = board(c, ads); rows.push(row); K.rows.push(row); K.boards += 2; K.on.push(d + ' ' + c.id + ' x ' + c.x + ' z ' + c.z + ' y ' + c.y + ' top ' + c.T + ' half ' + c.S / 2 + (c.alongX ? ' S: ' + ads[0][0] + ' · N: ' + ads[1][0] : ' E: ' + ads[0][0] + ' · W: ' + ads[1][0])); } }
    return K;
}
module.exports = { apply, ADS, PER };
