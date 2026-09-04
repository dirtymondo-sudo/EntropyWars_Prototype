// delta-maps.test.js — headless validator for the DELTA FORGE Δ boards (data.js).
//
// Every launch map's 8×8 Δ is hand-authored (data.js "DELTA FORGE", 2026-09-01).
// This test loads data.js in the Node vm sandbox (load-data.js) and asserts the
// house rules for EVERY *_delta entry:
//   • 8×8, spawns = row 0 / row 7 × x 2..5, the shared 5-layer bed
//   • spawn rows, egress rows (1 / 6) and the centre nexus 2×2 are flat, dry,
//     object-free and never walled; exactly one nexus object at (3,3)
//   • nothing |Δh| > 1 beside a spawn tile (finishSpawns would clamp it)
//   • strict 180° symmetry: terrain, heights, voxels, objects, edge walls,
//     monument collision stamps
//   • every solid monument is a collision kind (map.js _MON_COLLISION/_MON_GRID)
//   • a jump-1 ground unit reaches every nexus tile from each spawn row, every
//     walkable tile is reachable, and NO single tile is a choke point (≥ 2
//     node-disjoint routes spawn → nexus)
//   • a minimum amount of cover per board
// Run directly for a per-board ASCII render:  node delta-maps.test.js --ascii
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const REPO = __dirname;
const { makeSandbox } = require(path.join(REPO, 'load-data.js'));

const warns = [];
const sb = makeSandbox({ quiet: true });
sb.console.warn = (...a) => warns.push(a.join(' '));
sb.console.error = (...a) => warns.push('ERROR ' + a.join(' '));
vm.runInContext(fs.readFileSync(path.join(REPO, 'data.js'), 'utf8'), sb, { filename: 'data.js' });

const { PREBUILT_MAPS, EW_MAP_META, MF_TID, MF_OID, TERRAIN_RULES, OBJECT_RULES } = vm.runInContext('({ PREBUILT_MAPS, EW_MAP_META, MF_TID, MF_OID, TERRAIN_RULES, OBJECT_RULES })', sb);
const TID2KEY = {}; Object.keys(MF_TID).forEach(k => { TID2KEY[MF_TID[k]] = k; });
const OID2KEY = {}; Object.keys(MF_OID).forEach(k => { OID2KEY[MF_OID[k]] = k; });

// mirror of map.js _MON_COLLISION / _MON_GRID
const MON_COLLISION = {
    pyramid: (dx, dy, rr) => rr - Math.max(Math.abs(dx), Math.abs(dy)),
    ziggurat: (dx, dy, rr) => rr - Math.max(Math.abs(dx), Math.abs(dy)),
    stairway: (dx, dy, rr) => dy + rr,
    obelisk: (dx, dy, rr) => (dx === 0 && dy === 0) ? 6 : 0,
    colossus: () => 1, greek: () => 1, tpillar: () => 2, monolith: () => 6,
    greytube: (dx, dy) => (dx === 0 && dy === 0) ? 6 : 0,
    blastdoor: (dx, dy) => (dy === 0) ? 6 : 0,
};
const MON_GRID = { dumpster: [2, 1, 1], greekcol: [1, 1, 2], mushroom: [1, 1, 2], mushroom2: [1, 1, 1], obelisk3d: [1, 1, 3] };

const S = 8, B = 5;
const ascii = process.argv.includes('--ascii');
const problems = [];
let failures = 0;
function fail(id, msg) { failures++; problems.push(id + ': ' + msg); if (ascii) console.log('  ✗ ' + id + ': ' + msg); }

const deltas = EW_MAP_META.filter(m => m.isDelta);
if (ascii) console.log('delta boards: ' + deltas.length);
/* 29 = one Δ per launch map; the D.O.O.R. facility boards (data.js
   EW_FACILITY_META, `facility: true`) ride the Δ roster too and obey the
   same house rules, but they have no parent full map. */
const facility = deltas.filter(m => m.facility);
if (deltas.length - facility.length !== 29) fail('roster', 'expected 29 Δ boards, got ' + (deltas.length - facility.length));
if (facility.length !== 2) fail('roster', 'expected 2 facility boards, got ' + facility.length);
if (EW_MAP_META.some(m => m.isDeltaArena)) fail('roster', 'isDeltaArena entries still exist');

const summary = [];
for (const meta of deltas) {
    const id = meta.id, d = PREBUILT_MAPS[id];
    if (!d) { fail(id, 'no PREBUILT_MAPS entry'); continue; }
    if (d.w !== S || d.h !== S) fail(id, 'size ' + d.w + '×' + d.h);
    if (meta.w !== S || meta.h !== S) fail(id, 'meta size');
    const H = d.heightMap, G = d.grid, O = d.objects, V = d.voxels, W = d.edgeWalls || {};
    const mons = d.monuments || [];

    // ── tids / voxels ──
    const usedKeys = new Set();
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const k = TID2KEY[G[y][x]];
        if (!k) fail(id, 'bad tid ' + G[y][x] + ' at ' + x + ',' + y);
        else usedKeys.add(k);
        const col = V[y][x];
        if (!col.length) { fail(id, 'empty column ' + x + ',' + y); continue; }
        const top = col[col.length - 1];
        if (top.z !== H[y][x]) fail(id, 'height/voxel mismatch at ' + x + ',' + y);
        if (top.tid !== G[y][x]) fail(id, 'grid/voxel top mismatch at ' + x + ',' + y);
        for (let i = 0; i < col.length; i++) {
            if (col[i].z !== i) fail(id, 'non-contiguous stack at ' + x + ',' + y);
            if (!TID2KEY[col[i].tid]) fail(id, 'bad voxel tid at ' + x + ',' + y);
        }
        // the shared bed
        if (H[y][x] >= B) {
            const bed = ['lava', 'cave_floor', 'cave_wall', 'dirt_4', 'dirt_3'];
            for (let z = 0; z < 5; z++) if (TID2KEY[col[z].tid] !== bed[z]) { fail(id, 'bed layer z' + z + ' at ' + x + ',' + y + ' is ' + TID2KEY[col[z].tid]); break; }
        }
        for (const e of O[y][x]) if (!OID2KEY[e.oid]) fail(id, 'bad oid ' + e.oid + ' at ' + x + ',' + y);
    }
    for (const k of usedKeys) { const r = TERRAIN_RULES[k]; if (!r) fail(id, 'no TERRAIN_RULES for ' + k); else if (r.passable === false) fail(id, 'impassable terrain ' + k); }

    // ── spawns ──
    const sp = d.spawns;
    const want1 = [2, 3, 4, 5].map(x => x + ',7').join(' '), want2 = [2, 3, 4, 5].map(x => x + ',0').join(' ');
    if (sp[1].map(p => p.x + ',' + p.y).join(' ') !== want1) fail(id, 'P1 spawns ' + JSON.stringify(sp[1]));
    if (sp[2].map(p => p.x + ',' + p.y).join(' ') !== want2) fail(id, 'P2 spawns ' + JSON.stringify(sp[2]));

    // ── protected tiles ──
    const prot = [];
    for (let x = 2; x <= 5; x++) prot.push([x, 0], [x, 1], [x, 6], [x, 7]);
    prot.push([3, 3], [4, 3], [3, 4], [4, 4]);
    const protSet = new Set(prot.map(p => p.join(',')));
    for (const [x, y] of prot) {
        if (H[y][x] !== B) fail(id, 'protected tile ' + x + ',' + y + ' height ' + H[y][x]);
        const objs = O[y][x].filter(e => !(x === 3 && y === 3 && e.oid === MF_OID.nexus));
        if (objs.length) fail(id, 'object on protected tile ' + x + ',' + y + ': ' + objs.map(e => OID2KEY[e.oid]).join());
        const k = TID2KEY[G[y][x]];
        if (['water', 'deep_water', 'lava', 'poison', 'poison_bog'].includes(k)) fail(id, 'hazard/fluid on protected tile ' + x + ',' + y);
        for (const key of [x + ',' + y + ',N', x + ',' + (y + 1) + ',N', x + ',' + y + ',W', (x + 1) + ',' + y + ',W']) if (W[key]) fail(id, 'wall on protected tile edge ' + key);
    }
    // spawn apron: nothing |Δh|>1 within one tile of a spawn
    for (const p of sp[1].concat(sp[2])) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = p.x + dx, y = p.y + dy; if (x < 0 || y < 0 || x >= S || y >= S) continue;
        if (Math.abs(H[y][x] - B) > 1) fail(id, 'apron tile ' + x + ',' + y + ' Δh ' + (H[y][x] - B));
    }
    // exactly one nexus object at (3,3)
    let nexusCount = 0;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) for (const e of O[y][x]) if (e.oid === MF_OID.nexus) { nexusCount++; if (x !== 3 || y !== 3) fail(id, 'nexus object at ' + x + ',' + y); }
    if (nexusCount !== 1) fail(id, 'nexus objects: ' + nexusCount);

    // ── symmetry ──
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const mx = S - 1 - x, my = S - 1 - y;
        // carpet / carpet_2 are the same rules, different team tint (Stadium end zones)
        const eq = (a, b) => a === b || (TID2KEY[a] || '').replace(/^carpet_2$/, 'carpet') === (TID2KEY[b] || '').replace(/^carpet_2$/, 'carpet');
        if (!eq(G[y][x], G[my][mx])) fail(id, 'terrain asymmetric at ' + x + ',' + y);
        if (H[y][x] !== H[my][mx]) fail(id, 'height asymmetric at ' + x + ',' + y);
        const a = O[y][x].filter(e => e.oid !== MF_OID.nexus).map(e => OID2KEY[e.oid] + ':' + ((e.rot || 0) % 360)).sort().join('|');
        const b = O[my][mx].filter(e => e.oid !== MF_OID.nexus).map(e => OID2KEY[e.oid] + ':' + (((e.rot || 0) + 180) % 360)).sort().join('|');
        if (a !== b) fail(id, 'objects asymmetric at ' + x + ',' + y + ' (' + a + ' vs ' + b + ')');
        const va = V[y][x].map(v => v.tid), vb = V[my][mx].map(v => v.tid);
        if (va.length !== vb.length || va.some((t, i) => !eq(t, vb[i]))) fail(id, 'voxel stack asymmetric at ' + x + ',' + y);
    }
    for (const k of Object.keys(W)) {
        const p = k.split(','), x = +p[0], y = +p[1], side = p[2];
        const mk = (side === 'N') ? ((S - 1 - x) + ',' + (S - y) + ',N') : ((S - x) + ',' + (S - 1 - y) + ',W');
        if (!W[mk]) fail(id, 'wall ' + k + ' has no mirror ' + mk);
        else if (JSON.stringify(W[k]) !== JSON.stringify(W[mk])) fail(id, 'wall ' + k + ' differs from mirror');
    }
    // monuments: odd footprints must have a twin
    for (const m of mons) {
        const g = MON_GRID[m.kind];
        if (g && (g[0] % 2 === 0 || g[1] % 2 === 0)) continue;
        const twin = mons.find(q => q !== m && q.kind === m.kind && q.x === S - 1 - m.x && q.y === S - 1 - m.y);
        if (!twin) fail(id, 'monument ' + m.kind + '@' + m.x + ',' + m.y + ' has no twin');
        if (m.solid !== false && !MON_COLLISION[m.kind] && !MON_GRID[m.kind]) fail(id, 'monument ' + m.kind + ' has no collision');
    }

    // ── effective heights (monument stamps) + blocked tiles ──
    const eff = H.map(r => r.slice());
    const monTiles = new Set();
    for (const m of mons) {
        if (m.solid === false) continue;
        const g = MON_GRID[m.kind];
        if (g) {
            const swap = (Math.round((m.rot || 0) / 90) & 1) === 1;
            const gw = swap ? g[1] : g[0], gd = swap ? g[0] : g[1], gh = g[2];
            const x0 = m.x - Math.floor((gw - 1) / 2), y0 = m.y - Math.floor((gd - 1) / 2);
            for (let y = y0; y < y0 + gd; y++) for (let x = x0; x < x0 + gw; x++) { if (x < 0 || y < 0 || x >= S || y >= S) { fail(id, 'monument box off-board ' + m.kind); continue; } eff[y][x] += gh; monTiles.add(x + ',' + y); }
            continue;
        }
        const prof = MON_COLLISION[m.kind]; if (!prof) continue;
        const F = Math.max(1, m.foot || 3), rr = Math.floor(F / 2), cap = (typeof m.maxH === 'number') ? m.maxH : 99;
        for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
            const x = m.x + dx, y = m.y + dy; if (x < 0 || y < 0 || x >= S || y >= S) continue;
            let add = prof(dx, dy, rr) | 0; if (add <= 0) continue; if (add > cap) add = cap;
            eff[y][x] += add; monTiles.add(x + ',' + y);
        }
    }
    for (const k of monTiles) if (protSet.has(k)) fail(id, 'monument collision on protected tile ' + k);
    // symmetric effective heights
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (eff[y][x] !== eff[S - 1 - y][S - 1 - x]) fail(id, 'monument stamp asymmetric at ' + x + ',' + y);

    const treeAt = (x, y) => O[y][x].some(e => { const r = OBJECT_RULES[OID2KEY[e.oid]]; return r && r.passable === false; });
    const wallBetween = (xa, ya, xb, yb) => {
        const dx = xb - xa, dy = yb - ya;
        if (dx === 1) return W[(xa + 1) + ',' + ya + ',W']; if (dx === -1) return W[xa + ',' + ya + ',W'];
        if (dy === 1) return W[xa + ',' + (ya + 1) + ',N']; if (dy === -1) return W[xa + ',' + ya + ',N'];
        return null;
    };
    // jump-1 ground unit, cardinal steps
    const stepOk = (xa, ya, xb, yb) => {
        if (treeAt(xb, yb)) return false;
        const ha = eff[ya][xa], hb = eff[yb][xb];
        if (Math.abs(ha - hb) > 1) return false;
        const w = wallBetween(xa, ya, xb, yb);
        if (w) {
            const lo = Math.min(ha, hb) + 1, hi = Math.max(ha, hb) + 2, top = w.z0 + Math.max(1, w.h || 1) - 1;
            if (top >= lo && w.z0 <= hi) { if (!(top <= Math.min(ha, hb) + 1)) return false; }   // vaultable by jump-1 only if 1 cell
        }
        return true;
    };
    const walkable = (x, y) => !treeAt(x, y);
    const reach = (srcs, banned) => {
        const seen = new Set(), q = [];
        for (const s of srcs) { const k = s[0] + ',' + s[1]; if (!banned.has(k) && walkable(s[0], s[1])) { seen.add(k); q.push(s); } }
        while (q.length) {
            const [x, y] = q.shift();
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= S || ny >= S) continue;
                const k = nx + ',' + ny; if (seen.has(k) || banned.has(k)) continue;
                if (!stepOk(x, y, nx, ny)) continue;
                seen.add(k); q.push([nx, ny]);
            }
        }
        return seen;
    };
    const nexus = ['3,3', '4,3', '3,4', '4,4'];
    for (const tm of [1, 2]) {
        const srcs = sp[tm].map(p => [p.x, p.y]);
        const base = reach(srcs, new Set());
        if (!nexus.some(k => base.has(k))) { fail(id, 'P' + tm + ' cannot reach the nexus'); continue; }
        // every nexus tile reachable
        for (const k of nexus) if (!base.has(k)) fail(id, 'P' + tm + ' cannot reach nexus tile ' + k);
        // 2 node-disjoint routes: no single cut tile
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
            const k = x + ',' + y;
            if (nexus.includes(k) || srcs.some(s => s[0] + ',' + s[1] === k)) continue;
            const r = reach(srcs, new Set([k]));
            if (!nexus.some(n => r.has(n))) fail(id, 'P' + tm + ': tile ' + k + ' is a single choke point to the nexus');
        }
        // every walkable tile reachable (no dead pockets)
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
            const k = x + ',' + y;
            if (walkable(x, y) && eff[y][x] <= B + 1 && !base.has(k)) fail(id, 'P' + tm + ': walkable tile ' + k + ' unreachable');
        }
    }

    // ── cover census ──
    let blocks = 0, steps = 0, dips = 0, trees = 0, walls = Object.keys(W).length / 2, solidMons = 0;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        if (H[y][x] >= B + 2) blocks++; else if (H[y][x] === B + 1) steps++; else if (H[y][x] < B) dips++;
        if (treeAt(x, y)) trees++;
    }
    for (const m of mons) if (m.solid !== false) solidMons++;
    const cover = blocks + steps + trees + walls + solidMons;
    /* the Training Room is an empty lit grid by design (the reference render;
       ORIENTATION plays on it) — facility boards skip the cover minimum only */
    if (cover < 4 && !meta.facility) fail(id, 'too little cover (' + cover + ')');
    summary.push({ id, blocks, steps, dips, trees, walls, mons: solidMons });

    if (ascii) {
        console.log('\n' + meta.label + '  (' + id + ')');
        for (let y = 0; y < S; y++) {
            let row = '  ';
            for (let x = 0; x < S; x++) {
                const k = x + ',' + y;
                let c = '.';
                const key = TID2KEY[G[y][x]];
                if (['water', 'deep_water', 'lava'].includes(key)) c = key === 'lava' ? '≈' : '~';
                else if (H[y][x] < B) c = 'v';
                if (H[y][x] === B + 1) c = '^';
                if (H[y][x] >= B + 2) c = '#';
                if (monTiles.has(k)) c = eff[y][x] - H[y][x] >= 2 ? 'P' : 'p';
                if (treeAt(x, y)) c = 'T';
                if (O[y][x].some(e => e.oid === MF_OID.nexus)) c = 'N';
                if (protSet.has(k) && c === '.') c = (y === 0 || y === 7) ? 'S' : (y === 1 || y === 6 ? ':' : 'n');
                const wW = W[x + ',' + y + ',W'] ? (W[x + ',' + y + ',W'].see ? '¦' : '|') : ' ';
                row += wW + c;
            }
            console.log(row);
            let under = '  ';
            for (let x = 0; x < S; x++) { const w = W[x + ',' + (y + 1) + ',N']; under += ' ' + (w ? (w.see ? '·' : '‾') : ' '); }
            if (y < S - 1 && under.trim()) console.log(under);
        }
    }
}
const forgeWarns = warns.filter(w => w.indexOf('[DeltaForge]') >= 0 || w.indexOf('[MapForge]') >= 0);
for (const w of forgeWarns) fail('forge', w);

if (ascii) {
    console.log('\ncover census (blocks/steps/dips/trees/walls/mons):');
    for (const s of summary) console.log('  ' + s.id.padEnd(32) + [s.blocks, s.steps, s.dips, s.trees, s.walls, s.mons].join('/'));
    console.log(failures ? '\nFAILED: ' + failures + ' problem(s)' : '\nALL DELTA CHECKS PASSED');
    process.exit(failures ? 1 : 0);
}

const test = require('node:test');
const assert = require('node:assert');
test('every Δ board obeys the DELTA FORGE house rules', () => {
    assert.deepStrictEqual(problems, [], problems.join('\n'));
});
test('the Δ roster is exactly one 8×8 board per launch map, plus the facility boards', () => {
    const fulls = EW_MAP_META.filter(m => !m.isDelta);
    assert.strictEqual(deltas.length - facility.length, fulls.length);
    for (const f of fulls) assert.ok(PREBUILT_MAPS[f.id + '_delta'], f.id + ' has no Δ');
    for (const f of facility) assert.ok(f.isDelta && !PREBUILT_MAPS[f.id + '_delta'] && PREBUILT_MAPS[f.id], f.id + ' must be a standalone Δ-flagged board');
});
