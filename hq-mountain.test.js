'use strict';
/* THE NORTH (OPEN_WORLD_PLAN.md Phase 6, 2026-09-27):
   - THE KINGDOM: the crown road (the entry part, north of the grounds) ⇄ the ward by a road join; the great hall and the
     keep by DOOR JOINS on the ward's north wall; the parts beside (the hall and the keep, drawn from the road and the hills);
   - THE MOUNTAIN: the foothills (0 → 25 m), the switchbacks (25 → 60 m, five ledges up the face) and the summit (60 m), joined
     by trail joins, reached from the ward's postern by a border; the outer ground keeps the slope (`outer.keep` / `lift`);
   - THE ROOF: a closed staged part is roofed (it is seen from outside);
   - (heavy) the walker: from the crown road's south end through the gatehouse, out of the postern, up the foothills and the
     switchbacks' trail WITHOUT the ropes, to the summit — 0 → 65 m on foot, every part solved and chained at its join. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadGameData } = require('./load-data');
const { heavy } = require('./test-heavy');
const D = loadGameData(), HQ = D.DOOR_HQ;
const R = n => vm.runInContext(n, D);
const HQ_STAGE_RULES = R('HQ_STAGE_RULES'), W = R('HQ_WORLD');
const P = 'site_prebuilt_';
const KINGDOM = ['road', 'ward', 'hall', 'keep'].map(s => P + 'camelot_' + s);
const MOUNTAIN = ['foothills', 'switchbacks', 'summit'].map(s => P + 'olympus_' + s);
const rendererSrc = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');

test('the world is valid; the kingdom and the mountain are staged zones of real parts', () => {
    const v = D.hqWorldValidate();
    assert.ok(v.ok, v.errors.join('\n'));
    for (const z of ['kingdom', 'mountain']) assert.ok(HQ_STAGE_RULES.zones.includes(z), z + ' is staged');
    for (const id of KINGDOM.concat(MOUNTAIN)) {
        assert.ok(HQ.rooms[id], id + ' is a room');
        assert.ok(D.hqStagePart(id), id + ' is a staged part');
    }
    const M = W.zones.mountain;
    assert.equal(M.hub, P + 'olympus_foothills');
    assert.deepEqual(MOUNTAIN.map(id => M.parts[id].y), [0, 25, 60], 'the mountain climbs 0 → 25 → 60 m');
    assert.equal(D.hqSiteEntry(P + 'camelot').room, P + 'camelot_road', 'Camelot is entered by the crown road');
});

test('the joins: the grounds ⇄ the road ⇄ the ward ⇄ the foothills ⇄ the switchbacks ⇄ the summit', () => {
    const chain = [P + 'camelot_road', P + 'camelot_ward', P + 'olympus_foothills', P + 'olympus_switchbacks', P + 'olympus_summit'];
    for (let i = 0; i + 1 < chain.length; i++) {
        const a = chain[i], b = chain[i + 1];
        const nb = D.hqStageNeighbours(a).find(n => n.id === b);
        assert.ok(nb && nb.spans.some(s => s.side === 'n' && !s.door), a + ' has ' + b + ' across its north edge');
        const back = D.hqStageNeighbours(b).find(n => n.id === a);
        assert.ok(back && back.spans.some(s => s.side === 's'), b + ' sees ' + a + ' across its south edge');
    }
    for (const id of [P + 'camelot_hall', P + 'camelot_keep']) {
        const nb = D.hqStageNeighbours(P + 'camelot_ward').find(n => n.id === id);
        assert.ok(nb && nb.spans.length === 1 && nb.spans[0].door, id + ' is a door join on the ward\'s north wall');
    }
    const border = (W.borders || []).find(b => [b.a, b.b].includes(P + 'camelot_ward') && [b.a, b.b].includes(P + 'olympus_foothills'));
    assert.ok(border, 'a border carries the postern track onto the foothills');
});

test('THE PARTS BESIDE: the hall and the keep stand whole from the road and the hills, and are never crossed into', () => {
    for (const from of [P + 'camelot_road', P + 'olympus_foothills']) {
        const nbs = D.hqStageNeighbours(from);
        for (const id of [P + 'camelot_hall', P + 'camelot_keep']) {
            const nb = nbs.find(n => n.id === id);
            assert.ok(nb && nb.beside && nb.spans.length === 0 && nb.via === P + 'camelot_ward', from + ' draws ' + id + ' beside the ward');
            const r = nb.rect, S = HQ.rooms[from].shell;
            assert.equal(D.hqStageWhere(S.w / 2, S.d / 2, [nb], (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 1), null, 'no crossing into ' + id + ' from ' + from);
        }
    }
    assert.ok(!D.hqStageNeighbours(P + 'camelot_ward').some(n => n.beside), 'the ward\'s own door joins are real neighbours');
});

test('THE WARD is BUILT: no floor plan, the curtain walls walked, three towers, the gatehouse, the moat and the drawbridge', () => {
    const t = HQ.rooms[P + 'camelot_ward'].terrain, f = t.features;
    assert.ok(!t.gen, 'no generator (family E)');
    assert.ok(f.filter(x => x.k === 'spiral').length >= 3, 'the towers\' stairs');
    assert.ok(f.some(x => x.k === 'stream' && x.key === 'deep_water'), 'the moat');
    assert.ok(f.some(x => x.k === 'bridge' && x.id === 'drawbridge' && x.y < 1), 'the drawbridge');
    assert.ok(f.filter(x => x.k === 'wall' && x.y >= 6 && x.t >= 3).length >= 6, 'the curtain runs, walkable on top');
    assert.ok(f.filter(x => x.k === 'ramp' && x.stairs && x.h1 >= 6).length >= 2, 'the rampart stairs');
});

test('THE MOUNTAIN: the foothills slope, five ledges up the switchbacks, the outer ground keeps the slope', () => {
    const fh = HQ.rooms[P + 'olympus_foothills'], sb = HQ.rooms[P + 'olympus_switchbacks'], sm = HQ.rooms[P + 'olympus_summit'];
    assert.ok(fh.terrain.features.some(x => x.k === 'ramp' && x.h0 === 0 && x.h1 === 25), 'the foothills rise 0 → 25 m');
    const ledges = sb.terrain.features.filter(x => x.k === 'plateau').map(x => x.h).sort((a, b) => a - b);
    assert.deepEqual([...ledges], [7, 14, 21, 28, 35], 'five ledges, 7 m apart');
    assert.equal(sb.terrain.features.filter(x => x.k === 'ramp').length, 5, 'a leg of the trail up each');
    for (const r of [fh, sb]) assert.equal(r.terrain.outer.keep, 1, r.id + ': the land past the edge keeps the slope');
    assert.ok(sm.terrain.outer.lift < 0, 'the summit\'s shoulders fall away');
    assert.match(rendererSrc, /oKeep = \(OO\.keep != null\)/, 'the outer ground reads outer.keep');
    assert.match(rendererSrc, /oLift \* sm\(e \/ 30\)/, 'the outer ground reads outer.lift');
});

test('THE ROOF: a closed staged part is roofed, tagged with the ceiling', () => {
    assert.match(rendererSrc, /hqStagePart\(roofId\)/, 'the roof is for staged parts');
    assert.match(rendererSrc, /rf\._ew_hqPart = 'ceil'; rf\._ew_hqRoof = true;/, 'the roof drops with the ceiling in a battle');
});

test('the walker: the crown road to the summit, the switchbacks\' trail without the ropes, 0 → 65 m on foot', heavy, () => {
    const chain = [P + 'camelot_road', P + 'camelot_ward', P + 'olympus_foothills', P + 'olympus_switchbacks', P + 'olympus_summit'];
    const noRopes = id => { const r = JSON.parse(JSON.stringify(HQ.rooms[id])); r.terrain.features = r.terrain.features.filter(f => f.k !== 'climb'); return D.hqTerrainCompile(r, null); };
    const edgePt = (id, sp) => { const S = HQ.rooms[id].shell, t = (sp.t0 + sp.t1) / 2, hw = S.w / 2 - 1.5, hd = S.d / 2 - 1.5;
        return sp.side === 'n' ? [t, -hd] : sp.side === 's' ? [t, hd] : sp.side === 'e' ? [hw, t] : [-hw, t]; };
    let start = [0, HQ.rooms[chain[0]].shell.d / 2 - 1.5], top = -1;
    chain.forEach((id, i) => {
        const info = id === P + 'olympus_switchbacks' ? noRopes(id) : D.hqTerrainInfo(id), reach = D.hqTerrainReach(info, start[0], start[1]);
        const y0 = D.hqWorldFrame(id).y;
        reach.forEach(v => { if (v + y0 > top) top = v + y0; });
        if (i + 1 === chain.length) return;
        const sp = D.hqStageNeighbours(id).find(n => n.id === chain[i + 1]).spans[0], e = edgePt(id, sp);
        const k = D.hqTerrainNodeKey(info, e[0], e[1]);
        assert.ok(reach.has(k), id + ': the walker reaches the join to ' + chain[i + 1]);
        const back = D.hqStageNeighbours(chain[i + 1]).find(n => n.id === id).spans[0];
        start = edgePt(chain[i + 1], back);
    });
    assert.ok(top >= 64.9, 'the summit\'s terrace is reached: ' + top.toFixed(2) + ' m');
});
