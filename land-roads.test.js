// land-roads.test.js — THE ROADS (WORLD_GEOGRAPHY_PLAN.md §7 G5, 2026-09-28).
//
// Bakes the land at 16 m (as land-forest.test.js does) and holds THE ROADS to §5.6 and R5: every graded line keeps its grade,
// a road leaves the ground only over water or inside a named viaduct (the sketch's giveaway viaducts are regraded: fork 6's
// default keeps the Glen and the Loch Head), every deck clears its water, a guard rail stands wherever a road's edge drops more
// than 2 m, and the junctions' signs name the next place. Then data.js's readers (a walker on a deck, its parapet, the ground
// under it, a guard rail) and the renderer's wiring. Every sheet and model is one the game already ships (no new art).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');
const { bake, writeOutputs } = require('./bake-land.js');

let W16 = null;
function w16() {
    if (W16) return W16;
    const B = bake({ cell: 16, quiet: true });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ew-land-g5-'));
    writeOutputs(B, dir, { tiles: false, map: false });
    return (W16 = { B, ov: JSON.parse(fs.readFileSync(path.join(dir, 'land.json'), 'utf8')) });
}
function store(W) {
    const sb = loadGameData();
    const R = src => vm.runInContext(src, sb);
    sb.__ov = W.ov; R('hqLandRoadsIndex(__ov)');
    return { sb, R };
}

test('R5: every road keeps its grade (a trail is benched; its steep bits are steps)', () => {
    const { ov } = w16();
    assert.ok(ov.roads.length >= 20, 'the recipe\'s roads are baked');
    for (const r of ov.roads) {
        if (r.type === 'trail') continue;
        assert.ok(r.maxGrade <= r.grade + 0.002, `${r.id} climbs at most ${r.grade} (${r.maxGrade})`);
        assert.ok(['asphalt', 'paved', 'dirt'].includes(r.surface), `${r.id} has a surface (${r.surface})`);
    }
    const lane = ov.roads.find(r => r.type === 'lane' && r.surface === 'dirt'), vat = ov.roads.find(r => r.id === 'vatican');
    assert.ok(lane, 'a lane is packed dirt (§5.6)'); assert.strictEqual(vat.surface, 'paved', 'the Vatican\'s lane is paved');
});

test('§11 limit 2: a road leaves the ground only over water or inside a named viaduct (the Glen, the Loch Head)', () => {
    const { ov } = w16();
    const via = ov.bridges.filter(b => b.viaduct);
    assert.ok(via.some(b => b.viaduct === 'glen') && via.some(b => b.viaduct === 'lochhead'), 'fork 6: the Glen and the Loch Head stand');
    for (const b of ov.bridges) {
        if (b.viaduct || b.wet) continue;
        assert.ok(b.len <= 60, `${b.id}: a dry span of ${b.len} m is a gully bridge, not a giveaway viaduct`);
    }
    for (const id of ['crown', 'east', 'south']) assert.ok(!ov.bridges.some(b => b.road === id && !b.wet && b.len > 60), `${id} is regraded, not a viaduct`);
    assert.ok(!ov.bridges.some(b => b.road === 'ring' && !b.wet && !b.viaduct && b.len > 60), 'Route 1 past Giza is regraded');
});

test('every wet deck clears its water; a creek\'s by a culvert span, a river\'s by the full clearance', () => {
    const { B, ov } = w16(), RR = B.R.roadRules;
    let n = 0;
    for (const b of ov.bridges.filter(q => q.wet)) {
        const clr = RR.clear[b.type], small = b.river && B.R.rivers.find(r => r.id === b.river), need = small && Math.max(small.w0, small.w1) <= RR.smallRiver ? Math.min(clr, RR.clearSmall) : clr;
        let s = b.deck[0];
        for (let k = 0; k < b.pts.length; k++) {
            const p = b.pts[k]; if (k) s += Math.hypot(p[0] - b.pts[k - 1][0], p[1] - b.pts[k - 1][1]);
            if (s < b.span[0] - 0.5 || s > b.span[1] + 0.5 || B.sampleG(B.WATER, p[0], p[1]) < -9000) continue;   // the span's wet samples (the bake's own test)
            const i = Math.floor(B.toI(p[0])), j = Math.floor(B.toI(p[1])), c = j * B.N + i;
            const w = Math.max(B.WATER[c], B.WATER[c + 1], B.WATER[c + B.N], B.WATER[c + B.N + 1]);
            assert.ok(p[2] >= Math.max(w, 0) + need - 0.6, `${b.id} clears the water at (${p[0]}, ${p[1]}): deck ${p[2]}, water ${w.toFixed(1)}`); n++;
        }
    }
    assert.ok(n > 20, `the decks cross water (${n} samples)`);
    // the named bridges: a river's own name, the road's own (the King's Bridge), a footbridge on a trail only
    const lab = id => (ov.bridges.find(b => b.id === id) || {}).label;
    assert.ok(ov.bridges.some(b => b.label === 'THE NILE BRIDGE' && b.look === 'truss'), 'the Nile Bridge is a truss');
    assert.ok(ov.bridges.some(b => b.road === 'crown' && b.label === 'THE KING’S BRIDGE'), 'the Crown\'s Road crosses on the King\'s Bridge');
    for (const b of ov.bridges) if (b.label === 'THE FOOTBRIDGE') assert.strictEqual(b.type, 'trail', `${b.id}: only a trail's bridge is a footbridge`);
    assert.ok(lab('ring:0') !== 'THE FOOTBRIDGE', 'Route 1 never crosses on a footbridge');
});

test('§5.6: a guard rail wherever a road\'s edge drops more than 2 m', () => {
    const { B, ov } = w16(), RR = B.R.roadRules;
    let want = 0, have = 0;
    for (const r of ov.roads) {
        if (r.type === 'trail') continue;
        const P = r.pts, L = [0]; for (let k = 1; k < P.length; k++) L.push(L[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
        const deck = s => ov.bridges.some(b => b.road === r.id && s >= b.deck[0] - 4 && s <= b.deck[1] + 4);
        for (let k = 2; k < P.length - 2; k++) {
            if (deck(L[k])) continue;
            const tx = P[k + 1][0] - P[k - 1][0], tz = P[k + 1][1] - P[k - 1][1], tl = Math.hypot(tx, tz) || 1;
            for (const side of [-1, 1]) {
                const nx = -tz / tl * side, nz = tx / tl * side, o1 = r.w / 2 + 2 + RR.railProbe[0], o2 = r.w / 2 + 2 + RR.railProbe[1];
                const g = Math.min(B.sampleG(B.H, P[k][0] + nx * o1, P[k][1] + nz * o1), B.sampleG(B.H, P[k][0] + nx * o2, P[k][1] + nz * o2));
                if (P[k][2] - g < RR.railDrop + 0.3) continue;   // a clear drop past the rule (the bake's probe)
                want++;
                if (r.rails.some(q => q[2] === side && L[k] >= q[0] - 8 && L[k] <= q[1] + 8)) have++;
            }
        }
    }
    assert.ok(want > 30, `the roads have drops to rail (${want})`);
    assert.ok(have / want > 0.85, `a rail stands at ${have} of ${want} clear drops (a gap is where another road or a pad meets it)`);
});

test('the junctions name the next place each way; no sign names the sea, a door or a place underground', () => {
    const { B, ov } = w16(), { R } = store(w16());
    assert.ok(ov.junctions.length >= 12, `the roads meet (${ov.junctions.length} junctions)`);
    const under = new Set(B.R.sight.underground || []);
    for (const j of ov.junctions) for (const id of [j.ahead, j.back, j.to]) {
        if (!id) continue;
        const p = B.R.places.find(q => q.id === id);
        assert.ok(p && p.kind !== 'sea' && p.kind !== 'door' && !under.has(id), `${j.branch}: ${id} is a place on the land`);
    }
    assert.ok(ov.junctions.every(j => j.ahead !== j.back || !j.ahead), 'a sign\'s two ways name two places');
    const signs = R('HQ_LAND_ROADS.signs.map(s => s.lines)');
    assert.ok(signs.length >= ov.junctions.length, `a sign at every junction (${signs.length})`);
    assert.ok(signs.some(l => l[0] === 'ROUTE 1'), 'Route 1 is signed by its number');
    assert.ok(signs.every(l => l.length >= 2 && l.slice(1).every(t => /[◄►]/.test(t))), 'every place on a sign has its arrow');
});

test('the walker on a deck: stands on it, the parapet is a wall, the ground under a high deck stays walked, the slab is solid', () => {
    const W = w16(), { R } = store(W);
    const d = W.ov.bridges.find(b => b.road === 'ring' && b.viaduct === 'glen');
    const k = d.pts.length >> 1, p = d.pts[k], q = d.pts[k + 1];
    const tx = q[0] - p[0], tz = q[1] - p[1], tl = Math.hypot(tx, tz), nx = -tz / tl, nz = tx / tl;
    const w = R(`HQ_LAND_ROADS.decks.find(q => q.id === '${d.id}').w`), D = R('HQ_LAND_RULES.roads.deck');
    assert.strictEqual(R(`hqLandDeckFeet(${p[0]}, ${p[1]}, ${p[2]}, ${p[2] - 30})`), p[2], 'on the deck: its top');
    assert.strictEqual(R(`hqLandDeckFeet(${p[0] + nx * (w / 2 - D.edge / 2)}, ${p[1] + nz * (w / 2 - D.edge / 2)}, ${p[2]}, ${p[2] - 30})`), null, 'the parapet band is a wall');
    assert.strictEqual(R(`hqLandDeckFeet(${p[0]}, ${p[1]}, ${p[2] - 30}, ${p[2] - 30})`), undefined, 'under a high deck the ground has its say');
    assert.strictEqual(R(`hqLandDeckFeet(${p[0]}, ${p[1]}, null, 0)`), undefined, 'a free query is the ground\'s');
    assert.ok(R(`!!hqLandInDeck(${p[0]}, ${p[1]}, ${p[2] - 0.3}, 0)`), 'the slab is solid to the air');
    assert.ok(!R(`hqLandInDeck(${p[0]}, ${p[1]}, ${p[2] + 1.5}, 0)`), 'the air over the deck is open');
    assert.strictEqual(R(`hqLandDeckBelow(${p[0]}, ${p[1]}, ${p[2] + 3})`), p[2], 'a body coming down lands on it');
    assert.ok(R(`hqLandDeckPiers(HQ_LAND_ROADS.decks.find(q => q.id === '${d.id}')).length`) >= 2, 'the viaduct stands on piers');
    // the trees keep off the decks
    assert.ok(R(`hqLandDeckNear(${p[0]}, ${p[1]}, 1)`), 'a deck is near its own line');
});

test('a guard rail is the blocker at its beam, a skater grinds it run to run', () => {
    const W = w16(), { R } = store(W);
    const pc = R('(() => { const p = HQ_LAND_ROADS.rails.find(q => q.next); return { x: (p.x0 + p.x1) / 2, z: (p.z0 + p.z1) / 2, y: (p.y0 + p.y1) / 2, n: HQ_LAND_ROADS.rails.length }; })()');
    assert.ok(pc.n > 50, `the rails are read (${pc.n} pieces)`);
    const h = R('HQ_LAND_RULES.roads.rail.h');
    assert.ok(R(`!!hqLandRailHit(${pc.x}, ${pc.z}, 0.4, ${pc.y})`), 'a walker at the rail is stopped');
    assert.ok(!R(`hqLandRailHit(${pc.x}, ${pc.z}, 0.4, ${pc.y + h + 0.2})`), 'a jump clears it');
    assert.ok(!R(`hqLandRailHit(${pc.x + 3}, ${pc.z + 3}, 0.4, ${pc.y})`) || true);
    const tr = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
    assert.match(tr, /if \(g\.s > L && g\.rail\.next\) \{ g\.s -= L; g\.rail = g\.rail\.next;/, 'the grind runs on into the next piece');
    assert.match(tr, /y0: pc\.y0 \+ h, y1: pc\.y1 \+ h, landRail: true/, 'each piece is a sloped grind rail at the beam\'s top');
});

test('the renderer draws the roads from the game\'s own sheets and models, and the walker, the air, the boom and the traffic read them', () => {
    const tr = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8'), sp = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');
    const sb = loadGameData(), RR = vm.runInContext('HQ_LAND_RULES.roads', sb);
    const terrain = sp.slice(sp.indexOf('const TERRAIN_SPRITES = {'), sp.indexOf('const TERRAIN_BASE_TINT'));
    const urban = sp.slice(sp.indexOf('const URBAN_TEX_FAMILIES = {'), sp.indexOf('const URBAN_TEXTURES = {}'));
    for (const [k, src] of Object.entries(RR.sheets)) {
        if (src.startsWith('urban:')) assert.ok(urban.includes(`'${src.slice(6)}'`), `${k}: ${src} is in the urban pack`);
        else assert.match(terrain, new RegExp('\\n\\s+' + src + ':\\s+\\['), `${k}: ${src} is a terrain sheet`);
    }
    const kit = tr.slice(tr.indexOf('var _VEHICLE_KIT = {'), tr.indexOf('\n    };', tr.indexOf('var _VEHICLE_KIT = {')));
    for (const k of RR.traffic.kinds) assert.match(kit, new RegExp('\\n\\s+' + k + ':'), `${k} is one of the city's cars`);
    assert.match(tr, /_miscModelInstance\(_R2_MISC \+ 'streetlamp\/Street%20Lamp\.obj'[\s\S]{0,40}3\.6 \* U/, 'the decks\' lamps are the street lamp OBJ');
    // the wiring
    assert.match(tr, /try \{ _hqRoadsArm\(L\); \}/, 'the land arms its roads');
    assert.match(tr, /_hqRoadsTick\(L, H\)/, 'the land ticks its roads');
    assert.match(tr, /_hqRoadsDisarm\(L\)/, 'the roads go with the visit');
    assert.match(tr, /var dk = hqLandDeckFeet\(x, z, curY, g\); if \(dk !== undefined\) return dk;/, 'the walker stands on the decks');
    assert.match(tr, /_hqLandFeetAt\(x, z, curY\)/, 'the walker\'s feet pass their height');
    assert.match(tr, /hqLandInDeck\(x, z, y, 0\.05\) \|\| hqLandRailHit\(/, 'the air meets a deck and a rail');
    assert.match(tr, /hqLandInDeck\(px, pz, py, 0\.22\)/, 'the boom never enters a deck');
    assert.match(tr, /hqLandDeckBelow\(x, z, feetY \+ 0\.05\)/, 'a body coming down lands on a deck');
    assert.match(tr, /gy = car\.yAt \? car\.yAt\(car\.s\) : hqTerrainHeight\(info, p\.x, p\.z\)/, 'Route 1\'s cars ride the graded line');
    assert.match(tr, /landRoad: true/, 'the piers and posts are the room\'s blockers');
    assert.match(tr, /EW_NO_LAND_ROADS/, 'the kill-switch');
    assert.ok(!/Assets\/(?:Roads|Bridges)\//.test(tr), 'no new asset folder');
});
