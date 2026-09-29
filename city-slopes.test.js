'use strict';
/* THE CITY ON THE HILL (WORLD_GEOGRAPHY_PLAN.md §5.8 + R8, G7 — 2026-09-29). Downtown stands on the land turned a quarter, its ground
   climbing from the quay at the bay to the old town, and the Bowl and the harbour stand on the land beside it. R8: every district
   has a street steeper than 6 % and a stair street or a ramp, no district is flat, and a street is graded to at most 12 % except
   where it is a stair. The alleys and the gaps (R3: a refused step always has something drawn) are wall-audit.test.js's, which
   walks Downtown now that it is on the land. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const W = vm.runInContext('HQ_WORLD', D);
const DT = 'site_prebuilt_downtown_streets', HARB = 'site_prebuilt_downtown_harbour', BOWL = 'site_prebuilt_stadium_bowl';
const MAX = 0.12, STEEP = 0.06;

let INFO = null;
const info = () => INFO || (INFO = D.hqTerrainInfo(DT));
const room = HQ.rooms[DT], gen = room.terrain.gen;
const stairs = room.terrain.features.filter(f => f.k === 'ramp');
const inRamp = (x, z) => stairs.some(f => {
    const dx = f.x1 - f.x0, dz = f.z1 - f.z0, L2 = dx * dx + dz * dz, u = ((x - f.x0) * dx + (z - f.z0) * dz) / L2;
    return u >= -0.05 && u <= 1.05 && Math.hypot(x - f.x0 - dx * u, z - f.z0 - dz * u) <= f.w / 2;
});
const inPool = (x, z) => room.terrain.features.some(f => f.k === 'pool' && Math.hypot((x - f.x) / f.r, (z - f.z) / (f.rz || f.r)) < 1.6);
/* a street crossing water walks its bridge's slab or the canal's decks (a kerb step up), and the field's last 8 m ease onto the land
   (the stitch): none of them is graded here */
const decks = room.terrain.features.filter(f => f.k === 'deck');
const offGrade = (x, z) => { const I = info();
    if (Math.abs(x) > I.halfW - 8 || Math.abs(z) > I.halfD - 8) return true;
    if (decks.some(f => Math.abs(x - f.x0) <= f.w / 2 + 1 && z >= Math.min(f.z0, f.z1) - 1 && z <= Math.max(f.z0, f.z1) + 1)) return true;
    if (I.bridges && I.bridges.length && D.hqTerrainBridgesAt(I, x, z, 1).length) return true;
    return [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]].some(([dx, dz]) => D.hqTerrainFluidAt(I, x + dx, z + dz)); };
/* every street's centre line at 1 m: [{ x, z, y }] runs */
function streetRuns() {
    return gen.streets.map(st => {
        const out = [], P = st.pts.concat(st.loop ? [st.pts[0]] : []);
        for (let k = 1; k < P.length; k++) {
            const [ax, az] = P[k - 1], [bx, bz] = P[k], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L));
            for (let i = (k === 1 ? 0 : 1); i <= n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n; out.push({ x, z, y: D.hqTerrainHeight(info(), x, z) }); }
        }
        return out;
    });
}

test('Disaster City stands on the land: Downtown turned to the bay on its slope, the harbour east of its quay, the Bowl on its pad', () => {
    assert.ok(!W.zones.city && !W.zones.coast, 'the stitched city and coast zones are retired');
    const Z = W.zones.land;
    for (const id of [DT, HARB, BOWL]) assert.ok(Z.parts[id] && Z.parts[id].place, id + ' stands on its place');
    const F = D.hqWorldFrame(DT), Fh = D.hqWorldFrame(HARB);
    assert.equal(F.rot, 1, 'Downtown is turned a quarter (the docks face the bay)');
    assert.equal(F.ground, 'land');
    assert.ok(room.terrain.slope && room.terrain.slope.pts.length >= 4, 'Downtown carries a slope');
    /* the harbour's sea is the land's (0 m): its frame over its own sea level */
    assert.ok(Math.abs(Fh.y + HQ.rooms[HARB].terrain.sea.y) < 1e-6, 'the harbour\'s water stands at the land\'s sea level');
    const rD = D.hqWorldPartRect(DT), rH = D.hqWorldPartRect(HARB);
    assert.ok(Math.abs(rD.x1 - rH.x0) < 0.01, 'the harbour begins at Downtown\'s quay');
    assert.ok(W.zones.land.joins.some(j => j.kind === 'shore' && j.a === DT && j.b === HARB), 'the quay is a shore join');
    const S = D.hqLandSites().find(s => s.place === 'harbour');
    assert.ok(S && S.sea, 'the bake leaves the bay\'s floor under the harbour');
});

test('R8: every district has a street steeper than 6 %, a stair street or a ramp, and is not flat', () => {
    const runs = streetRuns(), bad = [];
    for (const d of gen.districts) {
        const [x0, z0, x1, z1] = d.rect, inD = p => p.x >= x0 && p.x <= x1 && p.z >= z0 && p.z <= z1;
        let steep = 0, lo = Infinity, hi = -Infinity;
        for (const run of runs) for (let i = 1; i < run.length; i++) {
            const a = run[i - 1], b = run[i]; if (!inD(a) || !inD(b)) continue;
            lo = Math.min(lo, b.y); hi = Math.max(hi, b.y);
            if (inPool(a.x, a.z) || inPool(b.x, b.z)) continue;
            const g = Math.abs(b.y - a.y) / Math.hypot(b.x - a.x, b.z - a.z); if (g > steep) steep = g;
        }
        const ramp = stairs.some(f => [[f.x0, f.z0], [f.x1, f.z1]].some(([x, z]) => x >= x0 && x <= x1 && z >= z0 && z <= z1));
        if (!(steep > STEEP)) bad.push(d.id + ': steepest street ' + steep.toFixed(3));
        if (!ramp) bad.push(d.id + ': no stair street or ramp');
        if (!(hi - lo > 1)) bad.push(d.id + ': flat (' + (hi - lo).toFixed(2) + ' m)');
    }
    assert.deepEqual(bad, []);
});

test('R8: the streets are graded to at most 12 % — steeper only on a stair street', () => {
    const bad = [];
    for (const run of streetRuns()) for (let i = 1; i < run.length; i++) {
        const a = run[i - 1], b = run[i];
        if (inPool(a.x, a.z) || inPool(b.x, b.z) || inRamp(a.x, a.z) || inRamp(b.x, b.z) || offGrade(a.x, a.z) || offGrade(b.x, b.z)) continue;
        const g = Math.abs(b.y - a.y) / Math.hypot(b.x - a.x, b.z - a.z);
        if (g > MAX + 0.015) bad.push(`${a.x.toFixed(0)},${a.z.toFixed(0)} ${(g * 100).toFixed(1)} %`);
    }
    assert.deepEqual(bad.slice(0, 8), [], bad.length + ' steep samples');
});

test('the city climbs: the old town stands well over the quay, and the stair streets are walked end to end', () => {
    const I = info(), quay = D.hqTerrainHeight(I, 0, 80), top = D.hqTerrainHeight(I, 0, -86);
    assert.ok(top - quay > 12, 'the avenue climbs ' + (top - quay).toFixed(1) + ' m');
    for (const f of stairs.filter(r => r.stairs && r.w >= 11)) {
        let y = D.hqTerrainFeet(I, f.x0, f.z0 + 2, null); assert.ok(y != null, 'the foot of the steps at x ' + f.x0);
        for (let t = 0; t <= 1; t += 0.02) { const z = f.z0 + 2 + (f.z1 - 3 - f.z0) * t, ny = D.hqTerrainFeet(I, f.x0, z, y); assert.ok(ny != null, `the steps at x ${f.x0} refuse at z ${z.toFixed(1)}`); y = ny; }
    }
    /* the level things stay level on the slope: the canal, the fountain's pool */
    const canal = I.fluids.find(fl => fl.kind === 'stream');
    assert.ok(canal && Math.abs(canal.y - (1.19 + 0)) < 0.2, 'the canal stands on its terrace');
});

test('the land under Downtown follows its slope; its edges ease to it', () => {
    const S = D.hqLandSites().find(s => s.place === 'downtown');
    assert.ok(S && S.slope, 'Downtown is a sloped site');
    const F = D.hqWorldFrame(DT);
    const quay = D.hqLandSiteY(S, S.x1 + 2, (S.z0 + S.z1) / 2), old = D.hqLandSiteY(S, S.x0 - 2, (S.z0 + S.z1) / 2);
    assert.ok(Math.abs(quay - F.y) < 0.05, 'the land meets the quay at its level (' + quay + ')');
    assert.ok(old - quay > 12, 'the land meets the old town up the hill (' + old + ')');
    const rows = D.hqTerrainStitchRows(DT).filter(r => r.island);
    assert.deepEqual([...new Set(rows.map(r => r.side))].sort(), ['e', 'n', 's', 'w'], 'the island eases on four sides');
    assert.ok(!rows.some(r => r.side === 's' && r.t0 < 99 && r.t1 > -99), 'but not under the quay\'s join to the harbour');
    const n = rows.find(r => r.side === 'n'), s = rows.find(r => r.side === 's');
    assert.ok(n.yAt(0) - s.yAt(s.t0) > 12, 'the north (old town) edge eases higher than the south (quay) edge');
});

test('the renderer carries the land turned and the lots on plinths', () => {
    const src = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
    assert.match(src, /function _hqLandToScene\(L, x, z\)/, 'the land\'s frame is a shift and a turn');
    assert.match(src, /uniform vec2 uLandR;/, 'the shaders turn their point back into the land\'s metres');
    assert.match(src, /L\.group\.rotation\.y = ry/, 'the land group wears the turn');
    assert.match(src, /hq_city_plinths/, 'a terraced lot stands on a plinth');
    assert.match(src, /else if \(info\.slope\) \{ car\.g\.rotation\.order/, 'a city car pitches with the slope');
});

test('the mall stands on its own pad behind the beach; the lighthouse on the bay\'s head', () => {
    const L = HQ.rooms.land;
    const d = L.doors.find(x => x.id === 'mall');
    assert.ok(d && d.pad === 'mall' && d.action.room === 'site_prebuilt_downtown_mall', 'the land\'s mall door');
    const back = HQ.rooms.site_prebuilt_downtown_mall.doors.find(x => x.id === 'street');
    assert.deepEqual([back.action.room, back.action.at], ['land', 'mall']);
    assert.ok(!room.doors.some(x => x.id === 'mall'), 'Downtown has no mall door any more');
    assert.ok((L.props || []).some(p => p.key === 'lighthouse' && p.place === 'lighthouse'), 'the lighthouse on its head');
});
