'use strict';
/* THE WALL AUDIT (WORLD_GEOGRAPHY_PLAN.md R3 + §5.9, G6 — 2026-09-28): NO INVISIBLE WALLS on the land's sites.
   Every site part standing on THE LAND (HQ_WORLD.zones.land) is walked on its own field: from every walkable node, every
   step to a neighbour (0.5 m) the walker's rule refuses (hqTerrainFeet → null) must have something DRAWN within 0.45 m —
   a wall that is not a ghost, a city block's mass, a sheet of water or lava, a face steeper than the walker climbs (drawn
   with the cliff sheet), a bridge's slab. The field's own edge band is left out: on the land every side of an island is a
   join onto the land (the stage crosses the walker over it). Heavy (it compiles every site's field). */
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const { heavy } = require('./test-heavy');
const D = loadGameData(), HQ = D.DOOR_HQ;
const W = vm.runInContext('HQ_WORLD', D);
const STEP = 0.5, NEAR = 0.45, EDGE = 1.0;

test('the land zone names its sites; each one a terrain part on its place', () => {
    const Z = W.zones.land;
    assert.ok(Z && Z.parts.land, 'the land zone');
    const ids = Object.keys(Z.parts).filter(id => id !== 'land');
    assert.ok(ids.length >= 20, 'the sites on the land (' + ids.length + ')');
    for (const id of ids) assert.ok(HQ.rooms[id], id + ' is a room');
});

test('R3 on every site of the land: a refused step always has something drawn within 0.45 m', heavy, () => {
    const Z = W.zones.land, bad = [];
    for (const id of Object.keys(Z.parts)) {
        const room = HQ.rooms[id]; if (id === 'land' || !room || !room.terrain) continue;
        const info = D.hqTerrainInfo(id); if (!info) continue;
        const R = info.rules, hw = info.halfW - EDGE, hd = info.halfD - EDGE;
        const drawn = (x, z) => {
            if (D.hqTerrainSolidAt(info, x, z, NEAR)) return true;
            const w = D.hqTerrainWallAt(info, x, z, R.bodyR + NEAR); if (w && !w.ghost) return true;
            for (const [dx, dz] of [[0, 0], [NEAR, 0], [-NEAR, 0], [0, NEAR], [0, -NEAR]]) {
                if (D.hqTerrainFluidAt(info, x + dx, z + dz)) return true;
                if (D.hqTerrainSlope(info, x + dx, z + dz) > R.maxSlope * 0.95) return true;
            }
            if (info.bridges && info.bridges.length && D.hqTerrainBridgesAt(info, x, z, R.bodyR + NEAR).length) return true;
            return false;
        };
        let refused = 0, n = 0;
        for (let z = -hd; z <= hd; z += STEP) for (let x = -hw; x <= hw; x += STEP) {
            const y = D.hqTerrainFeet(info, x, z, null); if (y == null) continue;
            for (const [dx, dz] of [[STEP, 0], [0, STEP], [-STEP, 0], [0, -STEP]]) {
                const nx = x + dx, nz = z + dz;
                if (Math.abs(nx) > hw || Math.abs(nz) > hd) continue;
                if (D.hqTerrainFeet(info, nx, nz, y) != null) continue;
                refused++;
                if (!drawn(nx, nz)) { n++; if (n <= 3) bad.push(id + ' @ ' + nx.toFixed(1) + ', ' + nz.toFixed(1)); }
            }
        }
        if (n > 3) bad.push(id + ': ' + n + ' refused steps with nothing drawn (of ' + refused + ')');
    }
    assert.deepEqual(bad, [], 'invisible walls:\n' + bad.join('\n'));
});
