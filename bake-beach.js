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
const SOFT = 'dDtjwuabc', WET = 'wuaJX', BEACH = 'dDtjbc';   // b, c (2026-11-16, the Ocean's thread; a board note): dark volcanic grit / scorched ground, sand in every other way (only the paint differs)
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
/* a building's sand is level (its own squares and one round them); FLATS keeps each one for THE ONE WORLD MOVE's rooms */
const FLATS = [];
const flat = (x0, y0, x1, y1) => { FLATS.push([x0, y0, x1, y1]); const p = Pxy((x0 + x1) / 2, (y0 + y1) / 2), ref = CAP[p.level] || 0.6;
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
const DRY_LAND = 'dDtjoJXrbc';
function spot(sx, sy, what, where, shared) { if (!inb(sx, sy)) { errs.push(what + ' is off the map'); return; } const ch = cell[sy][sx];
    if (where === 'land' && !'dDtjoJbc'.includes(ch)) errs.push(what + ' is not on dry ground at ' + sx + ',' + sy + ' (' + ch + ')');
    if (where === 'sea' && !'wua'.includes(ch)) errs.push(what + ' is not in the water at ' + sx + ',' + sy + ' (' + ch + ')');
    if (!shared) { if (taken.has(sx + ':' + sy)) errs.push(what + ': square ' + sx + ',' + sy + ' is taken'); taken.add(sx + ':' + sy); } }
const P = (key, sx, sy, o) => { spot(sx, sy, key, 'land'); props.push(Object.assign({ key, x: mx(sx), z: mz(sy) }, o || {})); };
const dec = (key, sx, sy, o) => { spot(sx, sy, key, 'land', true); props.push(Object.assign({ key, x: r2(mx(sx) + (rnd() - 0.5) * 1.6), z: r2(mz(sy) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360) }, o || {})); };
const afloat = (key, sx, sy, o) => { spot(sx, sy, key, 'sea', true); props.push(Object.assign({ key, x: mx(sx), z: mz(sy), y: 0.32 }, o || {})); };          // rides the surface (a `float` prop)
const swimmer = (key, sx, sy, o) => { spot(sx, sy, key, 'sea', true); props.push(Object.assign({ key, x: mx(sx), z: mz(sy), y: -0.7, hover: 0.4 }, o || {})); };   // its back through the surface (the ocean pack's way)
const palm = (sx, sy, h) => { spot(sx, sy, 'palm', 'land'); if (!'dDtbc'.includes(cell[sy][sx])) errs.push('a palm off the sand at ' + sx + ',' + sy); feat({ k: 'tree', x: r2(mx(sx) + (rnd() - 0.5)), z: r2(mz(sy) + (rnd() - 0.5)), kind: 'palm', h: h || r2(3.6 + rnd() * 1.4), r: 0.6 }); count.palms = (count.palms || 0) + 1; };
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
/* ── THE CITY'S SIDE (2026-11-16, the tool row's holder; mondo's "yes" to fixing the west edge: past it the room showed open sea where Disaster
   City stands). DRAWN ONLY, past the room's west line (the walker never gets there): the city's SEA WALL with its white rail, open at the city
   door, and BAYSIDE's front behind it on the edge land (`terrain.edges.w`): eleven pastel blocks in Bayside's own way (districts/B.js: painted
   plaster at gain 2.3, the pack's dark glass lit a little, white fins and slabs), the district's name in its own neon face on the tallest. One
   arch row (about ten meshes). Its foot is typed 3 m under level 0 so no block floats wherever the land stands. ── */
{ const PL1 = U('PlasterWallPainted1a'), GSQ = U('GlassWindowSquare1a'), CONC = U('ConcreteStriped2c'), WHITE = 0xffffff, GLASS = 0xb4e4ff;
  const X0 = gx(0), Z0 = gz(14), Z1 = gz(106), ZD = gz(OY + 5.5), a = sheet(), B = (x, y, z, w, h, d, key, tint, o) => a.box(x, y, z, w, h, d, key, tint, o);
  /* the row's frame: rot 270 = its +z looks EAST (to the beach), its +x runs NORTH; a spot's world z is -x here */
  const along = wz => -(wz - (Z0 + Z1) / 2), LEN = Z1 - Z0, xd = along(ZD);
  for (const sg of [-1, 1]) { const x0 = sg < 0 ? -LEN / 2 : xd + 4.2, x1 = sg < 0 ? xd - 4.2 : LEN / 2;           // the sea wall, open 8.4 m at the city door
      B((x0 + x1) / 2, -3, 0, x1 - x0, 5.6, 1.4, CONC, 0xfff6e2, { uv: [3.5, 3.5], gain: 1.8 }); B((x0 + x1) / 2, 2.6, 0.45, x1 - x0, 0.12, 0.5, null, WHITE);
      for (const y of [3.1, 3.55]) B((x0 + x1) / 2, y, 0.55, x1 - x0, 0.06, 0.06, null, WHITE);
      a.P.push({ s: 'box', p: [r2(x0 + 0.6), 2.6, 0.55], size: [0.08, 1.0, 0.08], tint: WHITE, n: Math.max(2, Math.floor((x1 - x0) / 3.5)), step: [3.5, 0, 0] }); }
  const BLD = [[0xffa590, 22, 18, 5], [0xa8ecd6, 28, 30, 8], [0xffe27a, 20, 14, 4], [0x7fdcec, 30, 40, 11], [0xffb4d0, 24, 22, 6], [0xf8dfae, 26, 16, 4], [0xd2bcf6, 22, 34, 9], [0xa8ecd6, 30, 20, 5], [0xffa590, 24, 28, 8], [0x7fdcec, 22, 16, 4], [0xffe27a, 28, 24, 7]];   // [paint, width, height, storeys]
  const total = BLD.reduce((n, b) => n + b[1], 0), gap = (LEN - total) / (BLD.length - 1); let u = -LEN / 2;
  BLD.forEach((b, i) => { const [tint, w, h, st] = b, cx = u + w / 2, zc = -26 - (i % 3) * 5, d = 16; u += w + gap;
      B(cx, -3, zc, w, h + 3, d, PL1, tint, { gain: 2.9, uv: [3.5, 3.5] });   // (2.9: the room's faded look greys a pastel at Bayside's own 2.3, seen)
      for (const sx of (w > 24 ? [-1, 0, 1] : [-1, 1])) a.P.push({ s: 'quad', p: [r2(cx + sx * w * (w > 24 ? 0.3 : 0.22)), 4.6, r2(zc + d / 2 + 0.06)], size: [r2(w * (w > 24 ? 0.2 : 0.3)), r2(h - 6.4)], key: GSQ, tint: GLASS, glow: 0.3, gain: 2.2, kind: 'wall' });   // glass in bays between painted piers, over a painted ground floor (never a whole glass front)
      B(cx, 0, zc + d / 2 + 1.2, w * 0.5, 3.6, 2.4, null, WHITE, { top: true }); a.P.push({ s: 'quad', p: [r2(cx), 0.6, r2(zc + d / 2 + 2.42)], size: [r2(w * 0.4), 2.4], key: GSQ, tint: GLASS, glow: 0.4, gain: 2.2, kind: 'wall' });   // the white entrance porch, its lit doors
      for (let k = 1; k < st; k++) B(cx, 1.2 + k * (h - 3.2) / st - 0.18, zc + d / 2 + 0.4, w - 1.6, 0.22, 0.9, null, WHITE);                  // the white balcony slabs
      B(cx, h - 0.3, zc, w + 0.8, 0.5, d + 0.8, null, WHITE); for (const sx of [-1, 1]) B(cx + sx * (w / 2 - 0.5), 0, zc + d / 2 + 0.3, 0.7, h + 1.6, 0.6, null, WHITE);   // the cornice, the fins
      if (i === 3) { B(cx, h + 0.2, zc + d / 2 - 1.3, 18.6, 4.2, 0.3, null, 0x24344e); a.sign('BAYSIDE', cx, h + 0.6, zc + d / 2 - 1.1, 17.6, 3.4, '#ff7a9a', '#24344e', 'monoton', { glow: 0.9 }); } });
  ARCH.push({ k: 'arch', id: 'bch:bayside:look', x: r2(X0 - 1.2), z: r2((Z0 + Z1) / 2), y: 0, rot: 270, parts: a.P }); }
runStage('place');   // each district's own things
runStage('dress');   // THE DRESSING, district by district
/* THE AIR BY DISTRICT (2026-11-16, the Triangle thread, the tool row taken for this one change; bake-camelot.js's way): a district file's
   optional `airZones(ctx)` = [{ x0, y0, x1, y1 (squares), kind, color?, n?, speed?, wind? }] becomes `shell.atmos.zones` (three-renderer.js
   _hqBuildAtmos: dust, motes, spores, fireflies, embers, snow, ash, rain; each zone its own particles, born inside its box). With no such
   export the shell is written as before, byte for byte (the sea site's own air is `none`). */
const AIR = [].concat(...DISTRICTS.filter(m => typeof m.airZones === 'function').map(m => m.airZones(ctx).map(z => { const q = Object.assign({}, z, { x0: gx(z.x0), z0: gz(z.y0), x1: gx(z.x1), z1: gz(z.y1) }); delete q.y0; delete q.y1; return q; })));
/* ── finish the heights (the buildings' flats are in) and check ── */
writeSlope();
if (errs.length) throw new Error('misplaced:\n  ' + errs.join('\n  '));
/* ── THE PAINT: one sheet a square (0 = the room's own sand) ── */
const PAL = ['wood_planks', 'cobblestone', 'rocks_5', 'obsidian', 'lava', 'urban:WoodFlooring1a', 'dirt_2', 'scorched'], paint = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = cell[y][x]; paint[y * W + x] = (ch === 'j' || ch === 'J') ? 1 : ch === 'o' ? 2 : ch === 'r' ? 3 : ch === 'h' ? 4 : ch === 'l' ? 5 : ch === 'X' ? 1 : ch === 'b' ? 7 : ch === 'c' ? 8 : 0; }

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

/* ── THE ONE WORLD MOVE (2026-11-17, One World phase 4.3, docs/plans/one-world/BUILD_PLAN.md row 4.3; mondo's map v3 + v5: "the Bermuda Triangle
   must be remote, not the first sail from the city beach", the Beach shrinks to 8 x 10, the Volcano Island far out north-east, grown to 6 x 6
   with a jungle and a dinosaur park). Everything above is the home bake as it was (the districts' files run on the 14 x 10 home squares, so not
   one of their throws moves). Here the home plots are handed out to THREE ROOMS at their world places, each a rigid move of whole plots:
     · THE BEACH (the old id): the home columns 0..7 (the Shore, the Harbour, the near Ocean) at world 12,2, without the Triangle's four plots
       there (the Lighthouse Rock and its three neighbours);
     · THE BERMUDA TRIANGLE `site_prebuilt_bermuda_ow_triangle`: the home box 5..13 x 3..9 (the Triangle's 25 plots and the open sea round
       them) at world 32,0, far east by the Ice Wall: 9 x 7 plots, so the 3-4-5 triangle keeps its shape and the Island Beach its sea (the
       map's 6 x 6 would cut both);
     · THE VOLCANO ISLAND `site_prebuilt_bermuda_ow_volcano`: the home box 8..13 x 0..2 (the Volcano, the Island, the Landing, the Village, the
       waterspout, the islet, the seal rock) at world 22,-19, a 6 x 6 box: the three rows south of it are new plots (THE GROWN ISLAND below).
   A square of a room's box that no moved plot fills is open sea. Every row is moved with its plot (by the square its point stands on); a
   prop on a plot no room takes, or in the water the Coast Road's spit fills, is set down again in its room's nearest open sea (printed). The heights, slopes and paint
   are worked out again per room by the same rules (the sea floor falls from each room's own sand), and every building's flat is laid again.
   The Round Voyage's boats join them (data.js DOOR_HQ.links, way `boat`). Notes: areas-complexes.md "ONE WORLD, THE COAST + THE ISLANDS". ── */
const NEWP = { level: 2, d: 'O', name: null };
const OW_ROOMS = [
    { id: ROOM, part: 'beach', label: 'THE BEACH', sub: 'THE SHORE · THE HARBOUR · THE OCEAN', wx: 12, wy: 2, cols: 8, rows: 10, dx: 0, dy: 0, has: p => p.x < 8 && p.d !== 'T',
      parti: 'The near coast on 80 plots, most of them water: a shore of sand off the city, a harbour with the Dutchman at the pier head, the ocean you sail, and a spit of sand south to the Coast Road.' },
    { id: 'site_prebuilt_bermuda_ow_triangle', part: 'ow_triangle', label: 'THE BERMUDA TRIANGLE', sub: 'THE LIGHTHOUSE ROCK · THE CAY · THE MAELSTROM', wx: 32, wy: 0, cols: 9, rows: 7, dx: 5, dy: 3, has: p => p.x >= 5 && p.y >= 3 && (p.x >= 8 || p.d === 'T'),
      parti: 'A right triangle of sea far out by the Ice Wall: a lighthouse, an island and a hole at its corners. You only come here on purpose.' },
    { id: 'site_prebuilt_bermuda_ow_volcano', part: 'ow_volcano', label: 'THE VOLCANO ISLAND', sub: 'THE VOLCANO · THE VILLAGE · THE JUNGLE · THE DINOSAUR PARK', wx: 22, wy: -19, cols: 6, rows: 6, dx: 8, dy: 0, has: p => p.x >= 8 && p.y <= 2,
      parti: 'A remote island far out north-east: a volcano with a village under it, and south of them a jungle with a fenced dinosaur park.' },
];
const roomOf = {}; PLAN.plots.forEach(p => { const rs = OW_ROOMS.filter(R => R.has(p)); if (rs.length > 1) throw new Error('two rooms take plot ' + p.id); roomOf[p.x + ':' + p.y] = rs[0] || null; });
const homeSq = (x, z) => [Math.max(0, Math.min(W - 1, Math.floor((x + HW) / C))), Math.max(0, Math.min(H - 1, Math.floor((z + HD) / C)))];
const roomAt = (x, z) => { const q = homeSq(x, z); return roomOf[Math.floor(q[0] / N) + ':' + Math.floor(q[1] / N)]; };
const ptOf = o => (typeof o.x === 'number' && typeof o.z === 'number') ? [o.x, o.z] : typeof o.x0 === 'number' ? [(o.x0 + o.x1) / 2, (o.z0 + o.z1) / 2] : Array.isArray(o.pts) ? o.pts[0] : null;
OW_ROOMS.forEach(R => { R.W = R.cols * N; R.H = R.rows * N; R.HW = R.W * C / 2; R.HD = R.H * C / 2; R.ox = r2(HW - R.HW - R.dx * PL); R.oz = r2(HD - R.HD - R.dy * PL);
    R.gx = c => r2(-R.HW + c * C); R.gz = c => r2(-R.HD + c * C); R.mx = c => R.gx(c + 0.5); R.mz = c => R.gz(c + 0.5);
    R.F = []; R.ARCH = []; R.props = []; R.npc = []; R.doors = []; R.AIR = []; R.moored = []; R.FL = []; R.names = []; R.count = {};
    R.mine = (hx, hy) => { const p = plot[Math.floor(hx / N) + ':' + Math.floor(hy / N)]; return hx >= 0 && hy >= 0 && hx < W && hy < H && p && roomOf[p.x + ':' + p.y] === R ? p : null; };
    R.plotAt = (x, y) => R.mine(x + R.dx * N, y + R.dy * N) || NEWP;
    R.cell = []; for (let y = 0; y < R.H; y++) { const row = []; for (let x = 0; x < R.W; x++) row.push(R.mine(x + R.dx * N, y + R.dy * N) ? cell[y + R.dy * N][x + R.dx * N] : 'w'); R.cell.push(row); } });
const shiftTo = (o, R) => { const q = JSON.parse(JSON.stringify(o)); ['x', 'x0', 'x1'].forEach(k => { if (typeof q[k] === 'number') q[k] = r2(q[k] + R.ox); }); ['z', 'z0', 'z1'].forEach(k => { if (typeof q[k] === 'number') q[k] = r2(q[k] + R.oz); });
    if (Array.isArray(q.pts)) q.pts = q.pts.map(p => [r2(p[0] + R.ox), r2(p[1] + R.oz)]); return q; };
const DROPPED = [], TRI_ROOM = () => OW_ROOMS[1];
const LOST = [];   // props on a plot no room takes: each is set down again in the nearest room's open sea (below), never lost
const handOut = (list, field, what) => list.forEach(o => { const pt = ptOf(o), R = pt ? roomAt(pt[0], pt[1]) : null; if (!R && field === 'props') { LOST.push({ o, R: TRI_ROOM(), q: homeSq(pt[0], pt[1]) }); return; } if (!R) { DROPPED.push(what + ' ' + (o.key || o.k || o.race || o.id || '') + ' at ' + (pt ? homeSq(pt[0], pt[1]).join(',') : '?')); return; } R[field].push(shiftTo(o, R)); });
handOut(F, 'F', 'feature'); handOut(ARCH, 'ARCH', 'look'); handOut(props, 'props', 'prop'); handOut(npc, 'npc', 'native');
AIR.forEach(z => { const R = roomAt((z.x0 + z.x1) / 2, (z.z0 + z.z1) / 2); if (!R) { DROPPED.push('air ' + z.kind); return; } R.AIR.push(shiftTo(z, R)); });
const BEACH_R = OW_ROOMS[0], TRI_R = OW_ROOMS[1], VOL_R = OW_ROOMS[2];
doors.forEach(d => BEACH_R.doors.push(shiftTo(d, BEACH_R)));
BEACH_R.moored.push(shiftTo({ kind: 'galleon', room: SHIP_ROOM, x: SHIP_AT.x, z: SHIP_AT.z }, BEACH_R));
FLATS.forEach(f => { const R = roomOf[Math.floor((f[0] + f[2]) / 2 / N) + ':' + Math.floor((f[1] + f[3]) / 2 / N)]; if (R) R.FL.push([f[0] - R.dx * N, f[1] - R.dy * N, f[2] - R.dx * N, f[3] - R.dy * N]); });
const pidOf = (c, r) => 'P' + String(c).padStart(2, '0') + '-' + String(r).padStart(2, '0');   // a plot's id in its room (map.js _zmPlots reads it)
PLAN.plots.filter(p => p.name).forEach(p => { const R = roomOf[p.x + ':' + p.y]; if (R) R.names.push([pidOf(p.x - R.dx, p.y - R.dy), p.name, p.d, p.level]); else DROPPED.push('plot name ' + p.id + ' ' + p.name); });
const placeOf = (R, o) => { const q = shiftTo(o, R); return Object.assign({}, o, { x: q.x, z: q.z }); };
const MAEL_W = placeOf(TRI_R, MAEL), POOL_W = placeOf(TRI_R, POOL), BAY_W = placeOf(TRI_R, BAY), GANG_W = placeOf(BEACH_R, GANG);
const TAPE_W = { x: r2(gx(LIGHT[0] + 1) + TRI_R.ox), z: r2(gz(LIGHT[1] + 1) + 1.2 + TRI_R.oz) };
if (roomAt(MAEL.x, MAEL.z) !== TRI_R || roomAt(POOL.x, POOL.z) !== TRI_R || roomAt(BAY.x, BAY.z) !== TRI_R || roomAt(GANG.x, GANG.z) !== BEACH_R) throw new Error('a link\'s place is not in the room it should move with');
TRI_R.triangle = LAYOUT.triangle.map(q => [r2(gx(q[0]) + TRI_R.ox), r2(gz(q[1]) + TRI_R.oz)]);

/* THE SPIT + THE COAST ROAD'S DOOR (R10, docs/areas/routes/R10.json): a bar of sand from the South Dunes through the headland's foot out past the islet to the
   room's south line, where the Coast Road comes in (world plot line x 16 = the room's middle, `ow_h_15_12`) */
{ const R = BEACH_R, mid = Math.round(R.W / 2), PTS = [[1, 100], [6, 104], [14, 109], [28, 115], [mid - 2, 116], [mid, R.H - 1]];
  const near = (x, y) => { for (let i = 1; i < PTS.length; i++) { const [ax, ay] = PTS[i - 1], [bx, by] = PTS[i], vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy))), dx = x - ax - t * vx, dy = y - ay - t * vy; if (dx * dx + dy * dy <= 5.3) return true; } return false; };
  R.spit = []; for (let y = 96; y < R.H; y++) for (let x = 0; x < R.W; x++) if ((R.cell[y][x] === 'w' || (R.cell[y][x] === 'r' && x < 8)) && near(x, y)) { R.cell[y][x] = 'd'; R.spit.push([x, y]); }
  for (let y = R.H - 3; y < R.H; y++) for (let x = mid - 2; x < mid + 2; x++) if (R.cell[y][x] === 'w') { R.cell[y][x] = 'd'; R.spit.push([x, y]); }
  const wet = new Set(R.spit.map(q => q[0] + ':' + q[1]));
  R.props = R.props.filter(p => { const q = [Math.floor((p.x + R.HW) / C), Math.floor((p.z + R.HD) / C)]; if (wet.has(q[0] + ':' + q[1]) && (p.y != null && p.y < 0.2)) { LOST.push({ o: p, R, q, local: true }); return false; } return true; });
  R.doors.push({ id: 'ow_h_15_12', way: 'open', label: 'THE COAST ROAD', sub: 'SOUTH ALONG THE SEA · TO GIZA', action: { room: 'site_ow_r10_0_25', at: 'ow_h_15_12' },
      desc: 'The sand runs out to a road, and the road runs south along the sea to the pyramids.', wall: 's', x: r2(R.gx(mid)), passage: { w: 11 } });
  R.ways = [{ side: 's', at: r2(R.gx(mid)) }]; R.reach = [[mid, R.H - 1, 'the Coast Road door at the spit\'s end']]; }
/* ── THE GROWN ISLAND (mondo 11-16 on map v5: "grow Volcano Island (6x6 jungle + dinosaur park)"; new plots, the names are ideas): south and
   east of the old island's black ground the sea gives way to new land: a sand shore, a JUNGLE (palms, banana plants, tropical bushes, ferns)
   and, in its middle, a fenced DINOSAUR PARK (a paddock of bare earth, a gate with a sign, a timber lookout, the keeper's thatched hut, a dig
   with a dinosaur skeleton and two tents, and dinosaurs). The Landing's water on the west, the boats and every thing afloat keep their sea. ── */
function growVolcano(R) {
    const Wr = R.W, Hr = R.H, cl = R.cell, inr = (x, y) => x >= 0 && y >= 0 && x < Wr && y < Hr, sq = (x, z) => [Math.floor((x + R.HW) / C), Math.floor((z + R.HD) / C)];
    const wetKeep = new Set();   // squares near anything in the water stay sea
    R.props.forEach(p => { if (!(p.y != null && p.y < 0.4)) return; const [x, y] = sq(p.x, p.z); for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) wetKeep.add((x + dx) + ':' + (y + dy)); });
    R.F.concat(R.ARCH).forEach(f => { if (f.k === 'arch' && f.y === 0) { const [x, y] = sq(f.x, f.z); for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) wetKeep.add((x + dx) + ':' + (y + dy)); } });
    let s2 = 7; const rr = () => { s2 = (s2 * 1664525 + 1013904223) >>> 0; return s2 / 4294967296; };
    const CX = 32, CY = 44, RX = 22, RY = 19, land = new Uint8Array(Wr * Hr);
    for (let y = 0; y < Hr; y++) for (let x = 0; x < Wr; x++) { const a = Math.atan2(y - CY, x - CX), k = 1 + 0.09 * Math.sin(a * 3 + 1.1) + 0.06 * Math.sin(a * 7 + 0.4), e = ((x - CX) / (RX * k)) ** 2 + ((y - CY) / (RY * k)) ** 2;
        const neck = x >= 12 && x <= 24 && y >= 16 && y <= 30;   // joins the old island's south shore
        if ((e <= 1 || neck) && cl[y][x] === 'w' && !wetKeep.has(x + ':' + y)) land[y * Wr + x] = 1; }
    /* sand where the new land meets the water (two squares), the jungle inside */
    const nearWater = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (inr(X, Y) && cl[Y][X] === 'w' && !land[Y * Wr + X]) return true; } return false; };
    for (let y = 0; y < Hr; y++) for (let x = 0; x < Wr; x++) if (land[y * Wr + x]) cl[y][x] = nearWater(x, y, 2) ? 'd' : 'g';
    /* THE PARK: a paddock of bare earth, its gate on the north side, a track from the old island's shore down to it */
    const PK = [26, 37, 41, 52];
    for (let y = PK[1]; y < PK[3]; y++) for (let x = PK[0]; x < PK[2]; x++) { if (cl[y][x] !== 'g' && cl[y][x] !== 'd') throw new Error('the park is not on the new land at ' + x + ',' + y); cl[y][x] = 'k'; }
    const GATE = [33, PK[1]];
    for (let t = 0; t <= 1; t += 0.02) { const x = Math.round(18 + (GATE[0] - 18) * t), y = Math.round(20 + (GATE[1] - 20) * t); for (const dx of [0, 1]) if (cl[y][x + dx] === 'g' || cl[y][x + dx] === 'd') cl[y][x + dx] = 'k'; }
    R.FL.push([PK[0], PK[1], PK[2], PK[3]]);
    const taken2 = new Set(); for (let y = PK[1] - 1; y <= PK[3]; y++) for (let x = PK[0] - 1; x <= PK[2]; x++) if (y === PK[1] - 1 || y === PK[3] || x === PK[0] - 1 || x === PK[2]) taken2.add(x + ':' + y);
    const at = (x, y) => ({ x: R.mx(x), z: R.mz(y) }), free = (x, y) => inr(x, y) && !taken2.has(x + ':' + y);
    const P2 = (key, x, y, o) => { if (!free(x, y)) throw new Error(key + ': square taken at ' + x + ',' + y); taken2.add(x + ':' + y); R.props.push(Object.assign({ key }, at(x, y), o || {})); };
    /* the fence: the ranch rail round the paddock's edge, open at the gate */
    const e0 = R.gx(PK[0]), e1 = R.gx(PK[2]), n0 = R.gz(PK[1]), n1 = R.gz(PK[3]), g0 = R.gx(GATE[0]), g1 = R.gx(GATE[0] + 1);
    R.F.push({ k: 'rail', pts: [[g0, n0], [e0, n0], [e0, n1], [e1, n1], [e1, n0], [g1, n0]], model: 'ranch' });
    R.props.push({ key: 'fence_with_gate', x: r2((g0 + g1) / 2), z: n0, face: 0 });
    P2('signpost', GATE[0] - 2, GATE[1] - 2, { face: 180 });
    P2('lantern_post', GATE[0] + 2, GATE[1] - 2);
    P2('thatched_hut', GATE[0] - 5, GATE[1] - 4, { face: 90 });
    P2('timber_lookout', PK[2] - 2, PK[1] + 2, { face: 225 });
    /* the dig: a skeleton in the paddock's south-west corner, two tents and a fire beside it */
    R.props.push({ key: 'dinosaur_skeleton', x: R.gx(PK[0] + 4), z: R.gz(PK[3] - 4), face: 30 }); for (let y = PK[3] - 6; y < PK[3] - 2; y++) for (let x = PK[0] + 2; x < PK[0] + 6; x++) taken2.add(x + ':' + y);
    P2('canvas_tent', PK[0] + 8, PK[3] - 3, { face: 0 }); P2('canvas_tent', PK[0] + 11, PK[3] - 3, { face: 0 }); P2('campfire', PK[0] + 9, PK[3] - 6);
    /* the dinosaurs */
    [[PK[0] + 6, PK[1] + 5, 40], [PK[0] + 10, PK[1] + 8, 200], [PK[2] - 5, PK[1] + 9, 270], [PK[2] - 4, PK[3] - 4, 300]].forEach(q => { if (!free(q[0], q[1])) throw new Error('a dinosaur on a taken square'); taken2.add(q[0] + ':' + q[1]); R.npc.push({ x: R.mx(q[0]), z: R.mz(q[1]), face: q[2], race: 'dinosaur' }); });
    /* THE JUNGLE: palms on the sand and in the jungle, banana plants and bushes (blockers on whole squares), ferns off-centre */
    let palms = 0, banana = 0, bush = 0, fern = 0;
    for (let y = 1; y < Hr - 1; y++) for (let x = 1; x < Wr - 1; x++) { if (!land[y * Wr + x] || !free(x, y)) continue; const ch = cl[y][x]; if (ch === 'k') continue; const v = rr();
        if (ch === 'd' && v < 0.07) { taken2.add(x + ':' + y); R.F.push({ k: 'tree', x: r2(R.mx(x) + (rr() - 0.5)), z: r2(R.mz(y) + (rr() - 0.5)), kind: 'palm', h: r2(3.8 + rr() * 1.6), r: 0.6 }); palms++; }
        else if (ch === 'g' && v < 0.09) { taken2.add(x + ':' + y); R.F.push({ k: 'tree', x: r2(R.mx(x) + (rr() - 0.5)), z: r2(R.mz(y) + (rr() - 0.5)), kind: 'palm', h: r2(4.6 + rr() * 2.4), r: 0.6 }); palms++; }
        else if (ch === 'g' && v < 0.13) { P2(rr() < 0.5 ? 'banana_plant' : 'tropical_bush', x, y, { face: Math.round(rr() * 360) }); if (R.props[R.props.length - 1].key === 'banana_plant') banana++; else bush++; }
        else if (ch === 'g' && v < 0.22) { R.props.push({ key: 'fern', x: r2(R.mx(x) + (rr() - 0.5) * 1.6), z: r2(R.mz(y) + (rr() - 0.5) * 1.6), face: Math.round(rr() * 360) }); fern++; } }
    R.newNames = [[2, 3, 'The Dinosaur Park'], [1, 2, 'The Jungle'], [3, 2, 'The Jungle, east'], [1, 4, 'The South Shore']];
    { let bd = 1e9; for (let y = 0; y < Hr; y++) for (let x = 0; x < Wr; x++) if (cl[y][x] === 'b') { const d = (x - 8) ** 2 + (y - 19) ** 2; if (d < bd) { bd = d; R.from = [x, y]; } } }   // the walk starts on the Landing's black sand
    R.reach = [[GATE[0], GATE[1] - 1, 'the park gate'], [PK[0] + 6, PK[1] + 4, 'the paddock']];
    console.log(R.id + ': THE GROWN ISLAND ' + JSON.stringify({ land: land.reduce((a, b) => a + b, 0), palms, banana, bush, fern }));
}
growVolcano(VOL_R);
(VOL_R.newNames || []).forEach(q => VOL_R.names.push([pidOf(q[0], q[1]), q[2], 'O', 2]));

/* ── each room's heights, slopes and paint: the home rules, on the room's own squares ── */
const BEACH2 = BEACH + 'gk', SOFT2 = SOFT + 'gk';
function bakeRoom(R) {
    const Wr = R.W, Hr = R.H, cl = R.cell, inr = (x, y) => x >= 0 && y >= 0 && x < Wr && y < Hr;
    const dist = match => { const d = new Int16Array(Wr * Hr).fill(999), q = [];
        for (let y = 0; y < Hr; y++) for (let x = 0; x < Wr; x++) if (match(cl[y][x])) { d[y * Wr + x] = 0; q.push(x, y); }
        for (let i = 0; i < q.length; i += 2) { const x = q[i], y = q[i + 1], v = d[y * Wr + x] + 1; for (const [dx, dy] of N8) { const X = x + dx, Y = y + dy; if (inr(X, Y) && d[Y * Wr + X] > v) { d[Y * Wr + X] = v; q.push(X, Y); } } }
        return d; };
    const dW = dist(ch => WET.includes(ch)), dB = dist(ch => BEACH2.includes(ch)), dND = dist(ch => ch !== 'D'), dNC = dist(ch => ch !== 'h' && ch !== 'l');
    const h = new Float32Array(Wr * Hr);
    for (let y = 0; y < Hr; y++) for (let x = 0; x < Wr; x++) { const ch = cl[y][x], k = y * Wr + x, p = R.plotAt(x, y); let v;
        if (ch === 'w') v = dB[k] > 900 ? SEA_BED : Math.max(SEA_BED, -(0.45 + 0.7 * (dB[k] - 1)));
        else if (ch === 'u') v = -0.8; else if (ch === 'a') v = -9;
        else if (ch === 'D') v = Math.min(0.3 + 0.6 * (dW[k] - 1), 1.2 + 0.45 * (dND[k] - 1) + 0.35 * Math.sin((x + R.dx * N) * 0.9) * Math.cos((y + R.dy * N) * 0.7), 3.6);
        else if (BEACH2.includes(ch)) v = Math.min(CAP[p.level] || 0.6, 0.3 + 0.3 * (dW[k] - 1));
        else if (ch === 'J') v = PIER; else if (ch === 'o') v = QUAY; else if (ch === 'X') v = SHIP_BLOCK;
        else if (ch === 'r') v = p.d === 'T' ? 3.4 : p.d === 'H' ? 1.6 : 2.4 + 0.5 * Math.sin((x + R.dx * N) * 1.3 + (y + R.dy * N) * 0.8);
        else if (ch === 'h') v = 2.5 + 4.2 * (dNC[k] - 1) + 0.6 * Math.sin((x + R.dx * N) * 1.7) * Math.cos((y + R.dy * N) * 1.1);
        else if (ch === 'l') v = 2.5 + 4.2 * 3.2;
        else throw new Error(R.id + ': a square nobody knows: ' + ch + ' at ' + x + ',' + y);
        h[k] = v; }
    R.FL.forEach(([x0, y0, x1, y1]) => { const p = R.plotAt(Math.floor((x0 + x1) / 2), Math.floor((y0 + y1) / 2)), ref = CAP[p.level] || 0.6;
        for (let y = y0 - 1; y <= y1; y++) for (let x = x0 - 1; x <= x1; x++) if (inr(x, y) && BEACH2.includes(cl[y][x])) { const own = x >= x0 && x < x1 && y >= y0 && y < y1; if (own || dW[y * Wr + x] >= 3) h[y * Wr + x] = ref; } });
    const grp = ch => SOFT2.includes(ch) ? 's' : (ch === 'h' || ch === 'l') ? 'h' : ch === 'r' ? 'r' : null;
    const corner = (cx, cy, g) => { let s = 0, n = 0; for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const X = cx + dx, Y = cy + dy; if (inr(X, Y) && grp(cl[Y][X]) === g) { s += h[Y * Wr + X]; n++; } } return s / n; };
    R.slope = Buffer.alloc(Wr * Hr * 8);
    for (let y = 0; y < Hr; y++) for (let x = 0; x < Wr; x++) { const o = (y * Wr + x) * 8, g = grp(cl[y][x]); [[0, 0], [1, 0], [0, 1], [1, 1]].forEach((q, k) => R.slope.writeInt16LE(Math.round((g ? corner(x + q[0], y + q[1], g) : h[y * Wr + x]) * 100), o + k * 2)); }
    const KEY = { j: 'wood_planks', J: 'wood_planks', X: 'wood_planks', o: 'cobblestone', r: 'rocks_5', h: 'obsidian', l: 'lava', b: 'dirt_2', c: 'scorched', g: 'grass_2', k: 'dirt' };
    R.PAL = []; R.paint = new Uint8Array(Wr * Hr);
    for (let y = 0; y < Hr; y++) for (let x = 0; x < Wr; x++) { const key = KEY[cl[y][x]]; if (!key) continue; let i = R.PAL.indexOf(key); if (i < 0) { R.PAL.push(key); i = R.PAL.length - 1; } R.paint[y * Wr + x] = i + 1; }
    if (R.PAL.length > 8) throw new Error(R.id + ': more than 8 paint sheets: ' + R.PAL.join(' '));
    R.hc = h;
    /* the walk: from the room's first door (or its spawn square) every `reach` square is reached on foot */
    if (R.reach) { const st = [R.from], seen = new Uint8Array(Wr * Hr); seen[R.from[1] * Wr + R.from[0]] = 1;
        while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of N8.slice(0, 4)) { const X = x + dx, Y = y + dy; if (!inr(X, Y) || seen[Y * Wr + X] || h[Y * Wr + X] <= -1.15) continue;
            const hard = !(SOFT2.includes(cl[y][x]) && SOFT2.includes(cl[Y][X])); if (hard ? Math.abs(h[Y * Wr + X] - h[y * Wr + x]) > 0.62 : Math.abs(h[Y * Wr + X] - h[y * Wr + x]) / C > 1.0) continue; seen[Y * Wr + X] = 1; st.push([X, Y]); } }
        if (process.env.BEACH_DUMP) console.log(R.id + '\n' + cl.map((r, y) => r.map((ch, x) => seen[y * Wr + x] ? '.' : h[y * Wr + x] < -1.15 ? ' ' : ch).join('')).join('\n'));
        R.reach.forEach(q => { if (!seen[q[1] * Wr + q[0]]) throw new Error(R.id + ': not reached on foot: ' + q[2]); }); }
    else if (process.env.BEACH_DUMP) console.log(R.id + '\n' + cl.map((r, y) => r.map((ch, x) => h[y * Wr + x] < -1.15 ? ' ' : ch).join('')).join('\n'));
}
BEACH_R.from = SP;
OW_ROOMS.forEach(bakeRoom);
/* the props the move put out of the water (or onto no plot): each goes to the nearest square of open sea, at least 2.5 m deep, in its room */
LOST.forEach(({ o, R, q, local }) => { const lx = local ? q[0] : Math.max(0, Math.min(R.W - 1, q[0] - R.dx * N)), ly = local ? q[1] : Math.max(0, Math.min(R.H - 1, q[1] - R.dy * N));
    let best = null, bd = 1e9; for (let y = 0; y < R.H; y++) for (let x = 0; x < R.W; x++) { if (R.cell[y][x] !== 'w' || R.hc[y * R.W + x] > -2.5) continue; const d = (x - lx) ** 2 + (y - ly) ** 2; if (d < bd) { bd = d; best = [x, y]; } }
    if (!best) throw new Error('no sea for ' + o.key);
    const n = Object.assign({}, o, { x: R.mx(best[0]), z: R.mz(best[1]) }); R.props.push(n); R.count.reset = (R.count.reset || 0) + 1;
    console.log('set down again: ' + o.key + ' (home ' + q.join(',') + ') in ' + R.id + ' at ' + best.join(',')); });
/* each room's spawn: the beach's at the city door as before; the islands' on the dry square nearest their landing place */
const dryNear = (R, sx, sy) => { let best = null, bd = 1e9; for (let y = 0; y < R.H; y++) for (let x = 0; x < R.W; x++) { const k = y * R.W + x; if (R.hc[k] < 0.25 || !'dtbcgk'.includes(R.cell[y][x])) continue; const d = (x - sx) ** 2 + (y - sy) ** 2; if (d < bd) { bd = d; best = [x, y]; } } if (!best) throw new Error(R.id + ': no dry square'); return best; };
BEACH_R.sp = SP;
TRI_R.sp = dryNear(TRI_R, Math.floor((BAY.x + HW) / C) - TRI_R.dx * N, Math.floor((BAY.z + HD) / C) - TRI_R.dy * N + 2);
VOL_R.sp = dryNear(VOL_R, 6, 18);
if (DROPPED.length) console.log('DROPPED (on a plot no room takes): ' + DROPPED.length + '\n  ' + DROPPED.join('\n  '));

/* ── the rooms ── */
const LINES = O_HARB.l.concat(O_SEA.l), L = [];
L.push("        /* BEACH140-BEGIN — THE BEACH ON PLOTS (2026-11-15) + THE ONE WORLD MOVE (2026-11-17): written by `node bake-beach.js` from docs/areas/beach/layout.json. Never hand-edit between the markers; edit the tool or the layout and rerun. */");
OW_ROOMS.forEach(R => {
    const SPM = { x: R.mx(R.sp[0]), z: R.mz(R.sp[1]) }, home = R === BEACH_R;
    L.push("        " + R.id + ": {");
    L.push("            label: '" + R.label + "',");
    L.push("            sub: '" + R.sub + "',");
    L.push("            kind: 'box', site: 'prebuilt_bermuda', part: '" + R.part + "',");
    L.push("            /* THE ONE WORLD: where this room stands on the world's plot grid (data.js hqOwIndex) */");
    L.push("            world: { hub: 'beach', layer: 'surface', wx: " + R.wx + ", wy: " + R.wy + " },");
    /* THE BEACH'S OWN SKY + SAND (2026-11-16): the sea shell's sky without its scenery and landmark (THE CLEAN SKY); the sand his pale beach sheet */
    L.push("            shell: hqSeaShell({ w: " + (2 * R.HW) + ", d: " + (2 * R.HD) + ", plate: { x: " + SPM.x + ", z: " + SPM.z + ", y: 4.4 }, sky: Object.assign({}, hqSeaShell().sky, { scenery: 'none', landmarks: [] })" + (R.AIR.length ? ", atmos: " + J({ kind: 'dust', tier: 'open', zones: R.AIR }) : "") + " }),");
    L.push("            parti: " + J(R.parti) + ",");
    L.push("            typology: 'grid',");
    L.push("            plots: { cell: " + C + ", plot: " + PL + ", n: " + R.cols + ", nz: " + R.rows + (R.triangle ? ", triangle: " + J(R.triangle) : "") + ", names: " + J(R.names) + " },");
    L.push("            terrain: {");
    L.push("                res: 1.75, floor: 'desert', cliff: 'rocks_5', path: 'wood_planks',");
    L.push("                base: 0, noise: { amp: 0.06, scale: 9 }, crag: false,");
    L.push("                sea: { y: 0, key: 'water' },");
    L.push("                outer: { m: 60 },");
    if (home) L.push("                backdrop: false, edges: { reach: 300, n: { kind: 'coast' }, e: { kind: 'coast' }, s: { kind: 'coast' }, w: { kind: 'desert', cap: { kind: 'coast', at: 'n', off: 0, len: 42 } } },");
    else L.push("                /* THE HORIZON READS THE MAP: open sea all round, the Ice Wall where it is near (three-renderer.js _hqEdgeLandFn `world`) */\n                backdrop: false, edges: { world: true, reach: 440 },");
    if (R.moored.length) { L.push("                /* THE FLYING DUTCHMAN: the Dutchman map's own ship, drawn at her berth (three-renderer.js _hqBuildMoored) */"); L.push("                moored: [" + R.moored.map(J).join(', ') + "],"); }
    L.push("                /* THE HEIGHTS ARE THE MAP: sand, sea floor, the quay, the piers, rock, the ship's deck and the volcano are all this grid */");
    L.push("                slope: { cells: { res: " + C + ", x0: " + R.gx(0) + ", z0: " + R.gz(0) + ", nx: " + R.W + ", nz: " + R.H + ", d: '" + R.slope.toString('base64') + "' } },");
    L.push("                paint: { pal: " + J(R.PAL) + ", t: 'u8', res: " + C + ", x0: " + R.mx(0) + ", z0: " + R.mz(0) + ", nx: " + R.W + ", nz: " + R.H + ", d: '" + Buffer.from(R.paint).toString('base64') + "' },");
    L.push("                features: [");
    R.F.concat(R.ARCH).forEach(f => L.push("                    " + J(f) + ","));
    L.push("                ],");
    L.push("            },");
    L.push("            doors: [");
    R.doors.forEach(d => L.push("                " + J(d) + ","));
    L.push("            ],");
    L.push("            counters: [],");
    L.push("            props: [");
    for (let i = 0; i < R.props.length; i += 4) L.push("                " + R.props.slice(i, i + 4).map(J).join(", ") + ",");
    L.push("            ],");
    L.push("            agents: [],");
    L.push("            npcSpots: " + J(R.npc) + ",");
    L.push("            onlineSpots: [],");
    L.push("            lines: " + J(home ? LINES : []) + ",");
    L.push("            spawn: { x: " + SPM.x + ", z: " + SPM.z + ", face: " + (home ? 90 : 0) + " },");
    L.push("        },");
    console.log(R.id + ': ' + JSON.stringify({ features: R.F.length + R.ARCH.length, props: R.props.length, natives: R.npc.length, doors: R.doors.length, pal: R.PAL.length }));
});
L.push("        /* BEACH140-END */");
const block = L.join('\n') + '\n';
console.log(JSON.stringify(count));
/* the rows in data.js that name a place in this room (written by hand there): the tool refuses to bake when one has drifted */
const at = (o, part) => "site: 'prebuilt_bermuda', part: '" + part + "', wall: 'free', x: " + o.x + ", z: " + o.z + ", face: " + o.face + ",";
const WANT = [
    ["prebuilt_bermuda: { room: '" + TRI_R.id + "', door: { id: 'bay', wall: 'free', x: " + BAY_W.x + ", z: " + BAY_W.z + ", face: " + BAY.face + " } }", 'siteRooms.entry.prebuilt_bermuda'],
    ["a: { " + at(MAEL_W, 'ow_triangle') + " way: 'whirlpool',", 'link bermuda_abyss'],
    ["b: { " + at(POOL_W, 'ow_triangle'), 'link weir_bermuda'],
    ["a: { " + at(GANG_W, 'beach'), 'link beach_dutchman'],
    [TRI_R.id + ": { tape: { x: " + TAPE_W.x + ", z: " + TAPE_W.z + " } }", 'the tape on the Lighthouse Rock'],
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
