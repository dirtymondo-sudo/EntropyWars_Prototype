// motion-maps.test.js — MOVING MAPS (2026-09-12): the three travelling sites
// (Queen Anne's Revenge · The Derelict · The Looking-Glass), Heaven's drift,
// and the renderer's MOTION system. Data is loaded headlessly (load-data.js);
// the renderer / server / audio are source-scanned (the same guard style as
// doorhq.test.js), so a rename on either side fails `npm test` instead of
// leaving a map still or a site unlisted.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const REPO = __dirname;
const { makeSandbox } = require(path.join(REPO, 'load-data.js'));
const sb = makeSandbox({ quiet: true });
vm.runInContext(fs.readFileSync(path.join(REPO, 'data.js'), 'utf8'), sb, { filename: 'data.js' });
const D = vm.runInContext('({ EW_MAP_META, PREBUILT_MAPS, DOOR_HQ, DOOR_TEXT, TERRAIN_RULES, MF_TID, doorSiteCrossings, hqSiteRoom, hqSiteRoomId, hqSectorOfMap })', sb);
const src = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const TR = src('three-renderer.js'), SV = src('server.js'), AU = src('audio.js');

const MOVING = [
    { id: 'prebuilt_revenge', near: 'revenge', kind: 'sea', scenery: 'sea', roomNo: '1717', bay: 'hollow', bed: ['deep_water', 'deep_water', 'wood', 'wood', 'wood'] },
    { id: 'prebuilt_derelict', near: 'derelict', kind: 'space', scenery: 'wreckage', roomNo: '426', bay: 'celestial', bed: ['void', 'void', 'gunmetal', 'gunmetal', 'gunmetal'] },
    { id: 'prebuilt_lookingglass', near: 'lookingglass', kind: 'void', scenery: 'wonder', roomNo: 'E4', bay: 'diplomatic', bed: ['void', 'void', 'marble', 'marble', 'marble'] },
];

test('the three moving maps are launch maps with a Δ, a near setting, a far roster and an env.motion row', () => {
    for (const M of MOVING) {
        const meta = D.EW_MAP_META.find(m => m.id === M.id);
        assert.ok(meta && !meta.isDelta, M.id + ' is a launch map');
        assert.strictEqual(meta.near, M.near, M.id + ': near builder');
        assert.strictEqual(meta.env.scenery, M.scenery, M.id + ': far roster');
        const mo = meta.env.motion;
        assert.ok(mo && mo.kind === M.kind && (mo.axis === 'x' || mo.axis === 'z'), M.id + ': env.motion kind + axis');
        assert.ok(mo.speed > 0 && mo.ramp > 0 && mo.max >= 1, M.id + ': speed / ramp / max');
        assert.ok(mo.sky == null || (mo.sky >= 0 && mo.sky <= 2), M.id + ': sky streaming amount');
        if (mo.orbit) assert.ok(['sun', 'moon'].includes(mo.orbit.body) && mo.orbit.period > 0 && mo.orbit.near > 0 && mo.orbit.near <= 1, M.id + ': orbit');
        if (mo.storm) assert.ok(mo.storm.to > mo.storm.from && mo.storm.from >= 1, M.id + ': storm window');
        if (mo.sea) assert.ok(mo.seaDepth > 1, M.id + ': a sea map says how deep the water lies');
        if (mo.ambience) assert.match(AU, new RegExp(mo.ambience + ':\\s*`'), M.id + ': ambience bed ' + mo.ambience + ' exists in audio.js');
        const d = D.PREBUILT_MAPS[M.id + '_delta'], full = D.PREBUILT_MAPS[M.id];
        assert.ok(d && d.isDelta && full, M.id + ': full + Δ built');
        assert.deepStrictEqual(Array.from(d.bed), M.bed, M.id + ': the Δ carries its own bed');
        for (const k of M.bed) assert.ok(D.TERRAIN_RULES[k] && D.MF_TID[k], M.id + ': bed layer ' + k + ' is a real terrain');
        /* the Δ's bed is what the voxels wear (the delta test reads `bed`; this pins the plumbing) */
        for (let z = 0; z < 5; z++) assert.strictEqual(d.voxels[7][3][z].tid, D.MF_TID[M.bed[z]], M.id + ': spawn-row voxel z' + z);
        /* the Δ preset carries the motion too (state.mapEnv is the preset's env) */
        const dMeta = D.EW_MAP_META.find(m => m.id === M.id + '_delta');
        assert.ok(dMeta && dMeta.env && dMeta.env.motion && dMeta.env.motion.kind === M.kind && dMeta.env.near === M.near, M.id + ': the Δ env carries motion + near');
    }
    /* Heaven drifts, gently, and stays a divine-roster map */
    const heaven = D.EW_MAP_META.find(m => m.id === 'prebuilt_heaven');
    assert.ok(heaven.env.motion && heaven.env.motion.kind === 'drift' && heaven.env.motion.speed <= 0.4 && heaven.env.scenery === 'divine', 'Heaven: a slow drift, nothing else changed');
    /* nobody else moves */
    const movers = Array.from(D.EW_MAP_META.filter(m => !m.isDelta && m.env && m.env.motion).map(m => m.id)).sort();
    assert.deepStrictEqual(movers, ['prebuilt_derelict', 'prebuilt_heaven', 'prebuilt_lookingglass', 'prebuilt_revenge']);
});

test('the sites are in the building: thresholds with numbers, a bay each, walkable rooms, site files, natives', () => {
    const HQ = D.DOOR_HQ;
    for (const M of MOVING) {
        const th = HQ.thresholds[M.id];
        assert.ok(th && th.roomNo === M.roomNo && th.why && th.note && HQ.catalogue[th.leaf], M.id + ': threshold ' + M.roomNo);
        assert.strictEqual(D.hqSectorOfMap(M.id), M.bay, M.id + ': bay');
        assert.ok(!HQ.sectors[M.bay].locked, M.id + ': its bay is not sealed (the map must be playable from the building)');
        assert.ok(HQ.siteRooms.built.includes(M.id), M.id + ': a walkable site');
        assert.ok(HQ.siteRooms.near[M.near] && HQ.siteRooms.near[M.near].w >= 1.15, M.id + ': a near row (the walkway is at least two metres)');
        const room = HQ.rooms[D.hqSiteRoomId(M.id)];
        assert.ok(room && room.shell.open && room.shell.sky && room.shell.sky.scenery === M.scenery, M.id + ': an outdoor room under the map\'s sky');
        assert.ok(room.shell.mood.signLines.n[1] === 'ROOM ' + M.roomNo, M.id + ': the north sign wears the number');
        assert.ok(D.DOOR_TEXT.SITE_FILES[M.id] && D.DOOR_TEXT.SITE_FILES[M.id].summary.length > 120, M.id + ': a site file');
        const label = D.EW_MAP_META.find(m => m.id === M.id).label;
        assert.ok(D.doorSiteCrossings(label).length >= 1, M.id + ': at least one native (' + label + ')');
    }
    const rev = HQ.rooms[D.hqSiteRoomId('prebuilt_revenge')];
    assert.ok(rev.shell.moat && rev.shell.moat.key === 'deep_water' && rev.shell.moat.quay >= 2, 'the Revenge is a moat room: the deck on a quay over deep water');
    /* every point of entry names a real site label */
    const labels = new Set(D.EW_MAP_META.filter(m => !m.isDelta).map(m => m.label));
    for (const [race, site] of Object.entries(D.DOOR_TEXT.POINT_OF_ENTRY)) assert.ok(labels.has(site), race + ': point of entry ' + site + ' is a site');
    assert.strictEqual(D.DOOR_TEXT.POINT_OF_ENTRY.pirate, "Queen Anne's Revenge");
});

test('the ranked pool mirrors the roster (server.js MAP_POOL)', () => {
    for (const M of MOVING) {
        assert.match(SV, new RegExp("modeId: '" + M.id + "_delta', w: 8, h: 8, team: 4"), M.id + ': Δ in MAP_POOL');
        assert.match(SV, new RegExp("modeId: '" + M.id + "', w: 16, h: 16, team: 6"), M.id + ': full map in MAP_POOL');
    }
});

test('source scan: the renderer\'s MOTION system and the three settings', () => {
    /* the motion clock and its consumers */
    for (const fn of ['_motionTick', '_motionAnimate', '_hzPlaceStream', '_motionBuildMotes', '_motionReset', '_motionInfo', '_motionBoardY']) assert.match(TR, new RegExp('function ' + fn + '\\('), fn);
    assert.match(TR, /_hzMotion = \(me && me\.motion && typeof me\.motion === 'object' && !\(typeof window !== 'undefined' && window\.EW_NO_MAP_MOTION\)\) \? me\.motion : null;/, 'env.motion read each frame, with the kill-switch');
    assert.match(TR, /_motionTick\(performance\.now\(\) \/ 1000\);/, 'the clock ticks from the environment update');
    assert.match(TR, /_motionAnimate\(t\);\s*\/\/ MOVING MAPS/, 'the floater loop moves the streams');
    assert.match(TR, /if \(streaming\) \{ _hzPlaceStream\(mesh, rng, pick, stream\); continue; \}/, 'the roster streams on a travelling map');
    assert.match(TR, /if \(streaming\) _motionBuildMotes\(rng, stream\);/, 'the motes');
    assert.match(TR, /state\.round > 0\) \? state\.round : 1;/, 'the speed reads state.round (synced online — nothing relayed)');
    /* the sky */
    for (const u of ['uSkyFlow', 'uSunNear', 'uMoonNear']) {
        assert.match(TR, new RegExp("uniform float " + u + ";"), u + ' declared');
        assert.match(TR, new RegExp(u + ": \\{ value: 0\\.0 \\}"), u + ' in _envUni');
        assert.match(TR, new RegExp("_envUni\\." + u + "\\.value = _motion\\."), u + ' written by the environment tick');
    }
    assert.match(TR, /u\.uSkyFlow\.value = 0; u\.uSunNear\.value = 0; u\.uMoonNear\.value = 0;/, 'the HQ / menu sky is still');
    assert.match(TR, /float sunR=0\.05\+0\.42\*uSunNear;/, 'the sun swells on a close pass');
    assert.match(TR, /float moonR=mix\(0\.06,0\.095,bloodM\)\+0\.42\*uMoonNear;/, 'the moon swells on a close pass');
    assert.match(TR, /\(1 \+ 7\.0 \* _motion\.moonNear\)/, 'the 3D moon mesh swells with it');
    assert.match(TR, /Math\.max\(S\.storm, _motion\.storm\)/, 'the storm floor rides the weather uniform');
    /* the sea */
    assert.match(TR, /var _fluidFlowUniform = \{ value: null \};/, 'the caustic flow uniform');
    assert.match(TR, /vec2 ewP = \(vEwWorldPos\.xz \+ uFluidFlow\) \/ max\(uFluidTile, 0\.0001\);/, 'the caustic web flows');
    assert.match(TR, /if \(o\.stream\) _motionSheets\.push\(\{ mesh: m, x0: m\.position\.x, z0: m\.position\.z, per: ts \}\);/, 'a streaming moat sheet');
    assert.match(TR, /_fluidFlowUniform\.value\.set\(0, 0\);\s*\/\/ the building's water holds still/, 'the HQ moat resets the flow');
    /* the three rosters and settings */
    for (const key of ['sea', 'wreckage', 'wonder']) assert.match(TR, new RegExp('^\\s*' + key + ': \\[', 'm'), 'roster ' + key);
    for (const fn of ['_hzSeaIsland', '_hzSeaStack', '_hzLighthouse', '_hzGhostShip', '_hzAsteroid', '_hzHullChunk', '_hzGirderKnot', '_hzVoidSolid', '_hzChessPiece', '_hzChessPieceFar', '_hzTeacup', '_hzPlayingCard', '_nrStreakTex', '_nrShipRail', '_nrWake']) assert.match(TR, new RegExp('function ' + fn + '\\('), fn);
    for (const M of MOVING) {
        const m = TR.match(new RegExp('_NR_BUILDERS\\.' + M.near + ' = function \\(group, ctx\\) \\{\\s*var K = _nrKit\\(group, ctx, \\{ w: ([0-9.]+)'));
        assert.ok(m, M.near + ': a near builder');
        assert.strictEqual(+m[1], D.DOOR_HQ.siteRooms.near[M.near].w, M.near + ': the builder\'s w is the room\'s');
    }
    assert.match(TR, /_nrMoat\(K, \{ key: 'deep_water', depth: _NR_SEA_DEPTH, pad: 40, stream: true \}\);/, 'the Revenge sails on a streaming sea');
    assert.strictEqual(+TR.match(/var _NR_SEA_DEPTH = ([0-9.]+);/)[1], D.EW_MAP_META.find(m => m.id === 'prebuilt_revenge').env.motion.seaDepth, 'the setting and the meta row agree on the sea\'s depth');
    /* the room never inherits the wake, the rigging, the plating or the keel as blockers */
    assert.match(TR, /if \(!HQ\) \[\[K\.X0 \+ 0\.3 \* ts, K\.Z0 \+ 0\.3 \* ts\]/, 'no rigging in the room');
    assert.match(TR, /if \(w <= 0 \|\| d <= 0 \|\| HQ\) return null;/, 'no plating in the room');
    /* the public readout */
    assert.match(TR, /motion: function \(\) \{ return _motionInfo\(\); \},/, 'ThreeRenderer.motion()');
    /* the audio bed */
    assert.match(AU, /state\.mapEnv\.motion\.ambience/, 'a moving map names its ambience bed');
    assert.match(AU, /function _motionStormLevel\(\)/, 'the storm brings the thunder');
});
