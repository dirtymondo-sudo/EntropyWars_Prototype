// land-edge.test.js — THE EDGE OF THE WORLD (WORLD_GEOGRAPHY_PLAN.md §7 G8, 2026-09-29).
//
// R4: the Deep surrounds the land and the ice wall surrounds the Deep; the wall is the only border and the skiff reaches it
// everywhere (on the open-sea bearings it sails to the wall's foot; north it lands on the pack, south on the shelf's landing,
// and the feet go on to the wall). Bakes data.js HQ_LAND at 8 m (about 12 s) and reads bake-land.js edgeReach, the same flood
// the tool's exit code reads. Then the four edge sites on the land: the Bermuda Triangle (the cay, the whirlpool) and the
// Dutchman out in the Deep on their banks, the station on the ice shelf, the Pole's village on the pack.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { bake, checkRules, edgeReach } = require('./bake-land.js');
const { loadGameData } = require('./load-data.js');

let B8 = null, E8 = null;
const baked8 = () => (B8 = B8 || bake({ cell: 8, quiet: true }));
const edge8 = () => (E8 = E8 || edgeReach(baked8()));

test('R4 holds on the 8 m bake: the wall has no gap, nothing gets past it, it is reached on every bearing', () => {
    const E = edge8();
    assert.deepStrictEqual(E.gaps, [], 'every half-degree of bearing has the wall\'s face at full height');
    assert.strictEqual(E.past, null, 'nothing the skiff or the feet reach lies past the wall');
    assert.deepStrictEqual(E.unreached, [], 'the wall\'s foot is reached on every bearing');
    assert.deepStrictEqual(E.lost, [], 'the cay, the Dutchman, the station and the Pole are reached');
    assert.deepStrictEqual(checkRules(baked8()).filter(b => b.rule === 'R4'), [], 'checkRules carries R4');
});

test('the skiff sails to the wall on the open sea; the pack (north) and the shelf (south) are walked to it', () => {
    const B = baked8(), E = edge8(), { N, NN, X, Z, wallR, ICE } = B;
    const BINS = 72, kind = new Array(BINS).fill(0), far = new Float32Array(BINS).fill(-1);   // 5° bins: what the outermost reached cell is
    for (let c = 0; c < NN; c++) { if (!E.seen[c]) continue; const x = X(c % N), z = Z((c / N) | 0), r = Math.hypot(x, z);
        const b = Math.floor(((Math.atan2(x, z) / (2 * Math.PI)) + 1) % 1 * BINS) % BINS; if (r > far[b]) { far[b] = r; kind[b] = E.seen[c] === 1 ? 'sail' : (ICE[c] === 2 ? 'pack' : ICE[c] === 1 ? 'shelf' : 'land'); } }
    const sail = kind.filter(k => k === 'sail').length;
    assert.ok(sail >= BINS * 0.55, `the skiff sails to the wall's foot on ${sail} of ${BINS} bearings`);
    const at = deg => kind[Math.floor(deg / 360 * BINS) % BINS];
    for (const deg of [90, 270]) assert.strictEqual(at(deg), 'sail', `east and west (${deg}°) the Deep runs to the wall`);
    // due north (atan2(x, z) 180° = −z) the feet reach the wall's foot over the pack (the leads may let the skiff in too); due south, over the shelf
    const walkedTo = (deg, ice) => { for (let r = 1800; r < 2800; r += 4) { const x = Math.sin(deg * Math.PI / 180) * r, z = Math.cos(deg * Math.PI / 180) * r, c = B.cellAt(x, z);
        if (r > wallR(x, z) - 40 && r < wallR(x, z) && E.seen[c] === 2 && ICE[c] === ice) return true; } return false; };
    assert.ok(walkedTo(180, 2), 'due north the pack is walked to the wall');
    assert.ok(walkedTo(0, 1), 'due south the shelf is walked to the wall');
    // the wall itself: 92 m of ice, and its top (the Flat Lands, fork 5) is seen, not reached
    const P = Object.fromEntries(B.overlay.places.map(p => [p.id, p]));
    const fl = P.flatlands; assert.ok(fl && fl.y > 80, `the Flat Lands stand on the wall (${fl && fl.y} m)`);
    assert.ok(!E.seen[B.cellAt(fl.at[0], fl.at[1])], 'nobody reaches the Flat Lands yet (fork 5\'s default)');
    assert.ok(wallR(0, 2500) < wallR(2500, 0), 'the wall is pulled in at the south, where the shelf is widest');
});

test('the ice underfoot: the pack floats a floe over the sea, the fast ice runs from the North Pass to the Pole, the landing climbs out of the water', () => {
    const B = baked8(), E = edge8(), R = B.R, g = (x, z) => B.sampleG(B.H, x, z);
    const FA = R.arctic.fast.pts;
    for (const [x, z] of FA.slice(1)) { const c = B.cellAt(x, z); assert.strictEqual(B.ICE[c], 2, `fast ice at (${x}, ${z})`); assert.ok(g(x, z) > 0.2 && g(x, z) < 1.6, `a floe's freeboard at (${x}, ${z}): ${g(x, z).toFixed(2)}`); assert.ok(E.seen[c] === 2, `walked at (${x}, ${z})`); }
    const pass = (vm.runInContext('HQ_LAND', loadGameData()).roads || []).find(r => r.id === 'north_pass');
    assert.ok(pass && Math.hypot(pass.pts[pass.pts.length - 1][0] - FA[0][0], pass.pts[pass.pts.length - 1][1] - FA[0][1]) < 30, 'the fast ice starts where the North Pass comes down');
    const L = R.wall.shelf.landing.pts; let lo = 1e9, hi = -1e9;
    for (let k = 0; k <= 40; k++) { const t = k / 40, x = L[0][0] + (L[L.length - 1][0] - L[0][0]) * t, z = L[0][1] + (L[L.length - 1][1] - L[0][1]) * t, h = g(x, z); if (B.ICE[B.cellAt(x, z)] === 1) { lo = Math.min(lo, h); hi = Math.max(hi, h); } }
    assert.ok(lo < -0.5 && hi > R.wall.shelf.h - 0.5, `the landing runs from under the water (${lo.toFixed(1)}) to the shelf (${hi.toFixed(1)})`);
});

test('the edge sites stand on the land at their places; the sea sites\' water is the sea and their banks are their floors', () => {
    const D = loadGameData(), W = vm.runInContext('HQ_WORLD', D), HQ = D.DOOR_HQ, Z = W.zones.land;
    const want = { site_prebuilt_bermuda_sea: 'cay', site_prebuilt_revenge_deck: 'dutchman', site_prebuilt_antarctica_station: 'station', site_prebuilt_northpole_village: 'pole' };
    for (const [id, place] of Object.entries(want)) {
        const P = Z.parts[id]; assert.ok(P && P.place === place, `${id} stands on ${place}`);
        assert.ok(Z.joins.some(j => j.a === 'land' && j.b === id && j.kind === 'island'), `${id} is an island on the land`);
    }
    for (const id of ['site_prebuilt_bermuda_sea', 'site_prebuilt_revenge_deck']) {
        const P = Z.parts[id], T = HQ.rooms[id].terrain, j = Z.joins.find(q => q.b === id);
        assert.ok(P.sea && T.sea, `${id} is a sea site`);
        assert.ok(Math.abs(P.y + T.sea.y) < 1e-6, `${id}'s water stands at the sea's surface (${P.y} + ${T.sea.y})`);
        assert.ok(Math.abs(P.bank - (P.y + (T.base || 0))) < 1e-6 && j.y === P.bank, `${id}'s bank is its floor (${P.bank})`);
    }
    // the whirlpool is the Triangle's maelstrom: the place stands where the part's way down stands
    const link = HQ.links.find(l => l.id === 'bermuda_abyss'), wp = vm.runInContext('HQ_LAND', D).places.find(p => p.id === 'whirlpool'), F = D.hqWorldFrame('site_prebuilt_bermuda_sea');
    assert.ok(Math.hypot(F.x + link.a.x - wp.at[0], F.z + link.a.z - wp.at[1]) < 1, 'the whirlpool place is the maelstrom');
    // the cay: the part's cay stands on the cay's place
    const cay = HQ.rooms.site_prebuilt_bermuda_sea.terrain.features.find(f => f.k === 'plateau'), cp = vm.runInContext('HQ_LAND', D).places.find(p => p.id === 'cay');
    assert.ok(Math.hypot(F.x + cay.x - cp.at[0], F.z + cay.z - cp.at[1]) < 1, 'the cay is on its place');
    // the station and the Pole on their ice (the bake's 8 m heights under their boxes)
    const B = baked8();
    for (const [pl, id] of [['station', 'site_prebuilt_antarctica_station'], ['pole', 'site_prebuilt_northpole_village']]) {
        const r = D.hqWorldPartRect(id), h = B.sampleG(B.H, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2), c = B.cellAt((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2);
        assert.ok(Math.abs(h - Z.parts[id].y) < 0.3, `${id} stands on its pad (${h.toFixed(2)} vs ${Z.parts[id].y})`);
        assert.strictEqual(B.ICE[c], pl === 'station' ? 1 : 2, `${id} stands on ${pl === 'station' ? 'the shelf' : 'the pack'}`);
    }
    assert.ok(D.hqWorldValidate().ok, 'the world validates');
});

test('the renderer wears ice on an ice face, not the rock cliff', () => {
    const TR = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
    assert.match(TR, /function _hqLandIceMats\(\)/, 'the ice materials by code');
    assert.match(TR, /land\[v \* 2\] = icy \? -cw : cw;/, 'a chunk marks an ice face with a negative cliff weight');
    assert.match(TR, /float CL = vLand\.x < 0\.0 \? uIceL : uCliffL;/, 'the splat reads the ice sheet side-on there');
    assert.match(TR, /var cw = iceM\[W\.mat\[o\]\] \? 0 :/, 'the far land keeps the wall white');
});
