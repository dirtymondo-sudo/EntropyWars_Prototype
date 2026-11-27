/* DISASTER CITY, THE HARBOUR IN THE CITY'S ROOM (2026-11-27, mondo: "it's supposed to be one beach but i have to walk out on the dock to get to this other
   harbor?? and then that one doesnt have a good exit back to the beach ... its just water? And then on the map these places arent even connected? Its the
   same beach" + "making the beach connected would mean disaster city and the ocean ... become one room. fuck it let's do it").
   Read by docs/disaster-city/spread.js as ITS last step (so by `node bake-disaster-city.js`). Notes: docs/notes/areas-complexes.md "ONE BEACH, ONE ROOM".

   WHAT IT DOES. The Harbour (the Beach zone's district H: the Quay and its shed, the gantry, the slipway, the Breakwater and its light, the Long Pier, the
   skiff jetty, the Flying Dutchman) stood in a sea room of its own (`site_prebuilt_bermuda_beach`, written by bake-beach.js) that lay right against the
   city's east line: its quay 8 m off the city's sand, cut off by the room's line, reached only through a door halfway down the pier. This file SETS THAT
   ROOM'S CONTENT DOWN IN THE CITY'S ROOM, at the very squares it always stood on (the sea room's (x, z) = the city's (x + 455, z - 126); the two rooms'
   piers were drawn on the same line), and grows the city's room EAST over the water to hold it:

       the city's grids   224 -> 264 squares across (x -392 .. 532); 216 down, as before. NO PLACE OF THE CITY MOVES: X0, DX, DZ stay.
       the shell          centred, so it grows the same on the west: a 140 m DEAD STRIP under the forest past the city's west line
                          (`edges.w.inset`, three-renderer.js THE DEAD STRIP: not drawn, not walked; a ghost wall stands on the old line)
       the sea            the city's (-1.45): everything of the sea room (whose sea stood at 0) comes down 1.45 m

   The sea room's block stays in data.js as THE SOURCE (bake-beach.js still writes it; district file `docs/areas/beach/districts/H.js` is still the
   Harbour's design); the room itself is retired (data.js DOOR_HQ.retired) and nobody enters it. After an edit of H.js: `node bake-beach.js`, then
   `node bake-disaster-city.js`.

   THE GROUND. East of the old line (x >= 392) the height sheet is this file's: the sea's floor, and the sea room's own squares on it. The city's sea is
   cut by SUNK plateau rows (districts/B.js `coastCut`) that reach up to 45 m past the old line, and west of the line the sheet under the sea is the
   district's own level: so every square of harbour ground that a sunk row touches is RAISED again by a plateau row of its own, after the cuts
   (`blend: 'ground'`, each a hair wider than its squares so no seam opens between two of them).
   THE JOIN TO THE SAND. The Quay's landing is carried five squares west (`LANDING`) onto the Shore's sand, at the quay's height: you walk off the sand
   onto the stones. The Long Pier starts on the sand as it always did in the sea room (its first squares were "behind the door, in open water" there).
   WHAT IS LEFT OUT: the sea room's west 18 columns (the city's own beach lies there), its drawn city front (`bch:bayside:look`), its door `quay`, its
   healing ring, and whatever of the open Ocean lay past x 532 (the whale). The city's own Long Pier (districts/W.js: the deck, its look, the far look
   past the room's line) and its door `harbour` are taken out: the Harbour's own pier is the pier. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = path.join(__dirname, '../..');
const C = 3.5, EAST = 40, DXS = 455, DZS = -126, SEA = -1.45, FLOOR = -3.6, FLOOR_N = -4.2;
const SI0 = 18;                                  // the sea room's first column that is carried over (its west 18 are the city's own beach)
const LANDING = { i0: 19, i1: 23, j0: 36, j1: 42, h: 90, sheet: 'cobblestone' };   // the Quay's landing on the sand (the sea room's squares; cm over ITS sea)
const SHEETS = { rocks_5: 'rocks_5', cobblestone: 'cobblestone', wood_planks: 'urban:WoodFlooring1a' };
const r3 = v => Math.round(v * 1000) / 1000;
/* where the Beach gate stands (the room's own metres): Bayside's boardwalk, at the head of the ramp down to the sand beside the pleasure pier (the way
   from the mall onto the beach). rot 180 = THE BEACH faces west, the city's name faces the sand. null = the gate stays on the Shore's Boardwalk spur. */
const GATE = { x: 285.9, z: 77, y: 0, rot: 180 };
/* THE HARBOUR'S PEOPLE (the sea room's frame): the eight the board stood there (data.js HQ_NPC_PLACES `site_prebuilt_bermuda_beach`, mondo's approved
   list: places, routes, the siren by night), as the game placed them the day the room was retired. The city's own row in HQ_NPC_PLACES keeps their
   races (`<race> keep`). To change who stands in the Harbour: this table. */
const PEOPLE = [
    {"x": -64.75, "z": -61.25, "face": 180, "race": "pirate", "say": ["“The light is for her.” “For the ship?” “She keeps coming in. She never arrives.”", "“Past the buoys the sea stops being the city’s.” “Whose is it?” “Room 345’s.”"], "gender": "male", "place": true, "stay": false, "roam": true, "route": [[-17.03, 67.96], [-25.12, -21.94]]},
    {"x": -81.65, "z": -61.25, "face": 135, "race": "pirate", "gender": "female", "place": true, "stay": false, "roam": true, "route": [[-66.69, -68.34], [-31.81, -23.02]]},
    {"x": -60.46, "z": -25.55, "face": 259, "race": "deep sea diver", "snap": true, "place": true, "stay": false, "roam": true, "route": [[-68.93, -67.83], [-81.09, -62.4]]},
    {"x": -59.33, "z": -69.37, "face": 326, "race": "florida man", "snap": true, "place": true, "stay": false, "roam": true, "route": [[-25.52, 66.89], [-60.57, -21.41]]},
    {"x": -46.35, "z": -64.15, "face": 200, "race": "sharkman", "place": true, "stay": false, "roam": true, "route": [[-81.99, -62.03], [-27.91, 59.09]]},
    {"x": -19.5, "z": 63.48, "face": 297, "race": "kraken", "snap": true, "place": true, "stay": true, "roam": false},
    {"x": -25.37, "z": 21.63, "face": 296, "race": "jellyfish", "snap": true, "place": true, "stay": false, "roam": true, "route": [[-15.24, 57.18], [-63.61, -61.43]]},
    {"x": -16.91, "z": -69.14, "face": 102, "race": "siren", "snap": true, "place": true, "stay": true, "roam": false, "hours": [20, 6]}
];

function seaRoom() {
    const src = fs.readFileSync(path.join(REPO, 'data.js'), 'utf8'), a = src.indexOf('/* BEACH140-BEGIN'), b = src.indexOf('BEACH140-END');
    if (a < 0 || b < a) throw new Error('THE HARBOUR: no BEACH140 block in data.js (run node bake-beach.js)');
    const o = vm.runInNewContext('({' + src.slice(a, src.lastIndexOf('/*', b)) + '})', { hqSeaShell: q => ({ __sea: q }) });
    if (!o.site_prebuilt_bermuda_beach) throw new Error('THE HARBOUR: the sea room is not in the BEACH140 block');
    return o.site_prebuilt_bermuda_beach;
}

/* ctx = { room, T, H, FL, P, NX, NZ, X0, Z0, b64, count, say } : the spread room just before it is written. Changes room and T in place. */
function lay(ctx) {
    const { room, T, NX, NZ, X0, Z0, b64 } = ctx, S = seaRoom(), ST = S.terrain;
    const NX2 = NX + EAST, XE0 = X0 + NX * C, XE = X0 + NX2 * C, count = { squares: 0, raised: 0, rows: 0, props: 0, people: 0, left: 0, cleared: 0 };
    const sc = ST.slope.cells, sh = new Int16Array(new Uint8Array(Buffer.from(sc.d, 'base64')).buffer), sp = new Uint8Array(Buffer.from(ST.paint.d, 'base64'));
    if (sc.nx !== 96 || sc.nz !== 120 || sc.x0 !== -168 || sc.z0 !== -210) throw new Error('THE HARBOUR: the sea room is not the size this file was written for');
    const SBASE = Math.min(...sh);                                           // the sea room's floor (cm)
    const ci = si => si + Math.round((sc.x0 + DXS - X0) / C), cj = sj => sj + Math.round((sc.z0 + DZS - Z0) / C);
    const mx = x => r3(x + DXS), mz = z => r3(z + DZS), my = y => r3(y + SEA);
    const inRoom = (x, z) => x >= X0 + SI0 * C + (sc.x0 + DXS - X0) - 0.01 && x < XE - 1 && z > Z0 + 1 && z < -Z0 - 1;

    /* ── 1. the grids, 40 squares wider ── */
    const H2 = new Float32Array(NX2 * NZ * 4), F2 = new Uint8Array(NX2 * NZ), P2 = new Uint8Array(NX2 * NZ), K2 = (i, j) => j * NX2 + i;
    const pal = T.paint.pal.slice(), sheetIx = name => { let i = pal.indexOf(name); if (i < 0) { if (pal.length >= 16) throw new Error('THE HARBOUR: the ground palette is full: ' + name); pal.push(name); i = pal.length - 1; } return i + 1; };
    const SAND = sheetIx('desert');
    for (let j = 0; j < NZ; j++) {
        for (let i = 0; i < NX; i++) { const k = j * NX + i, k2 = K2(i, j); for (let q = 0; q < 4; q++) H2[k2 * 4 + q] = ctx.H[k * 4 + q]; F2[k2] = ctx.FL[k]; P2[k2] = ctx.P[k]; }
        const hills = j < 36, fl = hills ? FLOOR_N : FLOOR, last = K2(NX - 1, j);
        for (let i = NX; i < NX2; i++) { const k2 = K2(i, j); H2[k2 * 4] = H2[k2 * 4 + 1] = H2[k2 * 4 + 2] = H2[k2 * 4 + 3] = fl; P2[k2] = hills ? P2[last] : SAND; }
        /* (the old last column's east corners come down to the sea's floor: a line between two squares reads the HIGHER side, and the sheet under the
           city's sea is the district's own level there, cut down only by the sunk rows) */
        H2[last * 4 + 1] = Math.min(H2[last * 4 + 1], fl); H2[last * 4 + 3] = Math.min(H2[last * 4 + 3], fl);
    }
    /* the sea room's own ground: each square that is not its bare floor. `land[sj][si]` = [four corners in the city's metres, sheet index] */
    const land = [];
    for (let sj = 0; sj < sc.nz; sj++) for (let si = SI0; si < sc.nx; si++) {
        const o = (sj * sc.nx + si) * 4; let v = [sh[o], sh[o + 1], sh[o + 2], sh[o + 3]], pv = sp[sj * sc.nx + si];
        if (si >= LANDING.i0 && si <= LANDING.i1 && sj >= LANDING.j0 && sj <= LANDING.j1) { v = [LANDING.h, LANDING.h, LANDING.h, LANDING.h]; pv = ST.paint.pal.indexOf(LANDING.sheet) + 1; }
        else if (si < 24 && sj >= 36 && sj <= 49) continue;                // the sea room's own foreshore west of the quay: the city's sand lies there
        if (Math.max(...v) <= SBASE) continue;
        const i = ci(si), j = cj(sj); if (i >= NX2 - 1 || j < 1 || j >= NZ - 1) { count.left++; continue; }
        const name = pv ? ST.paint.pal[pv - 1] : null, ix = name ? sheetIx(SHEETS[name] || name) : SAND;
        land.push({ i, j, h: v.map(q => q / 100 + SEA), ix });
    }
    for (const q of land) { const k2 = K2(q.i, q.j); P2[k2] = q.ix; F2[k2] = 0; if (q.i >= NX) for (let c = 0; c < 4; c++) H2[k2 * 4 + c] = q.h[c]; count.squares++; }

    /* ── 2. the sunk rows of the city's sea, and the harbour ground they touch raised again ── */
    const sinks = T.features.filter(f => f.k === 'plateau' && f.sink).map(f => f.r > 0 ? [f.x - f.r - 1, f.z - f.r - 1, f.x + f.r + 1, f.z + f.r + 1] : [f.x - f.w / 2 - 1, f.z - f.d / 2 - 1, f.x + f.w / 2 + 1, f.z + f.d / 2 + 1]);
    const sunk = q => { if (q.i < NX) return true; const x0 = X0 + q.i * C, z0 = Z0 + q.j * C; return sinks.some(s => x0 + C > s[0] && x0 < s[2] && z0 + C > s[1] && z0 < s[3]); };
    const up = land.filter(sunk), at = {}; up.forEach(q => { q.flat = r3((q.h[0] + q.h[1] + q.h[2] + q.h[3]) / 4); at[q.i + ',' + q.j] = q; });
    const raised = [];
    up.sort((a, b) => a.j - b.j || a.i - b.i).forEach(q => { if (q.done) return;
        let w = 1; while (at[(q.i + w) + ',' + q.j] && !at[(q.i + w) + ',' + q.j].done && at[(q.i + w) + ',' + q.j].flat === q.flat) w++;
        let d = 1; grow: for (;;) { for (let u = 0; u < w; u++) { const n = at[(q.i + u) + ',' + (q.j + d)]; if (!n || n.done || n.flat !== q.flat) break grow; } d++; }
        for (let v = 0; v < d; v++) for (let u = 0; u < w; u++) at[(q.i + u) + ',' + (q.j + v)].done = true;
        raised.push({ k: 'plateau', id: 'hb:ground' + raised.length, x: r3(X0 + (q.i + w / 2) * C), z: r3(Z0 + (q.j + d / 2) * C), w: r3(w * C + 0.1), d: r3(d * C + 0.1), h: q.flat, absY: true, blend: 'ground', edge: 0.05 }); });
    count.raised = raised.length;

    /* ── 3. the city's own things that the Harbour replaces ── */
    const GONE = { 'shore:longpier': 1, 'shore:longpier:look': 1, 'shore:longpier-far:look': 1 };
    T.features = T.features.filter(f => !GONE[f.id]);
    const onLand = {}; land.forEach(q => { onLand[q.i + ',' + q.j] = 1; });
    const sqOf = (x, z) => Math.floor((x - X0) / C) + ',' + Math.floor((z - Z0) / C);
    room.props = room.props.filter(p => { if (p.x > XE0 - 45 && onLand[sqOf(p.x, p.z)]) { count.cleared++; return false; } return true; });
    room.doors = room.doors.filter(d => d.id !== 'harbour');

    /* ── 4. the sea room's rows, props and people, at their places in this room ── */
    const DROP = { 'bch:bayside:look': 1 };
    const feats = [];
    for (const f0 of ST.features) { if (DROP[f0.id]) continue; const f = JSON.parse(JSON.stringify(f0));
        const ax = f.x != null ? f.x : f.pts ? f.pts[0][0] : (f.x0 + f.x1) / 2, az = f.z != null ? f.z : f.pts ? f.pts[0][1] : (f.z0 + f.z1) / 2;
        if (!inRoom(mx(ax), mz(az))) { count.left++; continue; }
        if (f.x != null) { f.x = mx(f.x); f.z = mz(f.z); } if (f.x0 != null) { f.x0 = mx(f.x0); f.z0 = mz(f.z0); f.x1 = mx(f.x1); f.z1 = mz(f.z1); } if (f.pts) f.pts = f.pts.map(p => [mx(p[0]), mz(p[1])].concat(p.slice(2)));
        if (f.k === 'plateau') f.h = my(f.h); else if (f.k === 'ramp') { f.h0 = my(f.h0); f.h1 = my(f.h1); } else if (f.k === 'arch') f.y = my(f.y || 0); else if (typeof f.y === 'number') f.y = my(f.y);
        if (f.id) f.id = String(f.id).replace(/^bch:/, 'hb:');
        feats.push(f); count.rows++; }
    T.features = T.features.concat(raised, feats);
    for (const p0 of S.props) { const p = Object.assign({}, p0, { x: mx(p0.x), z: mz(p0.z) }); if (!inRoom(p.x, p.z)) { count.left++; continue; }
        /* a typed height of 1 m up or more, or half a metre down or more, is the room's own (three-renderer.js: `max(ground, y)`): it comes down with the sea */
        if (typeof p.y === 'number' && (p.y >= 1 || p.y <= -0.5)) { const y = my(p.y); p.y = (y >= 1 || y <= -0.5) ? y : 1; }
        room.props.push(p); count.props++; }
    for (const n0 of PEOPLE) { const n = Object.assign({}, n0, { x: mx(n0.x), z: mz(n0.z) }); if (!inRoom(n.x, n.z)) { count.left++; continue; }
        if (Array.isArray(n.route)) n.route = n.route.map(p => [mx(p[0]), mz(p[1])]);
        room.npcSpots.push(n); count.people++; }
    { const have = (T.moored || []).map(m => m.x + ',' + m.z); (ST.moored || []).forEach(m => { const o = Object.assign({}, m, { x: mx(m.x), z: mz(m.z) }); if (have.indexOf(o.x + ',' + o.z) < 0) (T.moored = T.moored || []).push(o); }); }

    /* ── 4b. THE BEACH GATE (mondo 11-27: "there is a little arch thing that says beach but it seems totally in the wrong spot like it should be down at
       the other end of the beach"). It is the Shore's gate (docs/areas/beach/districts/S.js: two white pylons, a navy beam, pennants), drawn at the
       landward end of the Boardwalk spur: in the sea room that was the door from the city, here it is the foot of Entertainment's sea wall, where no
       street comes down. The gate is taken off the spur and stood at `GATE`, turned so THE BEACH reads toward the city. ── */
    { const bw = T.features.find(f => f.id === 'shore:boardwalk:look'), GX = -12.7;
      if (bw && GATE) { const mine = bw.parts.filter(q => Math.abs(q.p[0] - GX) < 0.3); bw.parts = bw.parts.filter(q => Math.abs(q.p[0] - GX) >= 0.3);
          if (mine.length < 8) throw new Error('THE HARBOUR: the Shore\'s gate was not found on the Boardwalk spur (' + mine.length + ' parts)');
          T.features.push({ k: 'arch', id: 'dc:beach-gate:arch', x: GATE.x, z: GATE.z, y: GATE.y || 0, rot: GATE.rot, parts: mine.map(q => Object.assign({}, q, { p: [r3(q.p[0] - GX), q.p[1], q.p[2]] })) }); count.gate = mine.length; } }

    /* ── 5. the room round it ── */
    room.shell = { __shell: Object.assign({}, room.shell.__shell, { w: r3(2 * XE) }) };
    room.dc144 = Object.assign({}, room.dc144, { harbour: { x0: XE0, x1: XE, dx: DXS, dz: DZS, sea: SEA, from: 'site_prebuilt_bermuda_beach' } });
    room.sub = 'NINE DISTRICTS · THE BEACH · THE HARBOUR';
    T.slope = { cells: { res: C, x0: X0, z0: Z0, nx: NX2, nz: NZ, f: b64.enc(F2), d: b64.enc(Int16Array.from(H2, v => Math.round(v * 100))) } };
    T.paint = Object.assign({}, T.paint, { pal, nx: NX2, d: b64.enc(P2) });
    /* the ground zones: the Hills' rows run on over the new water; the Harbour is two boxes of its own AHEAD of the beach's (the first box that holds
       a square wins): its eight sheets are the sand, the boards, the rock and the quay's stones */
    const beach = (T.zones || []).find(z => Math.abs(z.x1 - XE0) < 0.01 && z.z1 > 0), hpal = ['desert', 'urban:WoodFlooring1a', 'rocks_5', 'cobblestone'].concat((beach ? beach.pal : pal).filter(n => ['desert', 'urban:WoodFlooring1a', 'rocks_5', 'cobblestone'].indexOf(n) < 0)).slice(0, 8);
    const hz = (x0, z0, x1, z1) => Object.assign({}, beach || {}, { x0, z0, x1, z1, pal: hpal, out: ((beach && beach.out) || []).filter(q => q[2] > x0 && q[0] < x1 && q[3] > z0 && q[1] < z1) });
    T.zones = [hz(r3(XE0 - 12 * C), -217, XE0, -105), hz(XE0, -252, XE, -Z0)].concat((T.zones || []).map(z => (z.z1 <= -252 + 0.01 && Math.abs(z.x1 - XE0) < 0.01) ? Object.assign({}, z, { x1: XE }) : z));
    /* the edges: the dead strip in the west, the coast 140 m further east */
    const E = T.edges, wide = EAST * C, cap = (c, k) => c ? Object.assign({}, c, { [k]: r3((c[k] || 0) + wide) }) : c;
    T.edges = Object.assign({}, E, { w: Object.assign({}, E.w, { inset: r3(wide - 0.1) }), n: Object.assign({}, E.n, { cap: cap(E.n.cap, 'len') }), s: Object.assign({}, E.s, { cap: cap(E.s.cap, 'off') }) });
    T.backdropInset = { w: wide };
    T.backdropOpen = (T.backdropOpen || []).map(q => [q[0] >= XE0 - 2 ? r3(q[0] + wide) : q[0], q[1], r3(q[2] + wide), q[3]]);
    T.features.push({ k: 'wall', id: 'dc:deadstrip:w', x0: r3(X0 - 0.4), z0: Z0, x1: r3(X0 - 0.4), z1: -Z0, h: 60, t: 0.4, key: 'urban:ConcreteStriped2a', ghost: true, rail: false });   // the city's west line: the shell runs 140 m on, under the forest
    ctx.count.harbour = count;
    return { count, land, raised, NX2, XE };
}
module.exports = { lay, EAST, DXS, DZS, SEA, seaRoom };
