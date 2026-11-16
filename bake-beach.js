#!/usr/bin/env node
/* bake-beach.js — THE BEACH ON PLOTS (2026-11-15, mondo's OK on plot plan 3 + his answers: the size "fine for now", the Triangle "fine", "add a
   remote island with a volcano and unconnected tribe (eventually will make models for)", the plain plot labels "fine for now", the Beach Huts
   "walk ins", the old PvP board kept "for now"). The sixth area of the world plan: 14 x 10 plots of 12 x 12 squares (588 x 420 m), four districts:
   THE SHORE (the west coast, off Disaster City's Bayside), THE HARBOUR (the Quay, the Long Pier, the Flying Dutchman), THE OCEAN (open water you
   sail by skiff and swim, the Volcano Island far out north) and THE BERMUDA TRIANGLE (a 3-4-5 right triangle of sea: the Lighthouse Rock, the Cay
   island and the Maelstrom at its corners).
   Reads docs/areas/beach/layout.json (the approved plan 4: every plot's name, district, level and the 168 x 120 square map) and writes the room
   `site_prebuilt_bermuda_beach` into data.js between BEACH140-BEGIN / BEACH140-END. `node bake-beach.js` writes; `--dry-run` prints the counts;
   `BEACH_DUMP=1` prints the height map. Never hand-edit between the markers: edit a district file, this tool or the layout and rerun.
   THE DISTRICTS' CONTENT IS NOT HERE (2026-11-16): docs/areas/beach/districts/S.js H.js O.js T.js (see THE DISTRICT FILES below). This tool
   holds only what is shared; nobody edits it without a note on docs/notes/claims.md.
   Notes: docs/notes/areas-complexes.md "THE BEACH ON PLOTS".
   HOW THE ROOM IS MADE: a SEA room (terrain.sea at 0, the old Bermuda sea room's way: no plan walls, the whole field is walked, waded, swum or
   sailed). THE HEIGHTS ARE THE MAP: terrain.slope.cells carries every square's four corners. Sand rises from the waterline by its distance to
   the water (a beach everywhere), the sea floor falls by its distance from the sand (a wade, then a swim), and the hard squares (the quay, the
   piers, rock, the ship, the volcano) stand flat with a step at their edge: a step taller than the walker climbs is the wall.
   Squares are (sx 0..168 west to east, sy 0..120 north to south); gx() / gz() = a square's west / north line in metres, mx() / mz() = its middle. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run');
const LAYOUT = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/areas/beach/layout.json'), 'utf8')), PLAN = LAYOUT.rooms[0];
const DIST = { 'The Shore': 'S', 'The Harbour': 'H', 'The Ocean (NEW)': 'O', 'The Bermuda Triangle': 'T' };
const C = 3.5, N = 12, GX = PLAN.cols, GZ = PLAN.rows, W = N * GX, H = N * GZ, PL = N * C, HW = W * C / 2, HD = H * C / 2, ROOM = 'site_prebuilt_bermuda_beach';
const r2 = v => Math.round(v * 100) / 100, gx = c => r2(-HW + c * C), gz = c => r2(-HD + c * C), mx = c => gx(c + 0.5), mz = c => gz(c + 0.5);
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
/* the old rooms' people keep their own lines: read from the old literals (so the old Harbour and Bermuda sea literals must stay in data.js) */
const OLDR = id => JSON.parse(vm.runInContext('JSON.stringify((r => r ? { n: r.npcSpots || [], l: r.lines || [] } : { n: [], l: [] })(DOOR_HQ.rooms.' + id + '))', D));
const O_SEA = OLDR('site_prebuilt_bermuda_sea'), O_HARB = OLDR('site_prebuilt_downtown_harbour');
const sayOf = (R, race) => (R.n.find(n => n.race === race) || {}).say;
const cell = PLAN.cells.map(r => r.split(''));
const plot = {}; PLAN.plots.forEach(p => { p.x = +p.id.slice(1, 3); p.y = +p.id.slice(4, 6); p.d = DIST[p.district]; if (!p.d) throw new Error('district? ' + p.district); plot[p.x + ':' + p.y] = p; });
const Pxy = (x, y) => plot[Math.max(0, Math.min(GX - 1, Math.floor(x / N))) + ':' + Math.max(0, Math.min(GZ - 1, Math.floor(y / N)))];
const F = [], props = [], doors = [], npc = [], ARCH = [], count = {}, taken = new Set(), errs = [];
const feat = o => { F.push(o); return o; };
let seed = 345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const setRect = (x0, y0, x1, y1, ch) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) cell[y][x] = ch; };

/* ── what the tool does to the plan's squares ──
   THE FLYING DUTCHMAN (mondo 11-15: "we literally have a dutchman ship from the dutchman pvp map. why not just use that exact ship??"): she IS
   that ship, at her own size. Her main deck room (`site_prebuilt_revenge_deck`, 34 x 14 squares) is read here: the squares she stands on ('X')
   are a flat block hidden inside her hull (it keeps the walker, the swimmer and the skiff out), and `terrain.moored` has the renderer draw her own
   hull, decks, masts, sails and rigging there (three-renderer.js _hqBuildMoored: the Dutchman map's own galleon builder). Bow east, her stern at
   the Long Pier's end. The plan's 7 x 6 block was only her berth's mark. */
const SHIP_ROOM = 'site_prebuilt_revenge_deck', SHIP_W = 34, SHIP_D = 14, SHIP = [35, 56, 35 + SHIP_W, 56 + SHIP_D];
setRect(39, 51, 46, 57, 'w'); setRect(SHIP[0], SHIP[1], SHIP[2], SHIP[3], 'X');
/* ALONGSIDE (mondo 11-15: "berth her along the side of the pier"): she lies south of the Long Pier, her port side to it (one square of water
   between: her hull's swell), and the pier runs on east past the plan's end to her forecastle, so you walk her whole waist before you board */
const PIER_END = 57; setRect(39, 53, PIER_END, 55, 'j');
const SHIP_AT = { x: gx((SHIP[0] + SHIP[2]) / 2), z: gz((SHIP[1] + SHIP[3]) / 2) };
const SHIP_H = JSON.parse(vm.runInContext(`(() => { const r = DOOR_HQ.rooms.${SHIP_ROOM}, i = hqTerrainInfo('${SHIP_ROOM}'), o = [];
    if (!r || !i || !(r.terrain.float && r.terrain.float.hull && r.terrain.float.hull.kind === 'galleon') || Math.round(r.shell.w / ${C}) !== ${SHIP_W} || Math.round(r.shell.d / ${C}) !== ${SHIP_D}) return 'null';
    for (let y = 0; y < ${SHIP_D}; y++) for (let x = 0; x < ${SHIP_W}; x++) o.push(Math.round((hqTerrainHeight(i, (x + 0.5 - ${SHIP_W} / 2) * ${C}, (y + 0.5 - ${SHIP_D} / 2) * ${C}) - r.terrain.sea.y) * 100) / 100);
    return JSON.stringify(o); })()`, D));
const SHIP_BLOCK = SHIP_H ? r2(Math.min.apply(null, SHIP_H) - 0.8) : 0;   // a flat block hidden inside her hull (her decks are drawn by the renderer): it keeps the walker, the swimmer and the skiff out
if (!SHIP_H || SHIP_BLOCK < 2) throw new Error('the Dutchman\'s main deck room is not the 34 x 14 galleon this tool berths');
/* ── THE DISTRICT FILES (2026-11-16, mondo: "every single zone needs to be like that. now. so we can work in parallel"; the city's pattern,
   bake-disaster-city.js): docs/areas/beach/districts/<LETTER>.js, one per district (S the Shore, H the Harbour, O the Ocean, T the Bermuda
   Triangle), so no district's content lands in this tool. A file may export any of: tailor(ctx) = here, before the heights (the plan's
   squares: each plan building 'B' it builds goes back to its ground); build(ctx) = its buildings; place(ctx) = its props, palms, people;
   dress(ctx) = the same, a second pass after every district's place; reach = [[sx, sy, name]] squares the walk check must reach. Each stage
   runs S, H, O, T (the layout's order). The tool keeps what is shared: the height map, the sea, the paint, the Dutchman's berth, the door,
   the links' places, the checks, the room's own rows. Rules for the threads: docs/notes/areas-complexes.md "THE BEACH, THE DISTRICT FILES".
   THE DICE: every (district, stage) throws from its own start (DICE = the stream as it stood there when the tool was one file, so the split
   moved nothing), so a district's new throws never move another district's things. ── */
const ORDER = Object.keys(LAYOUT.districts);
const DISTRICTS = (() => { const dir = path.join(REPO, 'docs/areas/beach/districts'); return !fs.existsSync(dir) ? [] : fs.readdirSync(dir).filter(f => /^[A-Z]\.js$/.test(f) && ORDER.includes(f[0])).sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0])).map(f => { const m = require(path.join(dir, f)); m._d = f[0]; return m; }); })();
const DICE = { place: { S: 345, H: 2218172307, O: 900049978, T: 3230394567 }, dress: { S: 388744000, H: 3707165646, O: 2468876930, T: 122951486 } };
const LIGHT = [65, 101];                                    // the Lighthouse Rock's two squares each way (the Triangle's west point; the tape lies there)
const ctx = { LAYOUT, PLAN, C, N, W, H, gx, gz, mx, mz, r2, rnd, cell, setRect, plot, Pxy, inb, count, errs, taken, props, npc, LIGHT };
const runStage = stage => DISTRICTS.forEach(m => { if (typeof m[stage] !== 'function') return; const s = (DICE[stage] || {})[m._d]; seed = s != null ? s : (m._d.charCodeAt(0) * 7919 + stage.length * 104729) >>> 0; if (process.env.BEACH_DICE) console.log('dice', stage, m._d, seed); m[stage](ctx); });
runStage('tailor');
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (cell[y][x] === 'B') throw new Error('a plan building nobody builds at ' + x + ',' + y); if (cell[y][x] === 'T') cell[y][x] = 't'; }   // t = sand under a palm grove
/* planks: over water they are a PIER ('J', a hard deck); on sand they are boards laid on the beach ('j', the Boardwalk) */
{ const seen = new Set(), key = (x, y) => x + ':' + y;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (cell[y][x] !== 'j' || seen.has(key(x, y))) continue;
      const comp = [], st = [[x, y]]; seen.add(key(x, y)); let wet = false;
      while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); for (const [dx, dy] of N8.slice(0, 4)) { const X = a + dx, Y = b + dy; if (!inb(X, Y)) continue; if (cell[Y][X] === 'w') wet = true; if (cell[Y][X] === 'j' && !seen.has(key(X, Y))) { seen.add(key(X, Y)); st.push([X, Y]); } } }
      if (wet) comp.forEach(q => { cell[q[1]][q[0]] = 'J'; }); } }

/* ── THE HEIGHTS ── */
const SOFT = 'dDtjwua', WET = 'wuaJX', BEACH = 'dDtj';
const isSoft = ch => SOFT.includes(ch);
function distTo(match) {   // every square's distance (in squares, corner steps count) to the nearest square that matches
    const d = new Int16Array(W * H).fill(999), q = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (match(cell[y][x], x, y)) { d[y * W + x] = 0; q.push(x, y); }
    for (let i = 0; i < q.length; i += 2) { const x = q[i], y = q[i + 1], v = d[y * W + x] + 1; for (const [dx, dy] of N8) { const X = x + dx, Y = y + dy; if (inb(X, Y) && d[Y * W + X] > v) { d[Y * W + X] = v; q.push(X, Y); } } }
    return d;
}
const dWet = distTo(ch => WET.includes(ch)), dBeach = distTo(ch => BEACH.includes(ch)), dNotDune = distTo(ch => ch !== 'D'), dNotCone = distTo(ch => ch !== 'h' && ch !== 'l'), dLava = distTo(ch => ch === 'l');
const SEA_BED = -3.5, PIER = 0.6, QUAY = 0.9, CAP = [0.6, 1.2, 2.0, 2.0, 2.0];
const hc = new Float32Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x], k = y * W + x, p = Pxy(x, y); let h;
    if (ch === 'w') h = dBeach[k] > 900 ? SEA_BED : Math.max(SEA_BED, -(0.45 + 0.7 * (dBeach[k] - 1)));
    else if (ch === 'u') h = -0.8;                                                                              // the reef: waded
    else if (ch === 'a') h = -9;                                                                                // the drop under the Maelstrom
    else if (ch === 'D') h = Math.min(0.3 + 0.6 * (dWet[k] - 1), 1.2 + 0.45 * (dNotDune[k] - 1) + 0.35 * Math.sin(x * 0.9) * Math.cos(y * 0.7), 3.6);
    else if (BEACH.includes(ch)) h = Math.min(CAP[p.level] || 0.6, 0.3 + 0.3 * (dWet[k] - 1));
    else if (ch === 'J') h = PIER;
    else if (ch === 'o') h = QUAY;
    else if (ch === 'X') h = SHIP_BLOCK;                                                                         // the block inside her hull, under her lowest deck
    else if (ch === 'r') h = p.d === 'T' ? 3.4 : p.d === 'H' ? 1.6 : 2.4 + 0.5 * Math.sin(x * 1.3 + y * 0.8);  // the Lighthouse Rock, the Breakwater, the headlands
    else if (ch === 'h') h = 2.5 + 4.2 * (dNotCone[k] - 1) + 0.6 * Math.sin(x * 1.7) * Math.cos(y * 1.1);        // the cone: too steep to climb
    else if (ch === 'l') h = 2.5 + 4.2 * 3.2;                                                                   // the crater's lava, under the rim
    else throw new Error('a square nobody knows: ' + ch + ' at ' + x + ',' + y);
    hc[k] = h; }
/* a building's sand is level (its own squares and one round them) */
const flat = (x0, y0, x1, y1) => { const p = Pxy((x0 + x1) / 2, (y0 + y1) / 2), ref = CAP[p.level] || 0.6;
    for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) if (inb(x, y) && BEACH.includes(cell[y][x])) { const own = x >= x0 && x < x1 && y >= y0 && y < y1; if (own && dWet[y * W + x] < 2) errs.push('a building stands in the wash at ' + x + ',' + y); if (own || dWet[y * W + x] >= 3) hc[y * W + x] = ref; } return ref; };
/* corners: a soft square (sand, sea floor) shares its corners with the soft squares round it (one surface); a hard square keeps its own
   height at all four (flat), and the cone and the rock share theirs with their own kind (a crag, not a staircase) */
const group = ch => isSoft(ch) ? 's' : (ch === 'h' || ch === 'l') ? 'h' : ch === 'r' ? 'r' : null;
const slope = Buffer.alloc(W * H * 8);
function corner(cx, cy, g) { let s = 0, n = 0; for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const X = cx + dx, Y = cy + dy; if (inb(X, Y) && group(cell[Y][X]) === g) { s += hc[Y * W + X]; n++; } } return s / n; }
const cornerH = (x, y, qx, qy) => { const g = group(cell[y][x]); return g ? corner(x + qx, y + qy, g) : hc[y * W + x]; };
function writeSlope() { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 8; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => slope.writeInt16LE(Math.round(cornerH(x, y, q[0], q[1]) * 100), o + k * 2)); } }

/* ── THE BUILDINGS (the Estate's helper): a hollow `texbuilding` (the walls you bump, the doorway, the swinging leaf, the inside) with its own
   outside switched off + its look as an `arch` parts list. Parts frame: the building's middle, x along the front, +z out of the front, y up. ── */
const U = n => 'urban:' + n, WD = U('WoodGeneric1b'), WD2 = U('WoodGeneric1a'), SHG = U('WoodGeneric2a'), FLR = U('WoodFlooring1d'), GLS = U('GlassWindowTall1a'), COR = U('MetalCorrugated1a'), BRK = U('BrickMasonry1a'), SHUT = U('GlassWindowResidentialShutter1');
const PAINT = 2.3, CORR = U('MetalCorrugatedPainted1a');   // THE PAINT (Bayside's way): a painted wall takes `gain` PAINT, a roof is the painted corrugated sheet
const ROT = { S: 0, W: 90, N: 180, E: 270 };
function sheet() {
    const P = [];
    const add = (o, key, tint, x) => { if (key) o.key = key; if (tint != null) o.tint = tint; if (x) Object.assign(o, x); if (/GlassWindow/.test(key || '') && o.glow == null) o.glow = 0.3; P.push(o); return o; };
    const A = { P,
        box: (x, y, z, w, h, d, key, tint, o) => add({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)] }, key, tint, o),
        cyl: (x, y, z, r, h, key, tint, o) => add({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h }, key, tint, o),
        roof: (form, x, y, z, w, h, d, key, tint, o) => { add({ s: 'box', p: [x, y, z], size: [w, 0.02, d], sides: false, top: false, under: true, roof: true, ry: (o && o.ry) || 0 }, WD2, 0x4a3626);
            return add({ s: 'roof', form, p: [x, y, z], size: [w, h, d], roof: true }, key, tint, o); },
        shell(w, h, d, key, tint, door, uv, gain) { const e = 0.05, Wd = w + 2 * e, Dp = d + 2 * e, x = uv ? (gain ? { uv, gain } : { uv }) : null;
            add({ s: 'box', p: [0, 0, 0], size: [Wd, h, Dp], top: false, faces: 'blr' }, key, tint, x);
            add({ s: 'quad', p: [0, 0, r2(Dp / 2)], size: [Wd, h], ry: 0, hole: [r2(door.lx), r2(door.cw), 2.2] }, key, tint, x); },
        frame(door, d, key, tint) { A.box(door.lx - door.cw / 2 - 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx + door.cw / 2 + 0.1, 0, d / 2 + 0.1, 0.2, 2.4, 0.2, key, tint); A.box(door.lx, 2.25, d / 2 + 0.1, door.cw + 0.5, 0.2, 0.2, key, tint); },
        sign(words, x, y, z, w, h, fg, bg, font, o) { P.push(Object.assign({ s: 'quad', p: [r2(x), r2(y), r2(z)], size: [w, h], key: 'txt:' + words + '|' + fg + '|' + bg + '|' + r2(w / h) + '||' + font, uv: 'fit', kind: 'wall' }, o || {})); } };
    return A;
}
function texbDoor(w, door) { const L = Math.max(2, w) - 0.12, cols = Math.max(1, Math.round(L / 1.75)), cw = L / cols; let col = Math.floor((cols - 1) / 2); if (door >= 1) col = Math.min(cols - 1, Math.round(door) - 1); return { lx: -L / 2 + (col + 0.5) * cw, cw }; }
function building(id, q, h, o, parts) {
    const [sx0, sy0, sx1, sy1, side] = q, ew = side === 'E' || side === 'W', fw = (ew ? sy1 - sy0 : sx1 - sx0) * C, fd = (ew ? sx1 - sx0 : sy1 - sy0) * C, cx = gx((sx0 + sx1) / 2), cz = gz((sy0 + sy1) / 2), rot = ROT[side];
    const row = Object.assign({ k: 'texbuilding', id: 'bch:' + id, seed: 1, x: cx, z: cz, w: fw, d: fd, rot, storeys: 1, h, skin: false, hollow: true, leaf: 'leaf_shabby_wood', leafDouble: false, keyIn: WD2, floorIn: FLR }, o || {});
    Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k]; });
    feat(row); if (BEACH.includes(cell[sy0][sx0])) flat(sx0, sy0, sx1, sy1);
    for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) taken.add(x + ':' + y);
    const a = sheet(), door = texbDoor(fw, row.door); parts(a, fw, fd, door);
    ARCH.push({ k: 'arch', id: 'bch:' + id + ':look', x: cx, z: cz, rot, parts: a.P });
    const t = rot * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    count.buildings = (count.buildings || 0) + 1;
    return { at: (lx, lz) => [r2(cx + lx * c - lz * s), r2(cz + lx * s + lz * c)], face: f => (f + rot) % 360, fw, fd, door, cx, cz, rot };
}
const put = (B, key, lx, lz, o) => { const p = B.at(lx, lz), r = Object.assign({ key, x: p[0], z: p[1] }, o || {}); if (r.face != null) r.face = B.face(r.face); props.push(r); };   // `face` in the building's frame
function look(id, x, z, rot, fn) { const a = sheet(); fn(a); ARCH.push({ k: 'arch', id: 'bch:' + id + ':look', x: r2(x), z: r2(z), rot: rot || 0, parts: a.P }); }

/* ── placing things: a blocker on a square's middle (P), decor off it (dec), people (native); never two on one square ── */
const DRY_LAND = 'dDtjoJXr';
function spot(sx, sy, what, where, shared) { if (!inb(sx, sy)) { errs.push(what + ' is off the map'); return; } const ch = cell[sy][sx];
    if (where === 'land' && !'dDtjoJ'.includes(ch)) errs.push(what + ' is not on dry ground at ' + sx + ',' + sy + ' (' + ch + ')');
    if (where === 'sea' && !'wua'.includes(ch)) errs.push(what + ' is not in the water at ' + sx + ',' + sy + ' (' + ch + ')');
    if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
const P = (key, sx, sy, o) => { spot(sx, sy, key, 'land'); props.push(Object.assign({ key, x: mx(sx), z: mz(sy) }, o || {})); };
const dec = (key, sx, sy, o) => { spot(sx, sy, key, 'land', true); props.push(Object.assign({ key, x: r2(mx(sx) + (rnd() - 0.5) * 1.6), z: r2(mz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); };
const afloat = (key, sx, sy, o) => { spot(sx, sy, key, 'sea', true); props.push(Object.assign({ key, x: mx(sx), z: mz(sy), y: 0.32 }, o || {})); };          // rides the surface (a `float` prop)
const swimmer = (key, sx, sy, o) => { spot(sx, sy, key, 'sea', true); props.push(Object.assign({ key, x: mx(sx), z: mz(sy), y: -0.7, hover: 0.4 }, o || {})); };   // its back through the surface (the ocean pack's way)
const palm = (sx, sy, h) => { spot(sx, sy, 'palm', 'land'); if (!'dDt'.includes(cell[sy][sx])) errs.push('a palm off the sand at ' + sx + ',' + sy); feat({ k: 'tree', x: r2(mx(sx) + (rnd() - 0.5)), z: r2(mz(sy) + (rnd() - 0.5)), kind: 'palm', h: h || r2(3.6 + rnd() * 1.4), r: 0.6 }); count.palms = (count.palms || 0) + 1; };
const native = (race, sx, sy, face, say) => { spot(sx, sy, race, null); const n = { x: mx(sx), z: mz(sy), face: face || 0, race }; if (say) n.say = say; npc.push(n); };

/* ── THE WAYS ── */
const OY = 36;   // the Shore and the Harbour keep plan 2's squares, three plots further south
doors.push({ id: 'quay', wall: 'w', z: gz(OY + 5.5), leaf: null, label: 'DISASTER CITY · BAYSIDE', sub: 'THE BOARDWALK · BACK INTO THE CITY', action: { room: 'site_prebuilt_downtown_streets', at: 'harbour' },
    desc: 'The boards run back to the sea wall and the sea wall runs back to the city.' });   // the city's door `harbour` (and the old streets') leads to door `quay`: the old Harbour's id, kept
const GANG = { x: gx(52), z: gz(55), face: 0 };                                                  // the gangway on the pier's south edge, at her waist (link `beach_dutchman`)
const MAEL = { x: gx(150), z: gz(42), face: 180 };                                           // the Maelstrom's mouth (link `bermuda_abyss`)
const POOL = { x: mx(134), z: mz(97), face: 0 };                                             // the tide pool by the Lagoon: Room 8's weir (link `weir_bermuda`)
const BAY = { x: mx(146), z: mz(102), face: 0 };                                             // Room 345's cabin door on the Island Beach (siteRooms.entry.prebuilt_bermuda)
[[134, 97], [134, 96], [146, 102], [146, 101], [51, 53], [52, 53], [51, 54], [52, 54]].forEach(q => taken.add(q[0] + ':' + q[1]));
const SP = [3, OY + 5];
/* ── THE DRESSING (mondo 11-15: "see what other aquatic or oceanic or beach related models you can add to dress the area"): only models the game
   already has (the catalogue; nothing generated). `under` = a thing that stands on the sea floor or hangs in the water at its own depth. ── */
const under = (key, sx, sy, y, o) => { spot(sx, sy, key, 'sea', true); props.push(Object.assign({ key, x: r2(mx(sx) + (rnd() - 0.5) * 2), z: r2(mz(sy) + (rnd() - 0.5) * 2), y, hover: 0, face: Math.round(rnd() * 360) }, o || {})); };
Object.assign(ctx, { OY, flat, spot, feat, building, put, look, sheet, P, dec, afloat, swimmer, under, palm, native, sayOf, O_SEA, O_HARB, U, WD, WD2, SHG, FLR, GLS, COR, BRK, SHUT, CORR, PAINT, MAEL, POOL, BAY, GANG, SP, SHIP, PIER_END, LIGHT });
runStage('build');   // the huts and the lifeguard hut (S), the Quay shed (H), the tribe's shelters (O)
runStage('place');   // each district's own things
runStage('dress');   // THE DRESSING, district by district
/* ── finish the heights (the buildings' flats are in) and check ── */
writeSlope();
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));
/* ── THE PAINT: one sheet a square (0 = the room's own sand) ── */
const PAL = ['wood_planks', 'cobblestone', 'rocks_5', 'obsidian', 'lava', 'urban:WoodFlooring1a'], paint = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x]; paint[y * W + x] = (ch === 'j' || ch === 'J') ? 1 : ch === 'o' ? 2 : ch === 'r' ? 3 : ch === 'h' ? 4 : ch === 'l' ? 5 : ch === 'X' ? 1 : 0; }

/* ── checks: every prop key and unit exists; the game's own compile gives the heights back; the walker reaches every dry plot of the mainland
   from the city door, and every island has a shore the skiff reaches ── */
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D), TREES = vm.runInContext('HQ_TREE_KINDS', D);
props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); });
{ const OLD = O_SEA.n.concat(O_HARB.n).map(n => n.race);   // a race the old rooms already stood here (the Harbour's homosapien) is fine
  npc.forEach(n => { if (RACES.indexOf(n.race) < 0 && OLD.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); }); }
if (!TREES.palm) throw new Error('no palm tree kind');
{ const cH = (x, y) => hc[y * W + x], walk = (x, y) => inb(x, y) && cH(x, y) > -1.15, seen = new Uint8Array(W * H), st = [SP]; seen[SP[1] * W + SP[0]] = 1;
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of N8.slice(0, 4)) { const X = x + dx, Y = y + dy; if (!walk(X, Y) || seen[Y * W + X]) continue;
      const hardStep = !(isSoft(cell[y][x]) && isSoft(cell[Y][X])); if (hardStep ? Math.abs(cH(X, Y) - cH(x, y)) > 0.62 : Math.abs(cH(X, Y) - cH(x, y)) / C > 1.0) continue; seen[Y * W + X] = 1; st.push([X, Y]); } }
  const need = [[3, OY + 5, 'the Boardwalk'], [3, 51 + 2, 'the Beach Huts'], [17, 67, 'the Lifeguard Hut'], [28, OY + 6, 'the Quay'], [36, 53, 'the Long Pier'], [PIER_END - 2, 53, 'the pier alongside the Dutchman'], [29, 62, 'the skiff jetty'], [6, OY + 44, 'the Dunes'], [4, 30, 'the North Headland sand']];
  DISTRICTS.forEach(m => (m.reach || []).forEach(q => need.push(q)));   // a district file's own squares to reach
  need.forEach(q => { if (!seen[q[1] * W + q[0]]) throw new Error('not reached on foot from the city door: ' + q[2]); });
  for (let y = SHIP[1]; y < SHIP[3]; y++) for (let x = SHIP[0]; x < SHIP[2]; x++) if (seen[y * W + x]) throw new Error('the Dutchman is climbed from the pier');
  let dry = 0, wade = 0, swim = 0; for (let k = 0; k < W * H; k++) { if (hc[k] >= 0) dry++; else if (hc[k] > -1.15) wade++; else swim++; }
  Object.assign(count, { drySquares: dry, wadedSquares: wade, swumSquares: swim, walkedFromTheDoor: seen.reduce((a, b) => a + b, 0) });
  if (process.env.BEACH_DUMP) console.log(cell.map((r, y) => r.map((ch, x) => seen[y * W + x] ? '.' : hc[y * W + x] < -1.15 ? ' ' : ch).join('')).join('\n')); }
Object.assign(count, { features: F.length + ARCH.length, props: props.length, doors: doors.length, natives: npc.length });

/* ── the room ── */
const SPM = { x: mx(SP[0]), z: mz(SP[1]) }, LINES = O_HARB.l.concat(O_SEA.l), L = [];
L.push("        /* BEACH140-BEGIN — THE BEACH ON PLOTS (2026-11-15): written by `node bake-beach.js` from docs/areas/beach/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
L.push("        " + ROOM + ": {");
L.push("            label: 'THE BEACH',");
L.push("            sub: 'THE SHORE · THE HARBOUR · THE OCEAN · THE BERMUDA TRIANGLE',");
L.push("            kind: 'box', site: 'prebuilt_bermuda', part: 'beach',");
L.push("            shell: hqSeaShell({ w: " + (2 * HW) + ", d: " + (2 * HD) + ", plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: 4.4 } }),");
L.push("            parti: 'Four districts on 140 plots, most of them water: a shore of sand off the city, a harbour with the Dutchman at the pier head, an ocean you sail, and a right triangle of sea with a lighthouse, an island and a hole at its corners.',");
L.push("            typology: 'grid',");
L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + GX + ", nz: " + GZ + ", triangle: " + J(LAYOUT.triangle.map(q => [gx(q[0]), gz(q[1])])) + ", names: " + J(PLAN.plots.filter(p => p.name).map(p => [p.id, p.name, p.d, p.level])) + " },");
L.push("            terrain: {");
L.push("                res: 1.75, floor: 'desert', cliff: 'rocks_5', path: 'wood_planks',   // half a square a node (the Desert's and the Mountains' grain)");
L.push("                base: 0, noise: { amp: 0.06, scale: 9 }, crag: false,");
L.push("                sea: { y: 0, key: 'water' },");
L.push("                outer: { m: 60 },");
L.push("                /* THE FLYING DUTCHMAN: the Dutchman map's own ship, drawn at her berth (three-renderer.js _hqBuildMoored) */");
L.push("                moored: [" + J({ kind: 'galleon', room: SHIP_ROOM, x: SHIP_AT.x, z: SHIP_AT.z }) + "],");
L.push("                /* THE HEIGHTS ARE THE MAP: sand, sea floor, the quay, the piers, rock, the ship's deck and the volcano are all this grid */");
L.push("                slope: { cells: { res: " + C + ", x0: " + gx(0) + ", z0: " + gz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + slope.toString('base64') + "' } },");
L.push("                paint: { pal: " + J(PAL) + ", t: 'u8', res: " + C + ", x0: " + mx(0) + ", z0: " + mz(0) + ", nx: " + W + ", nz: " + H + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push("                features: [");
F.concat(ARCH).forEach(f => L.push("                    " + J(f) + ","));
L.push("                ],");
L.push("            },");
L.push("            doors: [");
doors.forEach(d => L.push("                " + J(d) + ","));
L.push("            ],");
L.push("            counters: [],");
L.push("            props: [");
for (let i = 0; i < props.length; i += 4) L.push("                " + props.slice(i, i + 4).map(J).join(", ") + ",");
L.push("            ],");
L.push("            agents: [],");
L.push("            npcSpots: " + J(npc) + ",");
L.push("            onlineSpots: [],");
L.push("            lines: " + J(LINES) + ",");
L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: 90 },");
L.push("        },");
L.push("        /* BEACH140-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the rows in data.js that name a place in this room (written by hand there): the tool refuses to bake when one has drifted */
const at = o => "site: 'prebuilt_bermuda', part: 'beach', wall: 'free', x: " + o.x + ", z: " + o.z + ", face: " + o.face + ",";
const WANT = [
    ["prebuilt_bermuda: { room: '" + ROOM + "', door: { id: 'bay', wall: 'free', x: " + BAY.x + ", z: " + BAY.z + ", face: " + BAY.face + " } }", 'siteRooms.entry.prebuilt_bermuda'],
    ["a: { " + at(MAEL) + " way: 'whirlpool',", 'link bermuda_abyss'],
    ["b: { " + at(POOL), 'link weir_bermuda'],
    ["a: { " + at(GANG), 'link beach_dutchman'],
    [ROOM + ": { tape: { x: " + gx(LIGHT[0] + 1) + ", z: " + r2(gz(LIGHT[1] + 1) + 1.2) + " } }", 'the tape on the Lighthouse Rock'],
];
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const flatSrc = src.replace(/ +/g, ' '), missing = WANT.filter(w => flatSrc.indexOf(w[0]) < 0);
if (missing.length) { console.log('data.js rows to write by hand:'); missing.forEach(w => console.log('  ' + w[1] + ':  ' + w[0])); if (!DRY) throw new Error('data.js does not point at this room yet (see the rows above)'); }
if (process.env.BEACH_OUT) fs.writeFileSync(process.env.BEACH_OUT, block);
if (DRY) process.exit(0);
const END = '        /* BEACH140-END */\n', b0 = src.indexOf('        /* BEACH140-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const anchor = '        site_prebuilt_bermuda_sea: {'; const a = src.lastIndexOf('        /*', src.indexOf(anchor)); if (src.indexOf(anchor) < 0 || a < 0) throw new Error('anchor not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ROOM + ' written (' + block.length + ' bytes)');
