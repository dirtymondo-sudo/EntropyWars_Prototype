'use strict';
/* THE NORTH (OPEN_WORLD_PLAN.md Phase 6, 2026-09-27; WORLD_GEOGRAPHY_PLAN.md G6, 2026-09-28):
   - G6: the crown road, the foothills and the switchbacks retired — Camelot's ward and the summit are sites on THE LAND,
     and the land's own slope climbs from one to the other;
   - THE KINGDOM: the great hall and the keep by DOOR JOINS on the ward's north wall; from the land they stand beside the
     ward (drawn whole, never crossed into);
   - THE ROOF: a closed staged part is roofed (it is seen from outside);
   - (heavy) the walker: on the summit from its edge to its terrace, 5 m over its pad. */
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
const KINGDOM = ['ward', 'hall', 'keep'].map(s => P + 'camelot_' + s);
const SUMMIT = P + 'olympus_summit';
const rendererSrc = fs.readFileSync(__dirname + '/three-renderer.js', 'utf8');

test('the world is valid; the kingdom and the summit are staged parts on the land; the road and the lower mountain are retired (G6)', () => {
    const v = D.hqWorldValidate();
    assert.ok(v.ok, v.errors.join('\n'));
    assert.ok(HQ_STAGE_RULES.zones.includes('land'), 'the land is staged');
    for (const z of ['kingdom', 'mountain']) assert.ok(!W.zones[z], z + ' is gone (G6)');
    for (const id of KINGDOM.concat([SUMMIT])) {
        assert.ok(HQ.rooms[id], id + ' is a room');
        assert.ok(D.hqStagePart(id) && W.zones.land.parts[id], id + ' is a staged part on the land');
    }
    for (const id of [P + 'camelot_road', P + 'olympus_foothills', P + 'olympus_switchbacks']) assert.ok(!HQ.rooms[id], id + ' retired');
    assert.ok(D.hqWorldFrame(SUMMIT).y - D.hqWorldFrame(P + 'camelot_ward').y > 200, 'the summit stands high over Camelot');
    assert.equal(D.hqSiteEntry(P + 'camelot').room, P + 'camelot_ward', 'Camelot is entered by the ward');
});

test('the joins: the hall and the keep are door joins on the ward\'s north wall; the ward and the summit are islands on the land', () => {
    for (const id of [P + 'camelot_hall', P + 'camelot_keep']) {
        const nb = D.hqStageNeighbours(P + 'camelot_ward').find(n => n.id === id);
        assert.ok(nb && nb.spans.length === 1 && nb.spans[0].door, id + ' is a door join on the ward\'s north wall');
    }
    for (const id of [P + 'camelot_ward', SUMMIT]) {
        const j = D.hqWorldJoins(id).find(j => j.kind === 'island' && j.a === 'land' && j.b === id);
        assert.ok(j && Math.abs(j.y - D.hqWorldFrame(id).y) < 1e-6, id + ' stands on its pad on the land');
    }
});

test('THE PARTS BESIDE: from the land the hall and the keep stand whole beside the ward, and are never crossed into', () => {
    const nbs = D.hqStageNeighbours('land');
    for (const id of [P + 'camelot_hall', P + 'camelot_keep']) {
        const nb = nbs.find(n => n.id === id);
        assert.ok(nb && nb.beside && nb.spans.length === 0 && nb.via === P + 'camelot_ward', 'the land draws ' + id + ' beside the ward');
        const r = nb.rect, S = HQ.rooms.land.shell;
        assert.equal(D.hqStageWhere(S.w / 2, S.d / 2, [nb], (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 1), null, 'no crossing into ' + id + ' from the land');
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

test('THE SUMMIT: its shoulders fall away; the renderer reads the outer ground\'s keep and lift (off the land)', () => {
    const sm = HQ.rooms[SUMMIT];
    assert.ok(sm.terrain.outer.lift < 0, 'the summit\'s shoulders fall away');
    assert.match(rendererSrc, /oKeep = \(OO\.keep != null\)/, 'the outer ground reads outer.keep');
    assert.match(rendererSrc, /oLift \* sm\(e \/ 30\)/, 'the outer ground reads outer.lift');
});

test('THE ROOF: a closed staged part is roofed, tagged with the ceiling', () => {
    assert.match(rendererSrc, /hqStagePart\(roofId\)/, 'the roof is for staged parts');
    assert.match(rendererSrc, /rf\._ew_hqPart = 'ceil'; rf\._ew_hqRoof = true;/, 'the roof drops with the ceiling in a battle');
});

test('the walker: on the summit from its south edge to its terrace, 5 m over its pad', heavy, () => {
    const S = HQ.rooms[SUMMIT].shell, info = D.hqTerrainInfo(SUMMIT), reach = D.hqTerrainReach(info, 0, S.d / 2 - 1.5);
    let top = -1; reach.forEach(v => { if (v > top) top = v; });
    assert.ok(reach.size > 0 && top >= 4.9, 'the summit\'s terrace is reached: ' + top.toFixed(2) + ' m over the pad');
});
