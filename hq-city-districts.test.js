// hq-city-districts.test.js — AREA CONTENT PLAN D2 (2026-09-19): DISASTER CITY + THE GRID, TWICE THE SIZE.
// THE DISTRICTS on the `city` plan (gen.districts → every lot row carries its district's look; the yard walls wear
// the district's fence; info.districts counts them), THE CUT (a `sink: true` plateau = a sunk tier the walker drops
// into and never climbs — THE UNDERCITY), THE GANGWAY (`gangway: true` on a deck between two roofs: its forced band
// is the deck's own width — no ground pocket beside it), THE FIRE ESCAPE (the `fireescape` climb look, chained
// through a landing plateau), the three cities themselves (224 × 176 / 208 × 168 / the Strip's rooftops: every
// door reached, nothing traps, zero rescue ramps, the roofs up their fire escapes, the undercity down its ramp road
// and its steps, the door gun's roofs still nobody's, the manholes into the sewers, R3 / R5 on the audit), the
// audit's D2 refinements (R7 districts, a road out is never earned, the median-sill tier rule) and the sources.
'use strict';
const test = require('node:test');
const { heavy } = require('./test-heavy.js');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadGameData } = require('./load-data');
const D = loadGameData(), HQ = D.DOOR_HQ;
const STREETS = 'site_prebuilt_downtown_streets', GRID = 'site_prebuilt_cyberpunk_streets', STRIP = 'site_prebuilt_strip_streets', SEWERS = 'site_prebuilt_downtown_sewers';
const renderer = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8'), data = fs.readFileSync(__dirname + '/data.js', 'utf8'), audit = fs.readFileSync(__dirname + '/check-area-content.js', 'utf8');
const at = (room, id) => (HQ.rooms[room].doors || []).find(d => d.id === id);
const key = (info, x, z) => D.hqTerrainNodeKey(info, x, z);
const reachFrom = (id, doorId) => { const r = HQ.rooms[id], info = D.hqTerrainInfo(id), L = D.hqTerrainDoorLanding(r, at(id, doorId) || r.doors[0]); return [info, D.hqTerrainReach(info, L.x, L.z)]; };

/* a synthetic city: one street east–west, two districts split at x 0 */
function lab(extra) {
    return Object.assign({ id: 'lab', label: 'LAB', kind: 'box', shell: { w: 80, d: 40, h: 9, open: true, edge: 'open' }, doors: [{ id: 'w', wall: 'w', z: 0 }, { id: 'e', wall: 'e', z: 0 }],
        terrain: { floor: 'grass_2', cliff: 'concrete', path: 'concrete', noise: { amp: 0 },
                   gen: { kind: 'city', seed: 3, walkW: 2.4, kerb: 0.12, wallH: 3.2, fronts: 'window', texP: 0.5, ruinP: 0.3, storeys: [2, 4],
                          districts: [{ id: 'west', label: 'W', rect: [-40, -20, 0, 20], storeys: [1, 1], lowP: 0, style: 'residential', texP: 1, ruinP: 0.1, neon: false, fronts: 'store', fenceKey: 'bricks_2', fenceH: 1.9 },
                                      { id: 'east', label: 'E', rect: [0, -20, 40, 20], storeys: [3, 3], lowP: 0, neon: true }],
                          streets: [{ pts: [[-42, 0], [42, 0]], w: 8 }, { pts: [[-20, -20], [-20, 20]], w: 6 }, { pts: [[20, -20], [20, 20]], w: 6 }] },
                   features: [] } }, extra || {});
}

test('THE DISTRICTS: a lot belongs to the district whose rect holds its face, carries that district\'s storeys / low share / look (district, neon, texP, ruinP, style, fronts) on its row, the fronts inherit it, the yard walls wear the district\'s fence, info.districts counts the lots per district; a lot outside every rect keeps the plan\'s numbers', () => {
    const info = D.hqTerrainCompile(lab(), 'lab');
    assert.ok(info.lots.length >= 12, 'lots ' + info.lots.length);
    assert.equal(info.districts.length, 2); assert.equal(info.gen.districts, 2);
    const west = info.lots.filter(l => l.district === 'west'), east = info.lots.filter(l => l.district === 'east');
    assert.ok(west.length >= 4 && east.length >= 4, 'both districts have lots: ' + west.length + ' / ' + east.length);
    assert.equal(info.districts.find(d => d.id === 'west').lots, west.length); assert.equal(info.districts.find(d => d.id === 'east').lots, east.length);
    for (const l of west) { assert.equal(l.storeys, 1); assert.equal(l.low, false); assert.equal(l.neon, false); assert.equal(l.texP, 1); assert.equal(l.ruinP, 0.1); assert.equal(l.style, 'residential'); assert.equal(l.fronts, 'store'); assert.ok(l.x < 0.5, 'a west lot stands west'); }
    for (const l of east) { assert.equal(l.storeys, 3); assert.equal(l.neon, true); assert.equal(l.texP, undefined); assert.equal(l.style, undefined); assert.equal(l.fronts, undefined); assert.ok(l.x > -0.5); }
    for (const f of info.fronts) { const lot = info.lots[f.lot]; assert.equal(f.district, lot.district || null); assert.equal(f.fronts, lot.fronts || null); }
    const wy = info.yardWalls.filter(w => w.district === 'west'), ey = info.yardWalls.filter(w => w.district === 'east');
    for (const w of wy) { assert.equal(w.key, 'bricks_2'); assert.equal(w.h, 1.9); }
    for (const w of ey) { assert.equal(w.key, D.HQ_TERRAIN_GEN.city.fenceKey); assert.equal(w.h, D.HQ_TERRAIN_GEN.city.fenceH); }
    /* no districts = the plan as before */
    const plain = lab(); delete plain.terrain.gen.districts;
    const info2 = D.hqTerrainCompile(plain, 'lab2');
    assert.equal(info2.districts.length, 0); assert.equal(info2.gen.districts, 0);
    assert.ok(info2.lots.every(l => l.district === undefined && l.neon === undefined && l.style === undefined), 'no district on a lot without one');
    const a = D.hqTerrainCompile(lab(), 'lab'), b = D.hqTerrainCompile(lab(), 'lab');
    assert.equal(JSON.stringify(a.lots), JSON.stringify(b.lots), 'deterministic');
});

test('THE CUT: a `sink: true` plateau cuts the ground DOWN to h with cliff sides — dropped into from the rim, never climbed back at the wall, left up a ramp or a stair authored after it; a plan never forces a sunk tier open (its blocks stay mass)', () => {
    const room = { id: 'cut', label: 'CUT', kind: 'box', shell: { w: 40, d: 40, h: 8, open: true, edge: 'open' }, doors: [{ id: 'n', wall: 'n', x: 0 }],
        terrain: { floor: 'grass_2', noise: { amp: 0 }, features: [
            { k: 'plateau', x: 0, z: 8, w: 30, d: 14, h: -4, sink: true, edge: 0.35 },
            { k: 'ramp', x0: 0, z0: -1, x1: 0, z1: 11, w: 5, h0: 0, h1: -4 },
            { k: 'ramp', x0: 10, z0: -1, x1: 10, z1: 9, w: 3, h0: 0, h1: -4, stairs: true } ] } };
    const info = D.hqTerrainCompile(room, 'cut');
    assert.ok(Math.abs(D.hqTerrainHeight(info, -10, 8) + 4) < 0.01, 'the floor of the cut is −4');
    assert.ok(Math.abs(D.hqTerrainHeight(info, -10, -5)) < 0.01, 'the ground outside stays 0');
    assert.ok(Math.abs(D.hqTerrainHeight(info, 0, 5) + 2) < 0.4, 'the ramp is halfway down at its middle (' + D.hqTerrainHeight(info, 0, 5).toFixed(2) + ')');
    assert.equal(D.hqTerrainFeet(info, -10, 2, 0), -4, 'dropped into from the rim');
    { const noRamp = JSON.parse(JSON.stringify(room)); noRamp.terrain.features = noRamp.terrain.features.filter(f => f.k !== 'ramp'); const ni = D.hqTerrainCompile(noRamp, 'cut2'); assert.ok(ni.rescues.length >= 1 && ni.rescues[0].y0 === -4 && ni.rescues[0].y1 === 0, 'without a ramp the cut is a trap the compiler rescues (a ramp cut from −4 to 0): ' + JSON.stringify(ni.rescues)); assert.ok(Math.abs(D.hqTerrainHeight(ni, -10, 1.5) + 4) < 0.01 && Math.abs(D.hqTerrainHeight(ni, -10, 1)) < 0.01, 'the retaining wall is one cell'); }
    const R = D.hqTerrainReach(info, 0, -17);
    assert.ok(R.has(key(info, -10, 8)) && Math.abs(R.get(key(info, -10, 8)) + 4) < 0.01, 'the floor is reached');
    assert.equal(D.hqTerrainTraps(info).length, 0, 'the ramp and the stair bring the walker back — no trap, no rescue');
    assert.equal(info.rescues.length, 0);
    /* the plan: a sunk tier under a city plan keeps its blocks as mass */
    const city = lab(); city.terrain.features.push({ k: 'plateau', x: 0, z: 0, w: 60, d: 30, h: -4, sink: true, edge: 0.35 }); city.terrain.features.push({ k: 'ramp', x0: -41, z0: 0, x1: -30, z1: 0, w: 8, h0: 0, h1: -4 }); city.terrain.features.push({ k: 'ramp', x0: 41, z0: 0, x1: 30, z1: 0, w: 8, h0: 0, h1: -4 });
    const ci = D.hqTerrainCompile(city, 'citycut');
    assert.ok(ci.gen.open < 0.6, 'the sunk district is not forced open: ' + ci.gen.open.toFixed(2));
    assert.equal(D.hqTerrainFeet(ci, -10, 12, null), null, 'a block in the cut is still a mass');
    assert.ok(Math.abs(D.hqTerrainHeight(ci, -10, 0) + 4) < 0.15, 'the street in the cut is four metres down');
    assert.ok(/if \(f\.sink\) \{ if \(fh < h\) h = fh; continue; \}/.test(data) && /case 'plateau': \{\n\s+if \(f\.sink\) break;/.test(data), 'the two sites');
});

test('THE GANGWAY + THE FIRE ESCAPE: `gangway: true` on a deck between two roof plateaus keeps its forced band to the deck\'s width (no ground pocket beside it — no rescue ramp); a `fireescape` climb chain — the sidewalk → a landing plateau → the roof — carries the walker up by the solver\'s edge alone; the look is catalogued, 0.6 m wide, and built by the renderer', () => {
    assert.ok(D.HQ_CLIMB_LOOKS.includes('fireescape') && D.HQ_CLIMB_LOOKS.length === 7);
    const city = lab();
    city.terrain.features.push(
        { k: 'path', pts: [[-20, 4], [-20, 16]], w: 4 },
        { k: 'plateau', x: -34, z: 14, w: 10, d: 8, h: 7.0, edge: 0.35 }, { k: 'plateau', x: -26, z: 14, w: 5, d: 8, h: 7.0, edge: 0.35 },
        { k: 'deck', x0: -29.6, z0: 14, x1: -28.4, z1: 14, w: 1.6, y: 7.0, gangway: true },
        { k: 'plateau', x: -22.7, z: 13, w: 1.6, d: 2.2, h: 3.5, edge: 0.15 },
        { k: 'climb', x: -21.9, z: 12.4, face: 270, look: 'fireescape' }, { k: 'climb', x: -23.5, z: 13.6, face: 270, look: 'fireescape' });
    const info = D.hqTerrainCompile(city, 'fe');
    assert.equal(info.climbs.length, 2); assert.ok(info.climbs.every(c => c.look === 'fireescape' && Math.abs(c.w - 0.6) < 1e-9));
    const R = D.hqTerrainReach(info, -20, 6);
    assert.ok(R.has(key(info, -22.7, 13)) && Math.abs(R.get(key(info, -22.7, 13)) - 3.5) < 0.05, 'the landing');
    assert.ok(R.has(key(info, -26, 14)) && Math.abs(R.get(key(info, -26, 14)) - 7.0) < 0.05, 'the near roof');
    assert.ok(R.has(key(info, -34, 14)) && Math.abs(R.get(key(info, -34, 14)) - 7.0) < 0.05, 'the far roof over the gangway');
    assert.equal(D.hqTerrainTraps(info).length, 0); assert.equal(info.rescues.length, 0, 'no pocket beside the gangway: ' + JSON.stringify(info.rescues));
    assert.equal(D.hqTerrainFeet(info, -29, 15.5, null), null, 'the yard beside the gangway is still a mass');
    assert.ok(Math.abs(D.hqTerrainHeight(info, -29, 14) - 7.0) < 0.01, 'the gangway carries the roof height');
    assert.ok(/if \(f\.k === 'deck' && f\.gangway\)/.test(data), 'the gangway rule');
    assert.ok(renderer.includes("} else if (c.look === 'fireescape') {") && renderer.includes('THE FIRE ESCAPE (AREA CONTENT D2'), 'the look is built');
});

test('THE THREE CITIES (data): Downtown 224 × 176 and the Grid 208 × 168 with THREE districts each (R7), the Strip one district with its two rooftops; parti + typology (R6); the pinned cores untouched (the ring road first, the deck, the rooftop, the skyway, the billboard roof, the valet deck); the bay door lands in THE UNDERCITY (its sill −4); the manholes are links on the sewers line, live, a gutter at the street end and a grate on the sewers\' free walls', () => {
    const st = HQ.rooms[STREETS], gr = HQ.rooms[GRID], sp = HQ.rooms[STRIP];
    assert.ok(st.shell.w >= 200 && st.shell.d >= 160 && gr.shell.w >= 200 && gr.shell.d >= 160, 'twice the size');
    assert.equal(st.terrain.gen.districts.map(d => d.id).join(','), 'financial,oldtown,docks'); assert.equal(gr.terrain.gen.districts.map(d => d.id).join(','), 'neon,stacks,undercity');
    for (const r of [st, gr, sp]) assert.ok(typeof r.parti === 'string' && r.parti.length > 20 && /^(bowl|ring|switchback|hub|loop|pearls|corridor)$/.test(r.typology), r.label + ': parti + typology');
    assert.ok(st.terrain.gen.streets[0].loop && st.terrain.gen.streets[0].pts[0][0] === -40 && st.terrain.features.find(f => f.k === 'plateau' && f.h === 3.0).x === 24 && st.terrain.features.find(f => f.k === 'plateau' && f.h === 4.0).x === -29.5, 'Downtown\'s core');
    assert.ok(gr.terrain.gen.streets[0].loop && gr.terrain.features.find(f => f.k === 'plateau' && f.h === 4.5).x === 22 && gr.terrain.features.find(f => f.k === 'plateau' && f.h === 5.0).x === -26, 'the Grid\'s core');
    assert.ok(sp.terrain.features.filter(f => f.k === 'plateau' && f.h === 4.2).length === 2 && sp.terrain.features.filter(f => f.k === 'climb' && f.look === 'fireescape').length === 2 && sp.shell.w === 100, 'the Strip\'s rooftops at its own size');
    const cut = gr.terrain.features.find(f => f.k === 'plateau' && f.sink);
    assert.ok(cut && cut.h === -4 && gr.terrain.features.indexOf(gr.terrain.features.find(f => f.k === 'ramp' && f.h1 === -4 && !f.stairs)) > gr.terrain.features.indexOf(cut), 'the ramp road is authored after the cut');
    assert.equal(D.hqTerrainDoorY(gr, at(GRID, 'bay')), -4, 'the bay door lands in the undercity');
    assert.ok(gr.terrain.features.filter(f => f.k === 'deck' && f.gangway).length === 3 && gr.terrain.features.filter(f => f.k === 'climb' && f.look === 'fireescape').length === 9 && gr.terrain.features.filter(f => f.k === 'climb' && f.look === 'pipe').length === 2, 'three gangways, four fire escapes, two drains');
    assert.ok(st.terrain.features.filter(f => f.k === 'climb' && f.look === 'fireescape').length === 4 && st.terrain.features.filter(f => f.k === 'deck').length === 4 && st.terrain.features.some(f => f.k === 'stream' && f.key === 'deep_water'), 'two fire escapes, four bridges over the canal');
    for (const id of ['docks_sewer', 'undercity_sewer']) {
        const l = HQ.links.find(x => x.id === id);
        assert.ok(l && l.route === 'sewers' && l.way === 'gutter' && l.a.wall === 'free' && l.b.part === 'sewers' && l.b.leaf === 'leaf_cell' && l.why && l.draft === true && D.hqLinkLive(l), id);
        const ga = at(D.hqLinkRoom(l.a), 'link_' + id), gb = at(SEWERS, 'link_' + id);
        assert.ok(ga && ga.way === 'gutter' && gb && !gb.way && gb.leaf === 'leaf_cell' && ga.action.room === SEWERS && gb.action.room === D.hqLinkRoom(l.a), id + ': both ends');
        for (const o of HQ.rooms[SEWERS].doors) if (o !== gb && o.wall === gb.wall) assert.ok(Math.abs((gb.wall === 'n' || gb.wall === 's' ? o.x - gb.x : o.z - gb.z)) >= 4.4, id + ' shares a lane with ' + o.id);
    }
    assert.equal(D.hqLinkRoom(HQ.links.find(x => x.id === 'docks_sewer').a), STREETS); assert.equal(D.hqLinkRoom(HQ.links.find(x => x.id === 'undercity_sewer').a), GRID);
});

test('THE THREE CITIES (the solver — heavy): every door reached from every door, nothing traps, ZERO rescue ramps; the roofs are walked up their fire escapes (Downtown\'s east yards + warehouse, the Grid\'s seven stacks across the gangways), the undercity is reached down the ramp road, both steps and both drains; the overlook stands 7 m over the lower cross; the door gun\'s roofs (THE ROOFTOP, THE BILLBOARD ROOF, THE MARQUEE ROOF, THE CONTAINER in the basin) are nobody\'s; the drowned manhole is waded to; the sewers reach both grates', heavy, () => {
    for (const id of [STREETS, GRID, STRIP]) {
        const r = HQ.rooms[id], info = D.hqTerrainInfo(id);
        const L = r.doors.map(d => Object.assign({ d }, D.hqTerrainDoorLanding(r, d)));
        for (const a of L) { const reach = D.hqTerrainReach(info, a.x, a.z); for (const b of L) assert.ok(reach.has(key(info, b.x, b.z)), id + ': ' + a.d.id + ' → ' + b.d.id); }
        assert.equal(D.hqTerrainTraps(info).length, 0, id + ': a trap'); assert.equal(info.rescues.length, 0, id + ': rescue ramps ' + JSON.stringify(info.rescues));
        assert.ok(info.lots.length >= (id === STRIP ? 10 : 100), id + ': lots ' + info.lots.length);
        assert.ok(info.districts.every(d => d.lots >= 8) || id === STRIP, id + ': every district has lots ' + JSON.stringify(info.districts.map(d => d.lots)));
    }
    const [si, sR] = reachFrom(STREETS, 'tower'), st = HQ.rooms[STREETS];
    for (const [n, x, z, y] of [['the east yards', 63, -35, 6.8], ['the warehouse roof', -28, -47, 6.0], ['the crane platform', 22, 86.4, 3.2], ['the flooded quay', -76, 78, -0.55]]) assert.ok(sR.has(key(si, x, z)) && Math.abs(sR.get(key(si, x, z)) - y) < 0.1, n + ' ' + (sR.get(key(si, x, z))));
    assert.ok(!sR.has(key(si, -29.5, 15)) && !sR.has(key(si, 60, 78)), 'THE ROOFTOP and THE CONTAINER are the door gun\'s');
    assert.equal(D.hqTerrainDoorY(st, at(STREETS, 'link_docks_sewer')), -0.9, 'the drowned manhole\'s sill is under the water');
    assert.ok(D.hqTerrainFluidAt(si, -78.5, 78) && D.hqTerrainFluidAt(si, -78.5, 78).key === 'water', 'waded to');
    const [gi, gR] = reachFrom(GRID, 'noodle');
    for (const [n, x, z, y] of [['STACK W', -69, -47, 10.5], ['A1', -39, -47, 10.5], ['A2 (over the gangway)', -20, -47, 10.5], ['B1', 19, -47, 10.5], ['B2', 35, -47, 10.5], ['E1', 56, -47, 10.5], ['E2', 76, -47, 10.5], ['the overlook', 70, 37, 3.0], ['the undercity', 0, 70, -4], ['the west steps\' foot', -44, 55, -4], ['the east drain\'s foot', 20, 46, -4], ['the skyway', 22, -13, 4.5]]) assert.ok(gR.has(key(gi, x, z)) && Math.abs(gR.get(key(gi, x, z)) - y) < 0.15, n + ' ' + gR.get(key(gi, x, z)));
    assert.ok(!gR.has(key(gi, -26, -13)), 'THE BILLBOARD ROOF is the door gun\'s');
    assert.ok(D.hqTerrainHeight(gi, 70, 37) - D.hqTerrainHeight(gi, 70, 62) > 6.5, 'the overlook stands seven metres over the lower cross');
    const [pi, pR] = reachFrom(STRIP, 'chapel');
    assert.ok(pR.has(key(pi, -28, -29.6)) && pR.has(key(pi, -10, 29.6)) && !pR.has(key(pi, -30, 11.5)), 'the Strip\'s two roofs up their ladders; the marquee stays the gun\'s');
    const [wi, wR] = reachFrom(SEWERS, 'pump');
    for (const id of ['link_docks_sewer', 'link_undercity_sewer']) { const l = D.hqTerrainDoorLanding(HQ.rooms[SEWERS], at(SEWERS, id)); assert.ok(wR.has(key(wi, l.x, l.z)), 'the sewers reach ' + id); }
    assert.equal(D.hqTerrainTraps(wi).length, 0);
});

test('THE AUDIT (heavy): R7 counts districts; a road out is never earned; a tier is judged against the MEDIAN sill; Downtown and the Grid read three districts, ≤ 2 doors exposed from any landing, every earned exit teased, the pull under 55 m; the Strip keeps its R7 warning by design', heavy, () => {
    const A = require('./check-area-content.js');
    assert.equal(A.RULES.R7.districts, 3);
    assert.ok(/dr\.way === 'road'\) return false;/.test(audit) && /median = sills\.length/.test(audit), 'the two refinements');
    const rows = A.audit({ pick: [STREETS, GRID, STRIP] });
    const by = Object.fromEntries(rows.map(r => [r.id, r]));
    for (const id of [STREETS, GRID]) { const r = by[id]; assert.equal(r.districts, 3); assert.ok(!r.warn.some(w => /^R7/.test(w)), id + ': R7 clean'); assert.ok(r.exposed <= 2, id + ': exposed ' + r.exposed + ' from ' + r.exposedBy.join('/')); assert.equal(r.unteased.length, 0, id + ': unteased ' + r.unteased.join('/')); assert.ok(r.pullMax <= 55, id + ': pull ' + r.pullMax); assert.ok(!r.earnedIds.some(x => /^link_(downtown_strip|stadium_downtown|strip_cyberpunk)$/.test(x)), id + ': a road is not earned'); assert.ok(r.parti && r.typology); }
    assert.ok(by[STRIP].warn.some(w => /^R7 city 100/.test(w)), 'the Strip stays one district');
    assert.ok(by[GRID].earnedIds.every(x => /^link_(tunnel_cyberpunk|undercity_sewer)$/.test(x)), 'the Grid\'s earned exits are the train and the gutter, not every door above the sunk bay: ' + by[GRID].earnedIds.join('/'));
});

test('the sources: the renderer reads a lot\'s district before the plan (neon, ruinP, style, texP, a second batch for a flipped neon flag, the front\'s kind), the compiler stamps the rows', () => {
    for (const f of ["var neon = (lot.neon != null) ? !!lot.neon : !!(gen && gen.neon), ruin = rng() < ((lot.ruinP != null) ? lot.ruinP :", "if (lot.style && _HQ_TEX_STYLES[lot.style] && names.indexOf(lot.style) >= 0) style = lot.style;", "var batchFor = function (lotNeon) {", "var lotNeonOf = function (lot) { return (lot.neon != null) ? !!lot.neon : neon; };", "if (lot.low || lr() < ((lot.texP != null) ? lot.texP : texP)) {", "var store = (lot.fronts || gen.fronts) === 'store';", "lift: lotNeonOf(lot) ? 0.42 : 0.18,"]) assert.ok(renderer.includes(f), 'renderer: ' + f);
    for (const f of ["const districts = (gen.districts || []).filter(d => d && d.id && Array.isArray(d.rect) && d.rect.length === 4)", "if (dd) { row.district = dd.id; dd.lots++;", "info.districts = districts.map(d => ({ id: d.id, label: d.label || d.id, rect: d.rect.slice(), lots: d.lots,", "district: lot.district || null, fronts: lot.fronts || null });", "yard: true, district: dd ? dd.id : null }"]) assert.ok(data.includes(f), 'data: ' + f);
    assert.ok(data.includes("const HQ_CLIMB_LOOKS = ['ladder', 'rope', 'vine', 'chain', 'pipe', 'wall', 'fireescape'];"));
});
