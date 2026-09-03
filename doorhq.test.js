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
        /* procedural entries (plan 2.7) name a builder instead of a file */
        if (c.proc) { if (typeof c.proc !== 'string' || c.file) problems.push(k + ': proc entries name a builder and no file'); }
        else if (!c.file || !/\.glb$/.test(c.file)) problems.push(k + ': no .glb file');
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
        const keys = Object.keys(d.action || {}).filter(k => ['fn', 'sector', 'room', 'overlay', 'mission'].includes(k));
        if (keys.length !== 1) problems.push(d.id + ': action must be exactly one of fn/sector/room/overlay/mission');
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

/* ── Phase 2.2 (2026-09-03): the wedge kit as furniture, and 3.1 checklists ── */

test('wedge catalogue entries describe a real sector, ring props resolve, the dispatch desk stays procedural', () => {
    const w = HQ.catalogue.desk_wedge_b.wedge;
    assert.ok(w && w.deg > 20 && w.deg < 120 && w.apex > 0.5 && w.rOut > w.rIn && w.rIn > 0, 'desk_wedge_b.wedge geometry');
    for (const p of ROOM.props.filter(p => p.ring)) {
        const c = HQ.catalogue[p.key];
        assert.ok(c && c.wedge, 'ring prop ' + p.key + ' needs a catalogue wedge entry');
        assert.ok(p.ring.n >= 1 && p.ring.n * c.wedge.deg <= 361, 'ring ' + p.key + ' overfills the circle');
        assert.strictEqual(typeof p.r, 'number', 'ring ' + p.key + ' needs r');
    }
    assert.ok(ROOM.props.some(p => p.ring), 'the briefing half-ring is placed');
    assert.ok(ROOM.props.some(p => p.key === 'reception_wedge'), 'the reception counter is placed');
    assert.ok(ROOM.desk && ROOM.desk.mode === 'procedural', 'the dispatch desk stays procedural (user decision 2026-09-03)');
});

test('mezzanine floor props leave a walkable band (the slab is only 2.2 m wide)', () => {
    const S = ROOM.shell, BODY = 0.34;   // three-renderer HQ_BODY_R
    const lo = S.mezz.inner + 0.62, hi = S.mezz.outer - 0.55;   // _hqSurface's slab band
    const problems = [];
    for (const p of ROOM.props) {
        if ((p.level || 0) !== 1 || p.r == null || p.y > 0.5) continue;
        const c = HQ.catalogue[p.key];
        if (!c || !(c.foot > 0) || c.mount || p.mount) continue;
        const free = Math.max((p.r - c.foot - BODY) - lo, hi - (p.r + c.foot + BODY));
        if (free < 2 * BODY) problems.push(`${p.key}@${p.deg} leaves ${free.toFixed(2)} m of the mezzanine`);
    }
    assert.deepStrictEqual(problems, []);
});

test('hqSiteMastery lists the per-condition checklist behind hqMapMastered', () => {
    const id = 'prebuilt_mars';
    const none = D.hqSiteMastery(id, null);
    assert.strictEqual(none.done, 0);
    assert.strictEqual(none.mastered, false);
    assert.deepStrictEqual(Array.from(none.missing), Array.from(HQ.masteryConditions));
    const one = D.hqSiteMastery(id, { progress: { unlocked: { ['site:' + id + ':wipeout']: 1 } } });
    assert.strictEqual(one.done, 1);
    assert.ok(one.have.wipeout && !one.have.tower_destroyed);
    const hist = HQ.masteryConditions.map(c => ({ mapId: id + '_delta', result: 'win', winCondition: c }));
    const all = D.hqSiteMastery(id, { matchHistory: hist });
    assert.strictEqual(all.mastered, true);
    assert.strictEqual(all.done, all.total);
    assert.strictEqual(D.hqMapMastered(id, { matchHistory: hist }), true);
    for (const c of HQ.masteryConditions) assert.ok(HQ.masteryLabels[c], 'masteryLabels for ' + c);
});


/* ── Phase 2.6 (2026-09-03): the six bays as curved corridors ── */

const BAYS = Object.keys(HQ.sectors).map(k => [k, HQ.rooms[D.hqBayId(k)]]);

test('every sector generates a bay room: kind bay, a way out at deg 0, one threshold per map', () => {
    const problems = [];
    for (const [k, room] of BAYS) {
        if (!room) { problems.push(k + ': no bay room'); continue; }
        if (room.kind !== 'bay' || room.sector !== k) problems.push(k + ': kind/sector');
        const S = room.shell;
        if (!(S.rOut > S.rIn && S.rOut - S.rIn >= 3.5 && S.arc[0] < 0 && S.arc[1] === -S.arc[0] && S.wallH > 2.5)) problems.push(k + ': shell numbers');
        const out = room.doors.find(d => d.id === 'egress');
        if (!out || out.side !== 'in' || out.deg !== 0 || !out.action || out.action.room !== 'central_egress') problems.push(k + ': egress door');
        const bayDoor = ROOM.doors.find(d => d.action && d.action.sector === k);
        if (!out || !bayDoor || out.action.at !== bayDoor.id) problems.push(k + ': the way out must land at the egress bay door (' + (bayDoor && bayDoor.id) + ')');
        if (out && bayDoor && (out.leaf !== bayDoor.leaf || !!out.wide !== !!bayDoor.wide)) problems.push(k + ': the way out must wear the same leaf as the egress bay door');
        const th = room.doors.filter(d => d.action && d.action.mission);
        const want = Array.from(HQ.sectors[k].maps).sort();
        const got = Array.from(th.map(d => d.action.mission)).sort();
        if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(k + ': thresholds ' + got.join(',') + ' vs maps ' + want.join(','));
        for (const d of th) {
            if (d.side !== 'out') problems.push(d.id + ': thresholds hang on the outer wall');
            if (!(d.deg > S.arc[0] + 4 && d.deg < S.arc[1] - 4)) problems.push(d.id + ' @' + d.deg + ' is outside the corridor arc ±' + S.arc[1]);
            if (d.id !== 'site_' + d.action.mission) problems.push(d.id + ': id must be site_<mapId>');
            if (!HQ.catalogue[d.leaf] || !HQ.catalogue[d.leaf].leaf) problems.push(d.id + ': leaf ' + d.leaf);
        }
        const ids = new Set();
        for (const d of room.doors) { if (ids.has(d.id)) problems.push(k + ': duplicate door id ' + d.id); ids.add(d.id); }
        /* neighbouring thresholds must not overlap along the outer wall (panels are 2.5 / 3.3 m wide) */
        const sorted = th.slice().sort((a, b) => a.deg - b.deg);
        for (let i = 1; i < sorted.length; i++) {
            const gap = (sorted[i].deg - sorted[i - 1].deg) * Math.PI / 180 * S.rOut;
            const need = ((sorted[i].wide ? 3.3 : 2.5) + (sorted[i - 1].wide ? 3.3 : 2.5)) / 2;
            if (gap < need) problems.push(`${sorted[i - 1].id} and ${sorted[i].id} overlap (${gap.toFixed(2)} m of wall, need ${need})`);
        }
        /* the way out's panel must fit on the inner wall */
        if (out) {
            const innerLen = (S.arc[1] - S.arc[0]) * Math.PI / 180 * S.rIn;
            if (innerLen < (out.wide ? 3.3 : 2.5) + 2) problems.push(k + ': inner wall too short for the way out');
        }
        if (!(room.spawn && room.spawn.deg === 0 && room.spawn.r > S.rIn + 0.8 && room.spawn.r < S.rOut - 0.8)) problems.push(k + ': spawn must stand in the corridor at the way out');
    }
    assert.deepStrictEqual(problems, []);
});

test('bay props resolve and sit inside the corridor; wall props name a side; ceiling props hang', () => {
    const problems = [];
    for (const [k, room] of BAYS) {
        const S = room.shell;
        for (const p of room.props) {
            const c = HQ.catalogue[p.key];
            if (!c) { problems.push(k + ': prop ' + p.key + ' not in catalogue'); continue; }
            const onWall = (c.wall || p.wall) && p.r == null;
            if (onWall && p.side !== 'in') problems.push(k + ': wall prop ' + p.key + '@' + p.deg + ' must hang on the inner wall (side in) — the outer wall is thresholds');
            if (!onWall && p.r == null) problems.push(k + ': prop ' + p.key + '@' + p.deg + ' has no r');
            if (p.r != null && (p.r < S.rIn + 0.3 || p.r > S.rOut - 0.3)) problems.push(k + ': prop ' + p.key + '@' + p.deg + ' r=' + p.r + ' is in a wall');
            if (Math.abs(p.deg) > S.arc[1] - 1.5) problems.push(k + ': prop ' + p.key + '@' + p.deg + ' is in an end cap');
            if ((c.ceil || p.ceil) && !(c.span || p.span || c.h)) problems.push(k + ': ceiling prop ' + p.key + ' has no size');
        }
        assert.ok(room.props.some(p => p.key === 'fluorescent' && (p.ceil || HQ.catalogue.fluorescent.ceil)), k + ': lit by fluorescents');
        assert.ok(room.props.some(p => p.key === 'filing_cabinet'), k + ': the site files are on the wall');
        for (const a of room.agents) if (!(a.r > S.rIn + 0.5 && a.r < S.rOut - 0.5 && Math.abs(a.deg) < S.arc[1] - 2)) problems.push(k + ': agent outside the corridor');
    }
    assert.deepStrictEqual(problems, []);
});

test('every launch map has a threshold leaf and doorSiteState reads a threshold from its own site', () => {
    const launch = Array.from(D.EW_MAP_META.filter(m => !m.isDelta).map(m => m.id));
    const missing = launch.filter(id => !HQ.thresholds[id] || !HQ.catalogue[HQ.thresholds[id].leaf] || !HQ.catalogue[HQ.thresholds[id].leaf].leaf);
    assert.deepStrictEqual(missing, [], 'thresholds without a leaf');
    const stray = Object.keys(HQ.thresholds).filter(id => !launch.includes(id));
    assert.deepStrictEqual(stray, [], 'threshold entries for maps that are not launch maps');
    const mars = HQ.rooms.bay_celestial.doors.find(d => d.action && d.action.mission === 'prebuilt_mars');
    assert.strictEqual(D.doorSiteState(mars, null), 'unstable');
    const unlocked = {};
    for (const c of HQ.masteryConditions) unlocked['site:prebuilt_mars:' + c] = 1;
    assert.strictEqual(D.doorSiteState(mars, { progress: { unlocked } }), 'stabilized');
    const moon = HQ.rooms.bay_celestial.doors.find(d => d.action && d.action.mission === 'prebuilt_moon');
    assert.strictEqual(D.doorSiteState(moon, { progress: { unlocked } }), 'unstable', 'mastering Mars does not stabilize the Moon');
    const back = HQ.rooms.bay_quarantined.doors.find(d => d.action && d.action.mission === 'prebuilt_backrooms');
    assert.strictEqual(D.doorSiteState(back, { progress: { unlocked } }), 'sealed', 'a locked sector seals its thresholds');
    assert.strictEqual(D.doorSiteState(HQ.rooms.bay_celestial.doors.find(d => d.id === 'egress'), null), 'open');
    assert.strictEqual(D.hqBayId('celestial'), 'bay_celestial');
    assert.strictEqual(D.hqBayRoom('nope'), null);
    /* every egress bay door's sector has a room the panel can walk into */
    for (const d of ROOM.doors.filter(d => d.action && d.action.sector)) assert.ok(HQ.rooms[D.hqBayId(d.action.sector)], d.id + ' has no bay room');
});

/* ── Phase 2.7 (2026-09-03): the janitor's closet — the first `kind: box` room ── */

const OFFICE = HQ.rooms.office;
const BOX_ROOMS = Object.entries(HQ.rooms).filter(([, r]) => r && r.kind === 'box');
const WALLS = ['n', 'e', 's', 'w'];
/* the extent along a wall (x on n/s, z on e/w) and the wall's half-length */
const alongOf = (S, wall, p) => (wall === 'e' || wall === 'w') ? { v: p.z, half: S.d / 2 } : { v: p.x, half: S.w / 2 };

test('the office is a box room off the egress: the way out lands at the egress office door and back', () => {
    assert.ok(OFFICE && OFFICE.kind === 'box', 'rooms.office kind box');
    const S = OFFICE.shell;
    assert.ok(S.w > 3 && S.d > 3 && S.h > 2.4 && S.wallH === S.h && S.dadoH > 0, 'shell numbers');
    for (const n of [S.floor, S.wall, S.dado, S.trim, S.ceiling]) assert.ok(HQ.textures[n], 'texture ' + n);
    const egressDoor = ROOM.doors.find(d => d.id === 'office');
    assert.ok(egressDoor && egressDoor.action.room === 'office' && egressDoor.action.at === 'egress' && egressDoor.rankDoor, 'the egress office door walks into the office at its way out');
    const out = OFFICE.doors.find(d => d.id === 'egress');
    assert.ok(out && out.action.room === 'central_egress' && out.action.at === 'office', 'the way out lands at the egress office door');
    assert.ok(out.rankDoor && out.leaf === egressDoor.leaf, 'the same rank door from both sides');
    /* every clearance level issues a leaf the door can wear */
    for (const r of D.DOOR_TEXT.CLEARANCE) assert.ok(HQ.catalogue[r.door] && HQ.catalogue[r.door].leaf, 'rank leaf ' + r.door);
    assert.strictEqual(D.doorSiteState(out, null), 'open');
    assert.strictEqual(D.doorSiteState(egressDoor, null), 'open');
});

test('box-room doors hang on a named wall with a panel that fits, one action each, unique ids', () => {
    const problems = [];
    for (const [k, room] of BOX_ROOMS) {
        const S = room.shell, ids = new Set();
        for (const d of room.doors) {
            if (ids.has(d.id)) problems.push(k + ': duplicate door id ' + d.id);
            ids.add(d.id);
            if (!WALLS.includes(d.wall)) { problems.push(k + ': door ' + d.id + ' names no wall'); continue; }
            const a = alongOf(S, d.wall, d);
            const wide = !!d.wide || (d.rankDoor && D.DOOR_TEXT.CLEARANCE.some(r => HQ.catalogue[r.door] && HQ.catalogue[r.door].wide));
            const halfPanel = (wide ? 3.3 : 2.5) / 2;
            if (typeof a.v !== 'number' || Math.abs(a.v) + halfPanel > a.half) problems.push(k + ': door ' + d.id + ' panel runs off the wall');
            const keys = Object.keys(d.action || {}).filter(x => ['fn', 'sector', 'room', 'overlay', 'mission'].includes(x));
            if (keys.length !== 1) problems.push(k + ': door ' + d.id + ' action');
            if (d.action && d.action.room && !HQ.rooms[d.action.room]) problems.push(k + ': door ' + d.id + ' leads to no room');
            if (d.leaf && !(HQ.catalogue[d.leaf] && HQ.catalogue[d.leaf].leaf)) problems.push(k + ': door ' + d.id + ' leaf ' + d.leaf);
        }
        for (const c of room.counters || []) { if (ids.has(c.id)) problems.push(k + ': counter id collides ' + c.id); ids.add(c.id); }
    }
    assert.deepStrictEqual(problems, []);
});

test('box-room props resolve (kit or procedural), sit inside the walls, wall props name a wall, mounts clear the ceiling', () => {
    const problems = [];
    for (const [k, room] of BOX_ROOMS) {
        const S = room.shell;
        for (const p of room.props) {
            const c = HQ.catalogue[p.key];
            if (!c) { problems.push(k + ': prop ' + p.key + ' not in catalogue'); continue; }
            if (!c.file && !c.proc) problems.push(k + ': prop ' + p.key + ' has neither file nor proc');
            const onWall = typeof p.wall === 'string';
            if (onWall) {
                if (!WALLS.includes(p.wall)) { problems.push(k + ': prop ' + p.key + ' wall ' + p.wall); continue; }
                const a = alongOf(S, p.wall, p);
                if (typeof a.v !== 'number' || Math.abs(a.v) > a.half - 0.15) problems.push(k + ': wall prop ' + p.key + ' runs off wall ' + p.wall);
            } else {
                if (typeof p.x !== 'number' || typeof p.z !== 'number') problems.push(k + ': prop ' + p.key + ' has no x/z');
                else if (Math.abs(p.x) > S.w / 2 - 0.1 || Math.abs(p.z) > S.d / 2 - 0.1) problems.push(k + ': prop ' + p.key + ' @' + p.x + ',' + p.z + ' is in a wall');
                if ((c.wall) && !onWall && p.y == null) { /* a wall-kit prop used free-standing is allowed (shelving, desks) */ }
            }
            const mount = (p.mount != null) ? p.mount : (c.mount || 0);
            if (mount + (c.h || 0) > S.h - 0.05) problems.push(k + ': prop ' + p.key + ' mounts through the ceiling');
            if ((p.y || 0) > S.h - 0.1) problems.push(k + ': prop ' + p.key + ' sits above the ceiling');
            if ((c.ceil || p.ceil) && !(c.span || p.span || c.h)) problems.push(k + ': ceiling prop ' + p.key + ' has no size');
            if (c.proc && c.wall && onWall && !(c.depth > 0)) problems.push(k + ': proc wall prop ' + p.key + ' needs a depth');
        }
        const sp = room.spawn;
        if (!(sp && typeof sp.x === 'number' && typeof sp.z === 'number' && Math.abs(sp.x) < S.w / 2 - 0.6 && Math.abs(sp.z) < S.d / 2 - 0.6)) problems.push(k + ': spawn outside the room');
        for (const c of room.counters || []) {
            if (!(typeof c.x === 'number' && typeof c.z === 'number' && Math.abs(c.x) < S.w / 2 && Math.abs(c.z) < S.d / 2)) problems.push(k + ': counter ' + c.id + ' outside');
            if (!(c.radius > 0)) problems.push(k + ': counter ' + c.id + ' has no reach');
        }
        for (const a of room.agents || []) if (!(typeof a.x === 'number' && typeof a.z === 'number')) problems.push(k + ': agent needs x/z');
        assert.ok(room.props.some(p => p.key === 'fluorescent' && (p.ceil || HQ.catalogue.fluorescent.ceil)), k + ': lit by a fluorescent');
    }
    assert.deepStrictEqual(problems, []);
    /* the closet reference (janitor_closet_v1): cot, sink, mop bucket, breaker panel, rug, drain, CRT, phone, desk, locker, chair */
    for (const key of ['cot', 'sink', 'mop_bucket', 'breaker_panel', 'rug_round', 'floor_drain', 'crt_terminal', 'rotary_phone', 'tanker_desk', 'locker', 'folding_chair', 'desk_lamp']) {
        assert.ok(OFFICE.props.some(p => p.key === key), 'the closet has its ' + key);
    }
    const tray = OFFICE.counters.find(c => c.id === 'intray');
    assert.ok(tray && tray.action.overlay === 'intray', 'the in-tray is on the desk');
    const desk = OFFICE.props.find(p => p.key === 'tanker_desk');
    assert.ok(Math.hypot((desk.x || 0) - tray.x, -OFFICE.shell.d / 2 - tray.z) < tray.radius + 1, 'the in-tray sits within reach of the desk');
});
