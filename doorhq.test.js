// door-hq.test.js — headless validation of the D.O.O.R. headquarters layout.
//
// Loads the REAL data.js (load-data.js) and checks the invariants the HQ
// builder (three-renderer.js) and the flow layer (map.js) silently rely on:
// every door leaf / prop key resolves, every catalogue entry names a .glb
// with exactly one target size, doors don't overlap each other or the stair
// arcs, the six sector bays partition the launch maps, and the door-state /
// mastery helpers behave. Repo-only tooling (CLAUDE.md TOOLING) — not an R2
// file. Runs under `npm test`.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { loadGameData } = require('./load-data');

const D = loadGameData();
const HQ = D.DOOR_HQ;
const ROOM = HQ && HQ.rooms && HQ.rooms.central_egress;

test('DOOR_HQ loads with the Central Egress room and its helpers', () => {
    assert.ok(HQ, 'DOOR_HQ missing');
    assert.ok(ROOM, 'central_egress room missing');
    assert.strictEqual(typeof HQ.units, 'number');
    assert.ok(HQ.assets && /^https:\/\//.test(HQ.assets.models) && /\/$/.test(HQ.assets.models));
    assert.ok(HQ.assets && /^https:\/\//.test(HQ.assets.textures) && /\/$/.test(HQ.assets.textures));
    for (const fn of ['hqPolar', 'hqSectorOfMap', 'hqMapMastered', 'doorSiteState']) {
        assert.strictEqual(typeof D[fn], 'function', fn + ' helper missing');
    }
    assert.ok(ROOM.shell && ROOM.shell.radius > 0 && ROOM.shell.mezz && ROOM.shell.mezz.outer > ROOM.shell.mezz.inner);
    assert.ok(ROOM.spawn && typeof ROOM.spawn.deg === 'number' && typeof ROOM.spawn.r === 'number');
});

test('every texture the shell names exists in the texture table', () => {
    const S = ROOM.shell;
    const names = [S.floor, S.wall, S.dado, S.trim, S.ceiling, S.stair].concat((S.bands || []).map(b => b[2]));
    if (S.spokes) names.push(S.spokes.tex);
    if (ROOM.desk) names.push(ROOM.desk.top, ROOM.desk.front);
    const problems = names.filter(n => n && !HQ.textures[n]);
    assert.deepStrictEqual(problems, []);
    for (const [k, f] of Object.entries(HQ.textures)) assert.match(f, /\.png$/, 'texture ' + k);
});

test('every catalogue entry names a .glb and exactly one target size (leaves exempt)', () => {
    const problems = [];
    for (const [k, c] of Object.entries(HQ.catalogue)) {
        if (!c.file || !/\.glb$/.test(c.file)) problems.push(k + ': no .glb file');
        if (/[\/\\]/.test(c.file || '')) problems.push(k + ': file must be a bare filename');
        if (c.leaf) continue;
        const sizes = ['h', 'span'].filter(s => typeof c[s] === 'number');
        if (sizes.length !== 1) problems.push(k + ': needs exactly one of h/span, has ' + sizes.join(','));
        if (typeof c.foot !== 'number' || c.foot < 0) problems.push(k + ': foot radius missing');
    }
    assert.deepStrictEqual(problems, []);
});

test('every door leaf and prop key resolves to a catalogue entry', () => {
    const problems = [];
    for (const d of ROOM.doors) {
        if (d.leaf == null) { if (!d.proc) problems.push(d.id + ': no leaf and no proc'); continue; }
        const c = HQ.catalogue[d.leaf];
        if (!c) problems.push(d.id + ': leaf ' + d.leaf + ' not in catalogue');
        else if (!c.leaf) problems.push(d.id + ': ' + d.leaf + ' is not a leaf entry');
    }
    for (const p of ROOM.props) {
        if (!HQ.catalogue[p.key]) problems.push('prop ' + p.key + ' not in catalogue');
        if (typeof p.deg !== 'number') problems.push('prop ' + p.key + ' has no deg');
        if (!HQ.catalogue[p.key] || (!HQ.catalogue[p.key].wall && p.r == null)) {
            if (HQ.catalogue[p.key] && !HQ.catalogue[p.key].wall) problems.push('prop ' + p.key + ' @' + p.deg + ' has no r');
        }
    }
    assert.deepStrictEqual(problems, []);
});

test('doors carry exactly one action and unique ids', () => {
    const ids = new Set();
    const problems = [];
    for (const d of ROOM.doors) {
        if (ids.has(d.id)) problems.push('duplicate door id ' + d.id);
        ids.add(d.id);
        const keys = Object.keys(d.action || {}).filter(k => ['fn', 'sector', 'room', 'overlay'].includes(k));
        if (keys.length !== 1) problems.push(d.id + ': action must be exactly one of fn/sector/room/overlay');
        if (d.action && d.action.sector && !HQ.sectors[d.action.sector]) problems.push(d.id + ': unknown sector ' + d.action.sector);
        if (![0, 1].includes(d.level || 0)) problems.push(d.id + ': level must be 0 or 1');
    }
    for (const c of ROOM.counters) {
        if (ids.has(c.id)) problems.push('counter id collides with a door: ' + c.id);
        ids.add(c.id);
    }
    assert.deepStrictEqual(problems, []);
});

test('doors on a level are ≥ 25° apart and clear of the stair arcs', () => {
    const problems = [];
    const norm = d => ((d % 360) + 360) % 360;
    const diff = (a, b) => { const x = norm(a - b); return Math.min(x, 360 - x); };
    for (const level of [0, 1]) {
        const ds = ROOM.doors.filter(d => (d.level || 0) === level);
        for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
            if (diff(ds[i].deg, ds[j].deg) < 25) problems.push(`${ds[i].id} and ${ds[j].id} are ${diff(ds[i].deg, ds[j].deg)}° apart on level ${level}`);
        }
    }
    for (const d of ROOM.doors.filter(d => !(d.level || 0))) {
        for (const st of ROOM.stairs) {
            const lo = Math.min(st.from, st.to) - 7, hi = Math.max(st.from, st.to) + 7;
            const a = norm(d.deg);
            if ((a >= lo && a <= hi) || (a + 360 >= lo && a + 360 <= hi)) problems.push(`${d.id} @${d.deg}° sits inside stair ${st.id}`);
        }
    }
    assert.deepStrictEqual(problems, []);
});

test('the six sector bays partition the launch maps exactly once', () => {
    const launch = D.EW_MAP_META.map(m => m.id).filter(id => !/_delta$/.test(id));
    const seen = new Map();
    for (const [k, s] of Object.entries(HQ.sectors)) {
        assert.ok(s.label && Array.isArray(s.maps) && s.maps.length, 'sector ' + k);
        for (const id of s.maps) seen.set(id, (seen.get(id) || 0) + 1);
    }
    const problems = [];
    for (const id of launch) if (seen.get(id) !== 1) problems.push(id + ' appears ' + (seen.get(id) || 0) + ' times');
    for (const id of seen.keys()) if (!launch.includes(id)) problems.push(id + ' is not a launch map');
    assert.deepStrictEqual(problems, []);
    /* Array.from: values from the data sandbox carry a foreign Array
       prototype, which deepStrictEqual rejects even with equal contents */
    const bays = Array.from(ROOM.doors.filter(d => d.action && d.action.sector).map(d => d.action.sector)).sort();
    assert.deepStrictEqual(bays, Array.from(Object.keys(HQ.sectors)).sort(), 'every sector needs one bay door');
    assert.strictEqual(D.hqSectorOfMap('prebuilt_hell'), 'diplomatic');
    assert.strictEqual(D.hqSectorOfMap('nope'), null);
});

test('spawn, counters, npc spots and floor props sit inside the walkable ring', () => {
    const S = ROOM.shell;
    const problems = [];
    const check = (label, p) => {
        const level = p.level || 0;
        const rMax = level ? S.mezz.outer - 0.3 : S.radius - 0.3;
        const rMin = level ? S.mezz.inner : ((ROOM.desk && ROOM.desk.rOuter) || 0);
        if (p.r == null) return;
        if (p.r > rMax) problems.push(`${label} r=${p.r} is outside the wall (max ${rMax})`);
        if (p.r < rMin && !(p.y > 0.5)) problems.push(`${label} r=${p.r} is inside the desk / off the slab (min ${rMin})`);
    };
    check('spawn', ROOM.spawn);
    ROOM.counters.forEach(c => check('counter ' + c.id, c));
    (ROOM.npcSpots || []).forEach((s, i) => check('npcSpot ' + i, s));
    (ROOM.agents || []).forEach((s, i) => { if (s.r > 3 && (s.level || 0) === 0) check('agent ' + i, s); });
    ROOM.props.forEach(p => { if (p.r != null) check('prop ' + p.key + '@' + p.deg, p); });
    assert.deepStrictEqual(problems, []);
    for (const st of ROOM.stairs) {
        assert.ok(st.rIn > (ROOM.desk ? ROOM.desk.rOuter : 0) && st.rOut <= S.radius, st.id + ' radii');
        assert.ok(Math.abs(st.to - st.from) >= 30 && Math.abs(st.to - st.from) <= 90, st.id + ' arc length');
        assert.ok(st.steps >= 12, st.id + ' steps');
    }
});

test('the rank ladder is DOORMAT…THE DOORMAN and every rank door leaf exists', () => {
    const titles = Array.from(D.DOOR_TEXT.CLEARANCE, c => c.title);
    assert.deepStrictEqual(titles, ['DOORMAT', 'DOORSTOP', 'KNOCKER', 'KEYHOLDER', 'GATEKEEPER', 'THE DOORMAN']);
    for (const c of D.DOOR_TEXT.CLEARANCE) {
        assert.ok(HQ.catalogue[c.door] && HQ.catalogue[c.door].leaf, 'rank door ' + c.door);
    }
    assert.strictEqual(D.doorClearance(null).title, 'DOORMAT');
    assert.strictEqual(D.doorClearance({ door: { clearance: 6 } }).title, 'THE DOORMAN');
});

test('doorSiteState honours clearance gates, sector locks and mastery', () => {
    const elevator = ROOM.doors.find(d => d.id === 'elevator');
    const records = ROOM.doors.find(d => d.id === 'records');
    const quarantined = ROOM.doors.find(d => d.action && d.action.sector === 'quarantined');
    const celestial = ROOM.doors.find(d => d.action && d.action.sector === 'celestial');
    assert.strictEqual(D.doorSiteState(elevator, null), 'clearance');
    assert.strictEqual(D.doorSiteState(elevator, { door: { clearance: 4 } }), 'open');
    assert.strictEqual(D.doorSiteState(records, null), 'open');
    assert.strictEqual(D.doorSiteState(quarantined, { door: { clearance: 6 } }), 'sealed');
    assert.strictEqual(D.doorSiteState(celestial, null), 'unstable');
    /* master every celestial map through the monotonic progress flags */
    const unlocked = {};
    for (const id of HQ.sectors.celestial.maps) for (const c of HQ.masteryConditions) unlocked['site:' + id + ':' + c] = 1;
    assert.strictEqual(D.doorSiteState(celestial, { progress: { unlocked } }), 'stabilized');
});

test('hqMapMastered reads progress flags and the recent match history', () => {
    const id = 'prebuilt_moon';
    assert.strictEqual(D.hqMapMastered(id, null), false);
    const hist = HQ.masteryConditions.map(c => ({ mapId: id, result: 'win', winCondition: c }));
    assert.strictEqual(D.hqMapMastered(id, { matchHistory: hist }), true);
    assert.strictEqual(D.hqMapMastered(id, { matchHistory: hist.slice(1) }), false);
    const lossOnly = HQ.masteryConditions.map(c => ({ mapId: id, result: 'loss', winCondition: c }));
    assert.strictEqual(D.hqMapMastered(id, { matchHistory: lossOnly }), false);
    const p = D.hqPolar(90, 10);
    assert.ok(Math.abs(p.x - 10) < 1e-9 && Math.abs(p.z) < 1e-9, 'east is +x');
    const n = D.hqPolar(0, 5);
    assert.ok(Math.abs(n.x) < 1e-9 && Math.abs(n.z + 5) < 1e-9, 'north is -z');
});

/* ── Phase 1.3 / 1.4 helpers (2026-09-03): mission pools + site mastery ── */

test('hqMissionPool: natives first, at least 4 distinct races for every launch map', () => {
    const problems = [];
    for (const m of D.EW_MAP_META.filter(x => !x.isDelta)) {
        const pool = D.hqMissionPool(m.id, 4);
        const natives = D.doorSiteCrossings(m.label);
        if (pool.length < 4) problems.push(m.id + ': only ' + pool.length);
        if (new Set(pool).size !== pool.length) problems.push(m.id + ': duplicates');
        if (pool.natives !== natives.length) problems.push(m.id + ': natives count ' + pool.natives + ' vs ' + natives.length);
        for (let i = 0; i < natives.length; i++) if (pool[i] !== natives[i]) { problems.push(m.id + ': natives must lead the pool'); break; }
        for (const r of pool) if (!D.AVAILABLE_RACES.includes(r)) problems.push(m.id + ': unknown race ' + r);
    }
    assert.deepStrictEqual(problems, []);
    /* the Δ id resolves to its site; padding comes from a shared biome first */
    const moon = D.hqMissionPool('prebuilt_moon_delta', 4);
    assert.deepStrictEqual(Array.from(moon.slice(0, 3)), Array.from(D.doorSiteCrossings('Moon')));
    assert.ok(D.doorSiteCrossings('Mars').includes(moon[3]), 'Moon pads from Mars (shared space biome), got ' + moon[3]);
    assert.deepStrictEqual(Array.from(D.hqMissionPool('nope', 4)), []);
});

test('hqSiteId strips the Δ suffix and mastery counts Δ-board wins for the site', () => {
    assert.strictEqual(D.hqSiteId('prebuilt_moon_delta'), 'prebuilt_moon');
    assert.strictEqual(D.hqSiteId('prebuilt_moon'), 'prebuilt_moon');
    assert.strictEqual(D.hqSiteId(null), '');
    const hist = HQ.masteryConditions.map(c => ({ mapId: 'prebuilt_moon_delta', result: 'win', winCondition: c }));
    assert.strictEqual(D.hqMapMastered('prebuilt_moon', { matchHistory: hist }), true);
    assert.strictEqual(D.hqMapMastered('prebuilt_moon_delta', { matchHistory: hist }), true);
    /* the flag writer (battle.js) stores site:<site>:<cond> — read back for either id */
    const unlocked = {};
    for (const c of HQ.masteryConditions) unlocked['site:prebuilt_mars:' + c] = 1;
    assert.strictEqual(D.hqMapMastered('prebuilt_mars_delta', { progress: { unlocked } }), true);
});

test('hqMasteryCount tallies stabilized sites over the six bays', () => {
    const none = D.hqMasteryCount(null);
    const launch = D.EW_MAP_META.filter(m => !m.isDelta).length;
    assert.deepStrictEqual({ mastered: none.mastered, total: none.total }, { mastered: 0, total: launch });
    const unlocked = {};
    for (const id of HQ.sectors.celestial.maps) for (const c of HQ.masteryConditions) unlocked['site:' + id + ':' + c] = 1;
    const some = D.hqMasteryCount({ progress: { unlocked } });
    assert.strictEqual(some.mastered, HQ.sectors.celestial.maps.length);
    assert.strictEqual(some.total, launch);
});

test('every bay threshold has an 8×8 Δ board to cross onto (plan D3)', () => {
    const ids = new Set(D.EW_MAP_META.map(m => m.id));
    const missing = [];
    for (const k of Object.keys(HQ.sectors)) for (const id of HQ.sectors[k].maps) if (!ids.has(id + '_delta')) missing.push(id);
    assert.deepStrictEqual(missing, []);
});
