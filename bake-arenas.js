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
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');

const DRY = process.argv.includes('--dry-run');
const DATA = path.join(__dirname, 'data.js');

const sb = loadGameData({ quiet: true });
const ev = (s) => vm.runInContext(s, sb);
const META = ev('EW_MAP_META');
const ROOMS = ev('DOOR_HQ.rooms');
const ENTRY = ev('(DOOR_HQ.siteRooms || {}).entry || {}');
const S = ev('HQ_ARENA_RULES.size');
const OBST = ev('HQ_ARENA_RULES.obstacles');
const FEAT = ev('HQ_ARENA_RULES.featureMax');
const WALLS = ev('HQ_ARENA_RULES.wallMax'), TOP = ev('HQ_ARENA_RULES.topMax');

const KEEP = new Set(ev('HQ_ARENA_RULES.keep') || []);   // the sites that keep their Δ board (no pick written)
const ONLY = process.argv.filter(a => /^prebuilt_/.test(a));   // name sites to bake only them (the rest of the picks stand)
const sites = META.filter(m => !m.isDelta && !m.facility && !m.area && !KEEP.has(m.id) && (!ONLY.length || ONLY.includes(m.id))).map(m => m.id);
const bySite = {};
for (const id of Object.keys(ROOMS)) {
    const r = ROOMS[id];
    if (!r || !r.site) continue;
    const s = sb.hqRoomSite(id);
    if (s) (bySite[s] = bySite[s] || []).push(id);
}

const HX = sb.hqArenaHouse(S);
const HOUSE = [];
for (let x = HX.x0; x <= HX.x1; x++) HOUSE.push([x, 0], [x, 1], [x, S - 2], [x, S - 1]);
HOUSE.push([HX.n, HX.n], [HX.n + 1, HX.n], [HX.n, HX.n + 1], [HX.n + 1, HX.n + 1]);
const houseSet = new Set(HOUSE.map(p => p[0] + ',' + p[1]));
const APRON = [];
for (const row of [0, S - 1]) for (let x = HX.x0 - 1; x <= HX.x1 + 1; x++) for (let dy = -1; dy <= 1; dy++) { const y = row + dy; if (y >= 0 && y < S) APRON.push([x, y]); }

function marker(roomId) {
    const r = ROOMS[roomId] || {};
    const m = (r.counters || []).find(c => c && (c.id === 'battle' || c.proc === 'battle_marker') && typeof c.x === 'number');
    return m ? { x: m.x, z: +m.z || 0 } : { x: 0, z: 0 };
}

/* the room's FEATURES: every blocked lattice patch of at most FEAT cells that touches no edge of the lattice */
function features(Lt) {
    const feat = new Set(), seen = new Set();
    for (let gy = 0; gy < Lt.h; gy++) for (let gx = 0; gx < Lt.w; gx++) {
        const k0 = gx + ',' + gy;
        if (seen.has(k0) || Lt.walk(gx, gy)) continue;
        const comp = [], q = [[gx, gy]]; seen.add(k0); let edge = false;
        while (q.length) {
            const [x, y] = q.pop(); comp.push(x + ',' + y);
            if (x === 0 || y === 0 || x === Lt.w - 1 || y === Lt.h - 1) edge = true;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
                if (nx < 0 || ny < 0 || nx >= Lt.w || ny >= Lt.h || seen.has(k) || Lt.walk(nx, ny)) continue;
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
        if (!open) { if (houseSet.has(x + ',' + y) || ++out > cap) return null; }
        else { inN++; if ((c.tile | 0) > hi) return null; }
        if ((!open || (c.tile | 0) > 0) && !houseSet.has(x + ',' + y)) { cover++; if (y < S / 2) top++; else bottom++; }
    }
    for (const [x, y] of HOUSE) { const c = R.cells[y][x]; if ((c.tile | 0) !== 0 || c.seat === false || c.fluid || c.prop || c.wall || c.bridge) return null; }
    for (const [x, y] of APRON) { const c = R.cells[y][x]; if (c.in && !c.rock && !c.hazard && (c.tile | 0) > 1) return null; }
    const a = sb.hqFieldReach(R, HX.n, 0), b = sb.hqFieldReach(R, HX.n, S - 1);
    if (strict) { if (a.size < inN || b.size < inN) return null; }
    else {
        if (!a.has(HX.n + ',' + (S - 1))) return null;   // the two spawn rows are joined
        out += inN - a.size; if (out > cap) return null;   // a pocket nobody reaches counts as a wall
    }
    return { cover, out, imbalance: Math.abs(top - bottom), strict };
}

function scanRoom(roomId, strict) {
    if (!sb.hqFieldRoomOk(roomId)) return null;
    const Lt = sb.hqFieldLattice(roomId);
    if (!Lt || Lt.w < S || Lt.h < S) return null;
    const mk = marker(roomId), feat = features(Lt);
    let best = null, clear = 0;
    for (let oz = 0; oz + S <= Lt.h; oz++) for (let ox = 0; ox + S <= Lt.w; ox++) {
        let off = 0;
        if (strict) {
            for (let y = 0; y < S && off <= OBST; y++) for (let x = 0; x < S; x++) if (!Lt.walk(ox + x, oz + y)) { off += (houseSet.has(x + ',' + y) || !feat.has((ox + x) + ',' + (oz + y))) ? OBST + 1 : 1; if (off > OBST) break; }
            if (off > OBST) continue;
        } else {
            for (let y = 0; y < S && off <= WALLS; y++) for (let x = 0; x < S; x++) if (!Lt.walk(ox + x, oz + y)) { off += houseSet.has(x + ',' + y) ? WALLS + 1 : 1; if (off > WALLS) break; }
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
    return { keys, cells: cells.join('') };
}

const picks = {};
const t0 = Date.now();
for (const site of sites) {
    const rooms = (bySite[site] || []).slice();
    const ent = ENTRY[site] && ENTRY[site].room;
    const size = (id) => { const sh = (ROOMS[id] || {}).shell || {}; return (+sh.w || 0) * (+sh.d || 0); };
    const order = (ent && rooms.includes(ent) ? [ent] : []).concat(rooms.filter(r => r !== ent).sort((a, b) => size(b) - size(a)));
    let got = null;
    for (const strict of [true, false]) {   // an open-ground window in any room first, then the walled cut
        for (const roomId of order) {
            const t = Date.now();
            const best = scanRoom(roomId, strict);
            process.stderr.write('  ' + site + ' · ' + roomId + (strict ? '' : ' (walled)') + ': ' + (best ? best.clear + ' fit, pick ' + best.ox + ',' + best.oz + ' cover ' + best.cover + ' solid ' + best.out + ' ' + best.dist.toFixed(1) + ' m from the marker' : 'no ' + S + 'x' + S + ' fits') + ' (' + ((Date.now() - t) / 1000).toFixed(1) + ' s)\n');
            if (best) { got = { roomId, best }; break; }
        }
        if (got) break;
    }
    if (!got) { console.log(site + ': no ' + S + 'x' + S + ' fits — keeps its Δ'); continue; }
    const enc = encode(got.best.R);
    picks[site] = { room: got.roomId, ox: got.best.ox, oz: got.best.oz, base: got.best.R.floorKey || 'grass_2', open: got.best.R.open ? 1 : 0, keys: enc.keys, cells: enc.cells };
    console.log(site + ': ' + got.roomId + ' @ ' + got.best.ox + ',' + got.best.oz + ' (cover ' + got.best.cover + ', ' + (got.best.strict ? 'obstacles ' : 'walled, solid ') + got.best.out + ')');
}
console.log(Object.keys(picks).length + ' arenas of ' + sites.length + ' sites in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');

if (DRY) process.exit(0);
const src = fs.readFileSync(DATA, 'utf8');
const re = /(\/\* <ARENA PICKS>[\s\S]*?\*\/\n)([\s\S]*?)(\n[ \t]*\/\* <\/ARENA PICKS> \*\/)/;
if (!re.test(src)) { console.error('data.js has no <ARENA PICKS> markers'); process.exit(1); }
if (ONLY.length) {   // keep every other site's pick, in its place
    const old = ev('HQ_ARENA_RULES.picks') || {};
    const merged = {};
    Object.keys(old).forEach(k => { if (!ONLY.includes(k)) merged[k] = old[k]; });
    Object.keys(picks).forEach(k => { merged[k] = picks[k]; });
    Object.keys(picks).forEach(k => delete picks[k]);
    META.forEach(m => { if (merged[m.id]) picks[m.id] = merged[m.id]; });
}
const rows = Object.keys(picks).map(site => '        ' + site + ': ' + JSON.stringify(picks[site]) + ',');
const body = '    picks: {\n' + rows.join('\n') + '\n    },';
fs.writeFileSync(DATA, src.replace(re, (m, a, b, c) => a + body + c));
console.log('wrote HQ_ARENA_RULES.picks into data.js');
