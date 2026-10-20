#!/usr/bin/env node
// bake-arenas.js — THE ARENAS (EDITOR_PLAN E8, 2026-09-30): picks each site's PvP S×S arena (S = HQ_ARENA_RULES.size, 12 since 2026-10-06) from its own room.
//
// A site room's floor plan takes 1–30 s to compile, so the pick is baked here instead of at load. For every launch
// site (EW_MAP_META, not a Δ / facility / area row) the tool compiles the site's rooms (the entry part first — the
// room the bay door lands in — then the rest, biggest first; a room with a sea never fights on its own ground) and
// scans every S×S window of THE FIELD's lattice (hqFieldLattice / hqFieldRaster — the code the game fights with).
// A window FITS when the house tiles (data.js hqArenaHouse: the spawn rows 0 / S-1 and the egress rows 1 / S-2 at x 4..7, the
// 2×2 nexus at x 5..6 y 5..6 on a 12) are flat walkable floor with a seat, the spawns' apron is at most one level up, no walkable cell
// stands more than two battle levels up, at most HQ_ARENA_RULES.obstacles cells are the room's own obstacles (a tree,
// a rock, a prop, a pool: the engine's solid / hazard, drawn as what they are — a FEATURE, a blocked patch of at most
// HQ_ARENA_RULES.featureMax cells standing free inside the room; never the room's edge, a cliff wall or a building,
// so the arena stands in the open, never against a wall), and every walkable cell is
// reachable from both spawn rows. The best window has the most cover (raised cells + obstacles, capped, balanced
// between the two halves), then is the nearest to the room's BATTLE marker. The first room of the site with a window
// that fits wins; a site with none keeps its Δ.
//
// Writes data.js HQ_ARENA_RULES.picks (between the <ARENA PICKS> markers). Run after a site room changes:
//   node bake-arenas.js            (all sites; a few minutes)
//   node bake-arenas.js --dry-run  (print the picks, write nothing)
//   node bake-arenas.js prebuilt_lodge prebuilt_shasta   (bake only those sites; every other pick stands)
// THE ARENA SIZES (2026-10-17, mondo: "add 9x9, 10x10, and 11x11 maps"): `--size N` bakes the N×N cuts (data.js HQ_ARENA_RULES.picks<N>,
// between its own <ARENA PICKS N> markers) with the house of that size (hqArenaHouseTiles: 5v5 on 9 and 11 — the 2×3 zones, the Cube's
// back-middle tile, the 3×3 nexus flat; the egress rows in front of the zones open, at most one level up) and the 12×12 caps scaled by
// area (hqArenaCaps). Only the sites with a 12×12 cut get the extra sizes. `--json <file>` writes the picks to a file instead of data.js
// (bake several sizes at once), `--apply <file>` files such a bake into data.js:
//   node bake-arenas.js --size 9 --json /tmp/a9.json   then   node bake-arenas.js --size 9 --apply /tmp/a9.json
// THE ARENA'S PLACE (2026-10-20, the voxel maps remade as rooms): HQ_ARENA_RULES.within[site] = { room, x, z, r } — a site whose map was
// built for its board (Göbekli Tepe's ENCLOSURE E) is cut only from that room, from windows whose centre lies within r metres of (x, z).
// THE OWN ARENAS (2026-10-20, mondo: "all of those voxel maps remade as new maps"): `--own [mapId…]` re-reads the boards a map's
// own room was BUILT for (data.js HQ_ARENA_RULES.own — the room and its window are hand-placed, nothing is searched): it rasters the
// window at the map's size, checks the house tiles are flat open floor and both spawn rows join, prints the grid and rewrites that
// map's `<OWN PICK id>` line. Rerun after the room changes:   node bake-arenas.js --own prebuilt_holosim   (--dry-run prints only)
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');

const DRY = process.argv.includes('--dry-run');
const argAfter = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const JSON_OUT = argAfter('--json'), APPLY = argAfter('--apply');
const DATA = path.join(__dirname, 'data.js');

const sb = loadGameData({ quiet: true });
const ev = (s) => vm.runInContext(s, sb);
const META = ev('EW_MAP_META');
const ROOMS = ev('DOOR_HQ.rooms');
const ENTRY = ev('(DOOR_HQ.siteRooms || {}).entry || {}');
const S12 = ev('HQ_ARENA_RULES.size');
const S = argAfter('--size') ? (parseInt(argAfter('--size'), 10) | 0) : S12;
if (S !== S12 && ev('HQ_ARENA_EXTRA_SIZES').indexOf(S) < 0) { console.error('--size ' + S + ' is not one of data.js HQ_ARENA_EXTRA_SIZES'); process.exit(1); }
const PKEY = S === S12 ? 'picks' : 'picks' + S, MARK = S === S12 ? 'ARENA PICKS' : 'ARENA PICKS ' + S;
const CAPS = sb.hqArenaCaps(S);
const OBST = CAPS.obstacles;
const FEAT = ev('HQ_ARENA_RULES.featureMax');
const WALLS = CAPS.wallMax, TOP = ev('HQ_ARENA_RULES.topMax');

const KEEP = new Set(ev('HQ_ARENA_RULES.keep') || []);   // the sites that keep their Δ board (no pick written)
const WITHIN = ev('HQ_ARENA_RULES.within') || {};   // THE ARENA'S PLACE (2026-10-20): site → { room, x, z, r } — every size of its arena is cut there (a map built for its board)
const ONLY = process.argv.filter(a => /^prebuilt_/.test(a));   // name sites to bake only them (the rest of the picks stand)
const HAS12 = ev('HQ_ARENA_RULES.picks') || {};   // the extra sizes: only the sites with a 12×12 cut
const sites = META.filter(m => !m.isDelta && !m.facility && !m.area && !KEEP.has(m.id) && (!ONLY.length || ONLY.includes(m.id)) && (S === S12 || HAS12[m.id])).map(m => m.id);
const bySite = {};
for (const id of Object.keys(ROOMS)) {
    const r = ROOMS[id];
    if (!r || !r.site) continue;
    const s = sb.hqRoomSite(id);
    if (s) (bySite[s] = bySite[s] || []).push(id);
}

const HT = sb.hqArenaHouseTiles(S), HX = HT.HX;
const HOUSE = HT.flat.map(p => [p[0], p[1]]);
const EGRESS = HT.egress.map(p => [p[0], p[1]]);   // 5v5: in front of the zones — open, at most one level up
const houseSet = new Set(HOUSE.map(p => p[0] + ',' + p[1]));
const egressSet = new Set(EGRESS.map(p => p[0] + ',' + p[1]));
const APRON = [];
const apronRows = HX.block ? [0, 1, S - 2, S - 1] : [0, S - 1];
for (const row of apronRows) for (let x = HX.x0 - 1; x <= HX.x1 + 1; x++) for (let dy = -1; dy <= 1; dy++) { const y = row + dy; if (y >= 0 && y < S) APRON.push([x, y]); }

function marker(roomId) {
    const r = ROOMS[roomId] || {};
    const m = (r.counters || []).find(c => c && (c.id === 'battle' || c.proc === 'battle_marker') && typeof c.x === 'number');
    return m ? { x: m.x, z: +m.z || 0 } : { x: 0, z: 0 };
}

/* 🌋 THE LAVA PITS (2026-10-20, Hell's walkways): in a room whose terrain says `pits`, a lava lattice cell is the map's own design —
   never an obstacle or a wall the caps count, never part of a blocked patch (a pillar standing out of the lake is its own feature) */
function pitCell(Lt, roomId, gx, gy) {
    const r = ROOMS[roomId];
    if (!r || !r.terrain || !r.terrain.pits || Lt.kind !== 'terrain') return false;
    const c = Lt.info.cells[gy] && Lt.info.cells[gy][gx];
    return !!(c && c.hazard && c.fluid === 'lava');
}

/* the room's FEATURES: every blocked lattice patch of at most FEAT cells that touches no edge of the lattice */
function features(Lt, roomId) {
    const feat = new Set(), seen = new Set();
    const blocked = (x, y) => !Lt.walk(x, y) && !pitCell(Lt, roomId, x, y);
    for (let gy = 0; gy < Lt.h; gy++) for (let gx = 0; gx < Lt.w; gx++) {
        const k0 = gx + ',' + gy;
        if (seen.has(k0) || !blocked(gx, gy)) continue;
        const comp = [], q = [[gx, gy]]; seen.add(k0); let edge = false;
        while (q.length) {
            const [x, y] = q.pop(); comp.push(x + ',' + y);
            if (x === 0 || y === 0 || x === Lt.w - 1 || y === Lt.h - 1) edge = true;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
                if (nx < 0 || ny < 0 || nx >= Lt.w || ny >= Lt.h || seen.has(k) || !blocked(nx, ny)) continue;
                seen.add(k); q.push([nx, ny]);
            }
        }
        if (!edge && comp.length <= FEAT) comp.forEach(k => feat.add(k));
    }
    return feat;
}

/* strict = the open-ground rule above; !strict = THE WALLED CUT (2026-10-06, the 12×12 arenas): the room's own walls and
   buildings may stand inside the window as solid ground (drawn as what they are, as an encounter draws them), a walkable
   cell neither spawn reaches counts with them, at most HQ_ARENA_RULES.wallMax cells in all, no walkable cell over topMax
   levels; the house tiles stay clear, flat and joined */
function judge(R, strict) {
    let cover = 0, top = 0, bottom = 0, out = 0, inN = 0;
    const cap = strict ? OBST : WALLS, hi = strict ? 2 : TOP;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const c = R.cells[y][x];
        const open = c.in && !c.rock && !c.hazard;
        if (c.pit) { if (houseSet.has(x + ',' + y) || egressSet.has(x + ',' + y)) return null; continue; }   // 🌋 a lava pit: the map's own, uncounted
        if (!open) { if (houseSet.has(x + ',' + y) || egressSet.has(x + ',' + y) || ++out > cap) return null; }
        else { inN++; if ((c.tile | 0) > hi) return null; }
        if ((!open || (c.tile | 0) > 0) && !houseSet.has(x + ',' + y)) { cover++; if (y < S / 2) top++; else bottom++; }
    }
    for (const [x, y] of HOUSE) { const c = R.cells[y][x]; if ((c.tile | 0) !== 0 || c.seat === false || c.fluid || c.prop || c.wall || c.bridge) return null; }
    for (const [x, y] of APRON) { const c = R.cells[y][x]; if (c.in && !c.rock && !c.hazard && (c.tile | 0) > 1) return null; }
    for (const [x, y] of EGRESS) { const c = R.cells[y][x]; if ((c.tile | 0) > 1 || c.fluid) return null; }
    const a = sb.hqFieldReach(R, HX.n, 0), b = sb.hqFieldReach(R, HX.n, S - 1);
    if (strict) { if (a.size < inN || b.size < inN) return null; }
    else {
        if (!a.has(HX.n + ',' + (S - 1))) return null;   // the two spawn rows are joined
        out += inN - a.size; if (out > cap) return null;   // a pocket nobody reaches counts as a wall
    }
    return { cover, out, imbalance: Math.abs(top - bottom), strict };
}

/* THE BOARD IS THE ARENA (2026-10-20, THE CHESS COURT): a terrain room with a `board` feature at least S squares a side on the
   lattice fights ON it — only the windows inside the board are scanned (the Looking-Glass garden's 12 × 12 chessboard; a cover-rich
   window half on the tea lawn outscored it). Null = no such board: every window. */
function boardWindows(roomId, Lt) {
    const r = ROOMS[roomId];
    if (!r || !r.terrain || Lt.kind !== 'terrain') return null;
    const b = (r.terrain.features || []).filter(f => f && f.k === 'board').map(f => sb.hqTerrainBoard(f)).find(b => b.n >= S && Math.abs(b.C - Lt.C) < 1e-6);
    if (!b) return null;
    const bx = Math.round((b.x0 - Lt.x0) / Lt.C), bz = Math.round((b.z0 - Lt.z0) / Lt.C);
    if (Math.abs(bx * Lt.C + Lt.x0 - b.x0) > 0.01 || Math.abs(bz * Lt.C + Lt.z0 - b.z0) > 0.01) return null;   // a board off the lattice: no rule
    return { x0: bx, z0: bz, x1: bx + b.n - S, z1: bz + b.n - S };
}

function scanRoom(roomId, strict, place) {
    if (!sb.hqFieldRoomOk(roomId)) return null;
    const Lt = sb.hqFieldLattice(roomId);
    if (!Lt || Lt.w < S || Lt.h < S) return null;
    const mk = marker(roomId), feat = features(Lt, roomId), BW = boardWindows(roomId, Lt);
    const off1 = (gx, gy) => !Lt.walk(gx, gy) && !pitCell(Lt, roomId, gx, gy);
    let best = null, clear = 0;
    for (let oz = 0; oz + S <= Lt.h; oz++) for (let ox = 0; ox + S <= Lt.w; ox++) {
        if (place && Math.hypot(Lt.x0 + (ox + S / 2) * Lt.C - place.x, Lt.z0 + (oz + S / 2) * Lt.C - place.z) > place.r) continue;   // THE ARENA'S PLACE: only windows centred there
        if (BW && (ox < BW.x0 || ox > BW.x1 || oz < BW.z0 || oz > BW.z1)) continue;
        let off = 0;
        if (strict) {
            for (let y = 0; y < S && off <= OBST; y++) for (let x = 0; x < S; x++) if (off1(ox + x, oz + y)) { off += (houseSet.has(x + ',' + y) || egressSet.has(x + ',' + y) || !feat.has((ox + x) + ',' + (oz + y))) ? OBST + 1 : 1; if (off > OBST) break; }
            if (off > OBST) continue;
        } else {
            for (let y = 0; y < S && off <= WALLS; y++) for (let x = 0; x < S; x++) if (off1(ox + x, oz + y)) { off += (houseSet.has(x + ',' + y) || egressSet.has(x + ',' + y)) ? WALLS + 1 : 1; if (off > WALLS) break; }
            if (off > WALLS) continue;
        }
        const R = sb.hqFieldRaster(roomId, ox, oz, S, S);
        const j = R && judge(R, strict);
        if (!j) continue;
        clear++;
        const cx = R.x0 + S * R.C / 2, cz = R.z0 + S * R.C / 2;
        const dist = Math.hypot(cx - mk.x, cz - mk.z);
        const score = strict ? Math.min(j.cover, Math.round(12 * S * S / 64)) - 0.75 * j.imbalance - dist / 12
                             : -j.out - 0.75 * j.imbalance - dist / 12;   // a walled cut: the most open ground first
        if (!best || score > best.score + 1e-9) best = { ox, oz, score, cover: j.cover, out: j.out, strict, dist, R };
    }
    return best ? Object.assign(best, { clear }) : null;
}

function encode(R) {
    const keys = [], cells = [];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const c = R.cells[y][x];
        let k = keys.indexOf(c.key);
        if (k < 0) { k = keys.length; keys.push(c.key); }
        cells.push(k.toString(36) + String(Math.max(0, Math.min(9, (c.tile | 0) + 1))));   // the level + 1 (a pool sits at -1)
    }
    /* 🌋 THE LAVA PITS: their cells and their depth ride the pick (the digit stops at −1; data.js hqArenaCells reads them) */
    const pitRows = R.cells.map(row => row.map(c => c.pit ? '1' : '0').join('')).join('');
    if (pitRows.indexOf('1') >= 0) {
        const t = R.cells.flat().filter(c => c.pit).map(c => c.tile | 0);
        return { keys, cells: cells.join(''), pits: pitRows, pitTile: Math.min.apply(null, t) };
    }
    return { keys, cells: cells.join('') };
}

/* THE OWN ARENAS (2026-10-20): `--own [mapId …]` re-encodes the boards cut from their OWN rooms (data.js HQ_ARENA_RULES.own — the
   facility boards, the Clash stage): the window is the room's own design (room, ox, oz stand as filed), so nothing is searched — the
   window is rasterised, judged by the walled-cut rule at the board's own size and its cells written back on its `<OWN PICK id>` line */
if (process.argv.includes('--own')) {
    const OWN = ev('HQ_ARENA_RULES.own') || {};
    const ids = Object.keys(OWN).filter(id => !ONLY.length || ONLY.includes(id));
    let src = fs.readFileSync(DATA, 'utf8'), wrote = 0;
    for (const id of ids) {
        const p = OWN[id], N = (p.S | 0) || ((ev('PREBUILT_MAPS[' + JSON.stringify(id + '_voxel') + ']') || ev('PREBUILT_MAPS[' + JSON.stringify(id) + ']') || {}).w | 0) || S12;
        const t = Date.now();
        const R = sb.hqFieldRaster(p.room, p.ox, p.oz, N, N);
        if (!R) { console.error(id + ': the room ' + p.room + ' could not be read'); continue; }
        const HTn = sb.hqArenaHouseTiles(N), bad = [];
        HTn.flat.forEach(([x, y]) => { const c = R.cells[y][x]; if (!(c.in && !c.rock && !c.hazard) || (c.tile | 0) !== 0 || c.wall) bad.push(x + ',' + y); });
        const a = sb.hqFieldReach(R, HTn.HX.n, 0);
        if (!a.has(HTn.HX.n + ',' + (N - 1))) bad.push('the spawn rows are not joined');
        const enc = (() => { const keys = [], cells = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = R.cells[y][x]; let k = keys.indexOf(c.key); if (k < 0) { k = keys.length; keys.push(c.key); } cells.push(k.toString(36) + String(Math.max(0, Math.min(9, (c.tile | 0) + 1)))); } return { keys, cells: cells.join('') }; })();
        console.log(id + ': ' + p.room + ' @ ' + p.ox + ',' + p.oz + ' ' + N + '×' + N + (bad.length ? ' — HOUSE TILES NOT CLEAR: ' + bad.join(' ') : ' ok') + ' (' + ((Date.now() - t) / 1000).toFixed(1) + ' s)');
        for (let y = 0; y < N; y++) console.log('   ' + R.cells[y].map(c => c.rock ? '#' : c.hazard ? '~' : String(c.tile | 0)).join(' '));
        const rec = { room: p.room, ox: p.ox, oz: p.oz }; if (p.S) rec.S = p.S;
        Object.assign(rec, { base: R.floorKey || p.base || 'grass_2', open: R.open ? 1 : 0, keys: enc.keys, cells: enc.cells });
        const re = new RegExp('(HQ_ARENA_RULES\\.own\\.' + id + ' = )\\{.*?\\}(;[^\\n]*<OWN PICK ' + id + '>)');
        if (!re.test(src)) { console.error(id + ': data.js has no <OWN PICK ' + id + '> line'); continue; }
        src = src.replace(re, (m, a1, b1) => a1 + JSON.stringify(rec) + b1); wrote++;
    }
    if (!DRY && wrote) { fs.writeFileSync(DATA, src); console.log('wrote ' + wrote + ' own pick(s) into data.js'); }
    process.exit(0);
}

let picks = {};
const t0 = Date.now();
if (APPLY) picks = JSON.parse(fs.readFileSync(APPLY, 'utf8'));
for (const site of (APPLY ? [] : sites)) {
    const rooms = (bySite[site] || []).slice();
    const ent = ENTRY[site] && ENTRY[site].room;
    const size = (id) => { const sh = (ROOMS[id] || {}).shell || {}; return (+sh.w || 0) * (+sh.d || 0); };
    /* a room built as the site's battle map (`arenaRoom: true` — Hell's walkways) is scanned first, then the entry part, then the rest by size */
    const built = rooms.filter(r => (ROOMS[r] || {}).arenaRoom);
    let order = built.concat(ent && rooms.includes(ent) && !built.includes(ent) ? [ent] : []).concat(rooms.filter(r => r !== ent && !built.includes(r)).sort((a, b) => size(b) - size(a)));
    const place = WITHIN[site] || null;
    if (place) order = order.filter(r => r === place.room);
    let got = null;
    for (const strict of [true, false]) {   // an open-ground window in any room first, then the walled cut
        for (const roomId of order) {
            const t = Date.now();
            const best = scanRoom(roomId, strict, place);
            process.stderr.write('  ' + site + ' · ' + roomId + (strict ? '' : ' (walled)') + ': ' + (best ? best.clear + ' fit, pick ' + best.ox + ',' + best.oz + ' cover ' + best.cover + ' solid ' + best.out + ' ' + best.dist.toFixed(1) + ' m from the marker' : 'no ' + S + 'x' + S + ' fits') + ' (' + ((Date.now() - t) / 1000).toFixed(1) + ' s)\n');
            if (best) { got = { roomId, best }; break; }
        }
        if (got) break;
    }
    if (!got) { console.log(site + ': no ' + S + 'x' + S + ' fits — ' + (S === S12 ? 'keeps its Δ' : 'no ' + S + '×' + S + ' arena')); continue; }
    const enc = encode(got.best.R);
    picks[site] = { room: got.roomId, ox: got.best.ox, oz: got.best.oz, base: got.best.R.floorKey || 'grass_2', open: got.best.R.open ? 1 : 0, keys: enc.keys, cells: enc.cells };
    if (enc.pits) { picks[site].pits = enc.pits; picks[site].pitTile = enc.pitTile; }
    console.log(site + ': ' + got.roomId + ' @ ' + got.best.ox + ',' + got.best.oz + ' (cover ' + got.best.cover + ', ' + (got.best.strict ? 'obstacles ' : 'walled, solid ') + got.best.out + ')');
}
console.log(Object.keys(picks).length + ' arenas of ' + sites.length + ' sites (' + S + '×' + S + ') in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');

if (DRY) process.exit(0);
if (JSON_OUT) { fs.writeFileSync(JSON_OUT, JSON.stringify(picks)); console.log('wrote ' + Object.keys(picks).length + ' picks to ' + JSON_OUT); process.exit(0); }
const src = fs.readFileSync(DATA, 'utf8');
const esc = MARK.replace(/ /g, ' ');
const re = new RegExp('(\\/\\* <' + esc + '>[\\s\\S]*?\\*\\/\\n)([\\s\\S]*?)(\\n[ \\t]*\\/\\* <\\/' + esc + '> \\*\\/)');
if (!re.test(src)) { console.error('data.js has no <' + MARK + '> markers'); process.exit(1); }
if (ONLY.length) {   // keep every other site's pick, in its place
    const old = ev('HQ_ARENA_RULES.' + PKEY) || {};
    const merged = {};
    Object.keys(old).forEach(k => { if (!ONLY.includes(k)) merged[k] = old[k]; });
    Object.keys(picks).forEach(k => { merged[k] = picks[k]; });
    Object.keys(picks).forEach(k => delete picks[k]);
    META.forEach(m => { if (merged[m.id]) picks[m.id] = merged[m.id]; });
}
const rows = Object.keys(picks).map(site => '        ' + site + ': ' + JSON.stringify(picks[site]) + ',');
const body = '    ' + PKEY + ': {\n' + rows.join('\n') + '\n    },';
fs.writeFileSync(DATA, src.replace(re, (m, a, b, c) => a + body + c));
console.log('wrote HQ_ARENA_RULES.' + PKEY + ' into data.js');
