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
    const launch = D.EW_MAP_META.filter(m => !m.isDelta).map(m => m.id);   // facility boards are Δ-flagged, never sites
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
    /* since plan 3.2 the elevator also asks for Keys (requiresKeys) — rank alone stays red */
    assert.strictEqual(D.doorSiteState(elevator, { door: { clearance: 4 } }), 'clearance');
    assert.strictEqual(D.doorSiteState(elevator, { door: { clearance: 4, hq: { keys: elevator.requiresKeys } } }), 'open');
    assert.strictEqual(D.doorSiteState(records, null), 'open');
    assert.strictEqual(D.doorSiteState(quarantined, { door: { clearance: 6 } }), 'sealed');
    assert.strictEqual(D.doorSiteState(celestial, null), 'unstable');
    /* master every celestial map through the monotonic progress flags —
       the only stabilized sector is also where today's Code Red sits (plan
       3.3), so the bay strobes until it is cleared, then reads green */
    const unlocked = {};
    for (const id of HQ.sectors.celestial.maps) for (const c of HQ.masteryConditions) unlocked['site:' + id + ':' + c] = 1;
    assert.strictEqual(D.doorSiteState(celestial, { progress: { unlocked } }), 'codered');
    const cr = D.hqCodeRed({ progress: { unlocked } });
    const cleared = { door: { hq: { codeRed: { date: D.hqToday(), site: cr.site, cleared: true } } }, progress: { unlocked } };
    assert.strictEqual(D.doorSiteState(celestial, cleared), 'stabilized');
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
    /* Mars is this profile's ONLY stabilized site, so (plan 3.3) it is also
       today's Code Red: the lamp strobes until cleared, then reads green */
    assert.strictEqual(D.doorSiteState(mars, { progress: { unlocked } }), 'codered');
    const clearedToday = { date: D.hqToday(), site: 'prebuilt_mars', cleared: true };
    assert.strictEqual(D.doorSiteState(mars, { progress: { unlocked }, door: { hq: { codeRed: clearedToday } } }), 'stabilized');
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

/* ── Phase 6.1a (2026-09-04): the walkable Training Room ── */

test('the training room is a box room off the egress: the pit, the console, the facility doors', () => {
    const TR = HQ.rooms.training;
    assert.ok(TR && TR.kind === 'box' && TR.fx === 'training', 'rooms.training kind box, fx training');
    const S = TR.shell;
    assert.ok(S.grid && S.grid.cells === 8 && S.grid.cell > 0, 'the 8×8 grid');
    assert.ok(S.w >= S.grid.cells * S.grid.cell + 4 && S.d >= S.grid.cells * S.grid.cell + 4, 'at least 2 m of walkway around the pit');
    /* the egress door walks in; the way out walks back to it; the panel
       shortcuts (Challenge / Mystery Dungeon) moved into the facility */
    const eg = ROOM.doors.find(d => d.id === 'training');
    assert.ok(eg && eg.action.room === 'training' && eg.action.at === 'egress', 'the egress training door walks into the room at its way out');
    assert.ok(!eg.alt && !eg.alt2, 'the egress panel shortcuts moved into the facility');
    const out = TR.doors.find(d => d.id === 'egress');
    assert.ok(out && out.wall === 'n' && out.x === 0 && out.action.room === 'central_egress' && out.action.at === 'training', 'the way out is centred on the north wall (the barrier gap) and lands at the egress door');
    const ch = TR.doors.find(d => d.id === 'challenge');
    assert.ok(ch && ch.wall === 's' && ch.x === 0 && ch.action.fn === '_goToCampaign', 'the Challenge range is the south door, on the other barrier gap');
    const cd = TR.doors.find(d => d.id === 'condemned');
    assert.ok(cd && cd.action.fn === '_goToMysteryDungeon', 'the condemned crossing is the Mystery Dungeon');
    for (const d of TR.doors) assert.ok(!(HQ.catalogue[d.leaf] && HQ.catalogue[d.leaf].rank), 'rank leaf on ' + d.id);
    /* the RANGE console: at the tanker desk, launching both facility boards */
    const rc = TR.counters.find(c => c.id === 'range');
    assert.ok(rc && rc.action.overlay === 'training' && rc.radius > 0, 'the RANGE console');
    const desk = TR.props.find(p => p.key === 'tanker_desk');
    assert.ok(desk && desk.wall === 'w' && Math.abs((desk.z || 0) - rc.z) < 2, 'the console counter stands at the tanker desk');
    assert.ok(TR.props.some(p => p.key === 'tube_tv'), 'the VHS CRT is in the room');
    for (const id of ['prebuilt_training', 'prebuilt_holosim']) {
        const m = (D.EW_MAP_META || []).find(x => x.id === id);
        assert.ok(m && m.isDelta && m.facility, id + ' is a facility board the console can launch');
    }
    assert.strictEqual(D.doorSiteState(out, null), 'open');
    assert.strictEqual(D.doorSiteState(eg, null), 'open');
});

/* ── 2026-09-04: leaves fit their frames, rank leaves are exclusive ──── */
const LEAVES = Object.entries(HQ.catalogue).filter(([, c]) => c.leaf);
const ALL_DOORS = Object.entries(HQ.rooms).flatMap(([k, r]) => (r && r.doors || []).map(d => Object.assign({ room: k }, d)));

test('every leaf carries a measured aspect, a legal motion, and a hinge when it moves', () => {
    const problems = [];
    for (const [k, c] of LEAVES) {
        if (!(typeof c.aspect === 'number' && c.aspect > 0.3 && c.aspect < 1.3)) problems.push(k + ': aspect (W/H) must be measured from the GLB, got ' + c.aspect);
        if (c.open != null && c.open !== 'swing' && c.open !== 'slide') problems.push(k + ': open must be swing | slide | absent');
        if (c.open && c.hinge !== 'left' && c.hinge !== 'right') problems.push(k + ': a moving leaf names its hinge side');
        if (c.yaw != null && ![90, 180, 270, -90].includes(c.yaw)) problems.push(k + ': yaw is a quarter turn');
        /* a wide leaf is at least 0.7 W/H (else it sits in a 2.5 m panel with 0.5 m jambs); a single is under 0.75 */
        if (c.wide && c.aspect < 0.7) problems.push(k + ': too narrow for a wide opening');
        if (!c.wide && c.aspect > 0.75) problems.push(k + ': too wide for a single opening');
        /* one-mesh doubles / hatches / the frame never swing — they would take their frame with them */
        if (c.open && c.wide) problems.push(k + ': wide leaves are one mesh with the frame baked in — static');
    }
    assert.deepStrictEqual(problems, []);
});

test('the six rank leaves are exclusive: each clearance level owns one, no other door or threshold wears it', () => {
    const problems = [];
    const ranks = D.DOOR_TEXT.CLEARANCE;
    ranks.forEach((r, i) => {
        const c = HQ.catalogue[r.door];
        if (!c || c.rank !== i + 1) problems.push(r.title + ': catalogue.' + r.door + '.rank must be ' + (i + 1));
    });
    for (const [k, c] of LEAVES) if (c.rank && !ranks.some(r => r.door === k)) problems.push(k + ': rank ' + c.rank + ' but no clearance level issues it');
    const rankKeys = new Set(ranks.map(r => r.door));
    for (const d of ALL_DOORS) {
        if (d.rankDoor) continue;   // wears the profile's rank at runtime; its static leaf is the L1 default
        if (rankKeys.has(d.leaf)) problems.push(d.room + '/' + d.id + ': wears rank leaf ' + d.leaf);
    }
    for (const [id, th] of Object.entries(HQ.thresholds)) if (rankKeys.has(th.leaf)) problems.push('threshold ' + id + ': wears rank leaf ' + th.leaf);
    /* the rank ladder mostly moves: a promotion should be a door that opens for you */
    const moving = ranks.filter(r => HQ.catalogue[r.door].open).length;
    assert.ok(moving >= 4, 'at least four of the six rank doors swing or slide, got ' + moving);
    assert.deepStrictEqual(problems, []);
});

test("every door's wide flag agrees with its leaf (the renderer lets the leaf decide; the data must not lie)", () => {
    const problems = [];
    for (const d of ALL_DOORS) {
        if (d.rankDoor || !d.leaf) continue;
        const c = HQ.catalogue[d.leaf];
        if (c && !!c.wide !== !!d.wide) problems.push(d.room + '/' + d.id + ': wide ' + !!d.wide + ' but leaf ' + d.leaf + ' is ' + (c.wide ? 'wide' : 'single'));
    }
    for (const [id, th] of Object.entries(HQ.thresholds)) {
        const c = HQ.catalogue[th.leaf];
        if (c && !!c.wide !== !!th.wide) problems.push('threshold ' + id + ': wide ' + !!th.wide + ' but leaf ' + th.leaf + ' is ' + (c.wide ? 'wide' : 'single'));
    }
    assert.deepStrictEqual(problems, []);
    /* the static one-mesh doubles / hatches are used sparingly: the revolving door at most once */
    const revolving = ALL_DOORS.filter(d => d.leaf === 'leaf_revolving').length + Object.values(HQ.thresholds).filter(t => t.leaf === 'leaf_revolving').length;
    assert.ok(revolving <= 2, 'the revolving door is the one sparing use (bay + its way out), got ' + revolving);
});

/* ── Phase 3.2 / 3.3 / 3.4 (2026-09-04): Keys, Code Red, the promotion moment ── */

const TODAY = D.hqToday();
const masteredCelestial = () => {
    const unlocked = {};
    for (const id of HQ.sectors.celestial.maps) for (const c of HQ.masteryConditions) unlocked['site:' + id + ':' + c] = 1;
    return unlocked;
};

test('hqKeys sums the hourglass counter over its buckets plus Department-issued Keys', () => {
    assert.deepStrictEqual({ ...D.hqKeys(null) }, { keys: 0, pickups: 0, issued: 0 });
    const p = { progress: { counters: { hourglasses: { pvp: 3, cpu: 4, legacy: 5 } } }, door: { hq: { keys: 2 } } };
    assert.deepStrictEqual({ ...D.hqKeys(p) }, { keys: 14, pickups: 12, issued: 2 });
    assert.strictEqual(HQ.keys.counter, 'hourglasses');
    /* the counter the achievement catalog actually bumps (battle.js _achFoldMatchDeltas) */
    assert.ok(D.ACH_CATALOG.some(l => l.metric === HQ.keys.counter), 'the Keys counter is a real achievement metric');
});

test('requiresKeys doors read CLEARANCE until rank AND Keys are met (plan 3.2)', () => {
    const gated = ROOM.doors.filter(d => d.requiresKeys);
    assert.ok(gated.length >= 2, 'at least two restricted doors ask for Keys');
    for (const d of gated) {
        assert.ok(d.minClearance, d.id + ': Keys ride on top of a rank gate');
        const rankOnly = { door: { clearance: d.minClearance } };
        const both = { door: { clearance: d.minClearance, hq: { keys: d.requiresKeys } } };
        const keysOnly = { door: { clearance: 1, hq: { keys: d.requiresKeys } } };
        assert.strictEqual(D.doorSiteState(d, rankOnly), 'clearance', d.id + ': rank without Keys');
        assert.strictEqual(D.hqKeysShort(d, rankOnly), d.requiresKeys, d.id + ': short by the full count');
        assert.strictEqual(D.doorSiteState(d, keysOnly), 'clearance', d.id + ': Keys without rank');
        assert.strictEqual(D.doorSiteState(d, both), 'open', d.id + ': both met');
        assert.strictEqual(D.hqKeysShort(d, both), 0);
    }
    /* thresholds and bays never ask for Keys — mastery is their gate */
    for (const [, room] of BAYS) for (const d of room.doors) assert.ok(!d.requiresKeys, d.id + ' must not require Keys');
    assert.strictEqual(D.hqKeysShort(ROOM.doors.find(d => d.id === 'records'), null), 0);
});

test('hqCodeRed: quiet until a threshold is stabilized, then one deterministic pick per day', () => {
    assert.strictEqual(D.hqCodeRed(null), null);
    assert.strictEqual(D.hqCodeRed({ createdAt: 'x' }), null, 'nothing mastered → no Code Red');
    const p = { createdAt: '2026-01-01T00:00:00Z', progress: { unlocked: masteredCelestial() } };
    const a = D.hqCodeRed(p, { date: '2026-09-04' });
    assert.ok(a && HQ.sectors.celestial.maps.includes(a.site), 'picks a stabilized site');
    assert.strictEqual(a.sector, 'celestial');
    assert.strictEqual(a.cleared, false);
    assert.strictEqual(a.forced, false);
    assert.ok(a.bonus > 0 && a.bonus === HQ.codeRed.bonusGold);
    const b = D.hqCodeRed(p, { date: '2026-09-04' });
    assert.deepStrictEqual([b.site, b.race], [a.site, a.race], 'same day, same profile → same Code Red');
    const other = D.hqCodeRed({ createdAt: '2020-05-05T00:00:00Z', progress: { unlocked: masteredCelestial() } }, { date: '2026-09-04' });
    assert.ok(other, 'another employee has a Code Red too');
    /* over a month of dates the pick actually moves */
    const sites = new Set(), races = new Set();
    for (let d = 1; d <= 30; d++) { const c = D.hqCodeRed(p, { date: '2026-10-' + String(d).padStart(2, '0') }); sites.add(c.site); races.add(c.race); }
    assert.ok(sites.size >= 2 && races.size >= 5, 'the daily pick varies (sites ' + sites.size + ', races ' + races.size + ')');
    /* a locked sector never reports */
    const q = { createdAt: 'q', progress: { unlocked: {} } };
    for (const id of HQ.sectors.quarantined.maps) for (const c of HQ.masteryConditions) q.progress.unlocked['site:' + id + ':' + c] = 1;
    assert.strictEqual(D.hqCodeRed(q, { date: '2026-09-04' }), null, 'quarantined (locked) sites are not candidates');
});

test('the out-of-place entity is never a native of the site and is filed somewhere else', () => {
    const p = { createdAt: 'e', progress: { unlocked: masteredCelestial() } };
    for (let d = 1; d <= 20; d++) {
        const cr = D.hqCodeRed(p, { date: '2026-11-' + String(d).padStart(2, '0') });
        const natives = D.doorSiteCrossings(cr.label);
        assert.ok(!natives.includes(cr.race), cr.race + ' is native to ' + cr.label);
        assert.ok(D.AVAILABLE_RACES.includes(cr.race), 'unknown race ' + cr.race);
        assert.ok(D.DOOR_TEXT.POINT_OF_ENTRY[cr.race] && D.DOOR_TEXT.POINT_OF_ENTRY[cr.race] !== cr.label, cr.race + ' has a point of entry elsewhere');
        assert.strictEqual(cr.from, D.DOOR_TEXT.POINT_OF_ENTRY[cr.race]);
        const pool = D.hqCodeRedPool(cr, 4);
        assert.strictEqual(pool[0], cr.race, 'the entity leads the CPU roster');
        assert.strictEqual(pool.natives, 1, 'only the entity is pinned to the first draw');
        assert.ok(pool.length >= 4 && new Set(pool).size === pool.length, 'the roster is padded with distinct races');
    }
    assert.deepStrictEqual(Array.from(D.hqCodeRedPool(null, 4)), []);
});

test('Code Red drives the lamps: the bay door and the threshold strobe until cleared today', () => {
    const p = { createdAt: 'l', progress: { unlocked: masteredCelestial() }, door: { clearance: 1, hq: {} } };
    const cr = D.hqCodeRed(p);
    assert.ok(cr && cr.date === TODAY);
    const bay = ROOM.doors.find(d => d.action && d.action.sector === 'celestial');
    const th = HQ.rooms.bay_celestial.doors.find(d => d.action && d.action.mission === cr.site);
    const otherTh = HQ.rooms.bay_celestial.doors.find(d => d.action && d.action.mission && d.action.mission !== cr.site);
    assert.strictEqual(D.doorSiteState(bay, p), 'codered');
    assert.strictEqual(D.doorSiteState(th, p), 'codered');
    assert.strictEqual(D.doorSiteState(otherTh, p), 'stabilized', 'the other stabilized thresholds stay green');
    const otherBay = ROOM.doors.find(d => d.action && d.action.sector === 'ancient');
    assert.strictEqual(D.doorSiteState(otherBay, p), 'unstable', 'other bays are untouched');
    /* cleared today → green again; a stale clear (yesterday / another site) does not count */
    p.door.hq.codeRed = { date: TODAY, site: cr.site, cleared: true };
    assert.strictEqual(D.hqCodeRed(p).cleared, true);
    assert.strictEqual(D.doorSiteState(bay, p), 'stabilized');
    assert.strictEqual(D.doorSiteState(th, p), 'stabilized');
    p.door.hq.codeRed = { date: '2000-01-01', site: cr.site, cleared: true };
    assert.strictEqual(D.doorSiteState(th, p), 'codered', 'yesterday\'s clear does not cover today');
    p.door.hq.codeRed = { date: TODAY, site: 'prebuilt_nope', cleared: true };
    assert.strictEqual(D.doorSiteState(th, p), 'codered', 'a clear on another site does not cover this one');
});

test('DOOR_HQ.codeRed.force puts the Code Red on a named site with no mastery (dev ?codered=)', () => {
    const prev = HQ.codeRed.force;
    try {
        HQ.codeRed.force = 'prebuilt_mars_delta';
        const cr = D.hqCodeRed({ createdAt: 'f' });
        assert.ok(cr && cr.site === 'prebuilt_mars' && cr.forced, 'forced onto Mars (Δ suffix stripped)');
        const th = HQ.rooms.bay_celestial.doors.find(d => d.action && d.action.mission === 'prebuilt_mars');
        assert.strictEqual(D.doorSiteState(th, { createdAt: 'f' }), 'codered');
        HQ.codeRed.force = 'not_a_map';
        assert.strictEqual(D.hqCodeRed({ createdAt: 'f' }), null, 'an unknown force falls through to the normal rule');
    } finally { HQ.codeRed.force = prev; }
    assert.strictEqual(D.hqCodeRed({ createdAt: 'f' }, { force: 'prebuilt_moon' }).site, 'prebuilt_moon');
});

test('hqToday / hqHash are stable helpers', () => {
    assert.match(D.hqToday(), /^\d{4}-\d{2}-\d{2}$/);
    assert.strictEqual(D.hqToday(new Date(2026, 0, 5)), '2026-01-05');
    assert.strictEqual(D.hqHash('door'), D.hqHash('door'));
    assert.notStrictEqual(D.hqHash('door'), D.hqHash('doors'));
    assert.ok(D.hqHash('') >= 0 && D.hqHash('x') <= 0xffffffff);
});

test('the promotion moment has a leaf for every rung above L1 and the stamps kit knows PROMOTED ink', () => {
    /* map.js _hqCheckPromotion writes {word:'PROMOTED', ink:'admit'} — the card back renders .door-stamp.<ink> */
    const fs = require('node:fs');
    const css = fs.readFileSync(require('node:path').join(__dirname, 'styles-base.css'), 'utf8');
    assert.match(css, /\.door-stamp\.admit\b/);
    assert.match(css, /\.hq-notice\b/);
    assert.match(css, /\.hq-strip-alert\b/);
    assert.match(css, /\.drs-site\.codered\b/);
    for (const c of D.DOOR_TEXT.CLEARANCE.slice(1)) assert.ok(HQ.catalogue[c.door] && HQ.catalogue[c.door].leaf, 'L' + c.level + ' leaf');
    const html = fs.readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
    for (const id of ['hqKeys', 'hqCodeRed', 'hqMastery']) assert.ok(html.includes('id="' + id + '"'), 'index.html strip has #' + id);
    const audio = fs.readFileSync(require('node:path').join(__dirname, 'audio.js'), 'utf8');
    assert.match(audio, /doorbell\(ctx, t, out, vol\)/, 'the doorbell recipe exists');
    assert.match(audio, /paChime\(ctx, t, out, vol\)/);
});

/* ── 2026-09-06: the cast — DOOR_CAST (data.js) ↔ DOOR_CAST_MODELS (sprites.js) ── */

const fs = require('node:fs');
const path = require('node:path');
const CAST = D.DOOR_CAST;
const SPRITES_SRC = fs.readFileSync(path.join(__dirname, 'sprites.js'), 'utf8');
/* the registries are read from sprites.js SOURCE (it does not load headlessly on its own) */
const CAST_MODEL_IDS = Array.from(SPRITES_SRC.matchAll(/^\s{2}(\w+):\s+_mkCast\('([^']+)'/gm), m => m[1]);
const CAST_POSES = {};
for (const m of SPRITES_SRC.matchAll(/^\s{2}(hq\w+):\s+\{ clip: '([^']+)',\s+lib: (\d)/gm)) CAST_POSES[m[1]] = { clip: m[2], lib: +m[3] };
/* the shared animation libraries' clip inventories (R2 Assets/Models/, listed 2026-09-06) */
const LIB_CLIPS = [
    ['A_TPose', 'Crouch_Fwd_Loop', 'Crouch_Idle_Loop', 'Dance_Loop', 'Death01', 'Driving_Loop', 'Fixing_Kneeling', 'Hit_Chest', 'Hit_Head', 'Idle_Loop', 'Idle_Talking_Loop', 'Idle_Torch_Loop', 'Interact', 'Jog_Fwd_Loop', 'Jump_Land', 'Jump_Loop', 'Jump_Start', 'PickUp_Table', 'Pistol_Aim_Down', 'Pistol_Aim_Neutral', 'Pistol_Aim_Up', 'Pistol_Idle_Loop', 'Pistol_Reload', 'Pistol_Shoot', 'Punch_Cross', 'Punch_Jab', 'Push_Loop', 'Roll', 'Sitting_Enter', 'Sitting_Exit', 'Sitting_Idle_Loop', 'Sitting_Talking_Loop', 'Spell_Simple_Enter', 'Spell_Simple_Exit', 'Spell_Simple_Idle_Loop', 'Spell_Simple_Shoot', 'Sprint_Loop', 'Swim_Fwd_Loop', 'Swim_Idle_Loop', 'Sword_Attack', 'Sword_Idle', 'Walk_Formal_Loop', 'Walk_Loop'],
    ['A_TPose', 'Chest_Open', 'ClimbUp_1m', 'Consume', 'Farm_Harvest', 'Farm_PlantSeed', 'Farm_Watering', 'Hit_Knockback', 'Idle_FoldArms_Loop', 'Idle_Lantern_Loop', 'Idle_No_Loop', 'Idle_Rail_Call', 'Idle_Rail_Loop', 'Idle_Shield_Break', 'Idle_Shield_Loop', 'Idle_TalkingPhone_Loop', 'LayToIdle', 'Melee_Hook', 'Melee_Hook_Rec', 'NinjaJump_Idle_Loop', 'NinjaJump_Land', 'NinjaJump_Start', 'OverhandThrow', 'Shield_Dash', 'Shield_OneShot', 'Slide_Exit', 'Slide_Loop', 'Slide_Start', 'Sword_Block', 'Sword_Dash', 'Sword_Heavy_Combo', 'Sword_Regular_A', 'Sword_Regular_A_Rec', 'Sword_Regular_B', 'Sword_Regular_B_Rec', 'Sword_Regular_C', 'Sword_Regular_Combo', 'TreeChopping_Loop', 'Walk_Carry_Loop', 'Yes', 'Zombie_Idle_Loop', 'Zombie_Scratch', 'Zombie_Walk_Fwd_Loop'],
    ['Idle_5', 'Idle_10', 'Idle_11', 'Walking', 'Walking_Woman', 'Running', 'Regular_Jump', 'Dead', 'Block3', 'Hit_Reaction_1', 'Face_Punch_Reaction', 'Fall3', 'Cowboy_Quick_Draw_Shooting', 'Spartan_Kick', 'Archery_Shot_1', 'mage_soell_cast', 'mage_soell_cast_3', 'mage_soell_cast_7', 'Charged_Spell_Cast', 'Charged_Ground_Slam'],
    ['Basic_Jump', 'Back_Jump', 'Punch_Combo', 'Punch_Combo_1', 'Punch_Combo_5'],
];

test('the cast registry exists on both sides: 15 rigged models in sprites.js, every DOOR_CAST model resolves', () => {
    assert.ok(CAST && typeof CAST === 'object', 'DOOR_CAST missing');
    assert.strictEqual(CAST_MODEL_IDS.length, 15, 'sprites.js DOOR_CAST_MODELS entries: ' + CAST_MODEL_IDS.join(','));
    assert.ok(Object.keys(CAST_POSES).length >= 8, 'sprites.js _CAST_POSES parsed: ' + Object.keys(CAST_POSES).join(','));
    for (const [slot, p] of Object.entries(CAST_POSES)) {
        assert.ok(LIB_CLIPS[p.lib] && LIB_CLIPS[p.lib].includes(p.clip), `pose ${slot}: ${p.clip} is not in library ${p.lib}`);
    }
    const problems = [];
    for (const [id, m] of Object.entries(CAST)) {
        if (!m.name || !m.title) problems.push(id + ': needs name + title');
        if (!!m.model === !!m.race) problems.push(id + ': exactly one of model / race');
        if (m.model && !CAST_MODEL_IDS.includes(m.model)) problems.push(id + ': model ' + m.model + ' not in sprites.js DOOR_CAST_MODELS');
        if (m.race && !D.AVAILABLE_RACES.includes(m.race)) problems.push(id + ': race ' + m.race + ' unknown');
        if (m.base && !D.AVAILABLE_RACES.includes(m.base)) problems.push(id + ': base ' + m.base + ' unknown');
        if (!['male', 'female'].includes(m.gender)) problems.push(id + ': gender');
        if (!Array.isArray(m.spots) || !Array.isArray(m.lines)) problems.push(id + ': spots/lines arrays');
        if (m.hidden && m.spots.length) problems.push(id + ': hidden members have no spots');
        if (!m.hidden && !m.spots.length) problems.push(id + ': a placed member needs a spot');
    }
    assert.deepStrictEqual(problems, []);
    /* every wired model is used by a member (a wired model nobody names is a typo somewhere) */
    const used = new Set(Object.values(CAST).map(m => m.model).filter(Boolean));
    assert.deepStrictEqual(CAST_MODEL_IDS.filter(id => !used.has(id)), [], 'wired models with no cast member');
    assert.ok(CAST.player && CAST.player.avatar && CAST.player.model === 'player' && CAST.player.hidden, 'the Player is the avatar, never an NPC');
});

test('every cast spot names a real room, a known pose, sane weights, and stands on walkable floor', () => {
    const S = ROOM.shell, BODY = 0.34;
    const problems = [];
    for (const [id, m] of Object.entries(CAST)) {
        for (const s of m.spots) {
            const room = HQ.rooms[s.room];
            if (!room) { problems.push(id + ': room ' + s.room); continue; }
            if (s.pose && !CAST_POSES[s.pose]) problems.push(id + ': pose ' + s.pose + ' is not a sprites.js _CAST_POSES slot');
            if (s.p != null && !(s.p > 0 && s.p <= 1)) problems.push(id + ': p must be in (0, 1]');
            if (s.reach != null && !(s.reach > 0 && s.reach <= 4)) problems.push(id + ': reach');
            if (typeof s.face !== 'number') problems.push(id + ': face');
            if (typeof s.doing !== 'string' || !s.doing) problems.push(id + ': every spot carries a stage direction');
            if (room.kind === 'box') {
                const RS = room.shell;
                if (!(typeof s.x === 'number' && typeof s.z === 'number')) { problems.push(id + ': box spot needs x/z'); continue; }
                if (Math.abs(s.x) > RS.w / 2 - BODY - 0.1 || Math.abs(s.z) > RS.d / 2 - BODY - 0.1) problems.push(id + ': box spot in a wall');
            } else if (room.kind === 'bay') {
                const RS = room.shell;
                if (!(typeof s.deg === 'number' && typeof s.r === 'number')) { problems.push(id + ': bay spot needs deg/r'); continue; }
                if (s.r < RS.rIn + BODY + 0.1 || s.r > RS.rOut - BODY - 0.1) problems.push(id + ': bay spot r=' + s.r + ' in a wall');
                if (Math.abs(s.deg) > RS.arc[1] - 3) problems.push(id + ': bay spot in an end cap');
            } else {
                if (!(typeof s.deg === 'number' && typeof s.r === 'number')) { problems.push(id + ': polar spot needs deg/r'); continue; }
                if (![0, 1].includes(s.level || 0)) problems.push(id + ': level');
                if (s.level) {
                    const lo = S.mezz.inner + 0.62, hi = S.mezz.outer - 0.55;
                    if (s.r - BODY < lo || s.r + BODY > hi) problems.push(id + ': mezzanine spot r=' + s.r + ' off the slab band');
                } else {
                    const rMin = (ROOM.desk && ROOM.desk.rOuter || 0) + BODY;
                    if (s.r > S.radius - BODY - 0.1 || s.r < rMin) problems.push(id + ': floor spot r=' + s.r + ' outside the ring');
                    for (const st of ROOM.stairs) {
                        const lo = Math.min(st.from, st.to) - 2, hi = Math.max(st.from, st.to) + 2;
                        const a = ((s.deg % 360) + 360) % 360;
                        if (a >= lo && a <= hi && s.r >= st.rIn - 0.5) problems.push(id + ': floor spot inside stair ' + st.id);
                    }
                }
            }
        }
    }
    assert.deepStrictEqual(problems, []);
    /* the physical business the cast rely on is in the rooms */
    assert.ok(ROOM.props.some(p => p.key === 'mop' && Math.abs(p.deg - 143) < 3), 'the Janitor’s mop leans by the egress bucket');
    assert.ok(ROOM.props.filter(p => p.key === 'cardboard_box' && (p.level || 0) === 1).length >= 2, 'Otto’s crates on the mezzanine');
    assert.ok(HQ.rooms.office.props.some(p => p.key === 'mop_bucket'), 'the closet keeps its bucket');
    const rh = CAST.rhonda.spots[0];
    assert.ok(rh.pose === 'hqSit' && rh.reach >= 3 && ROOM.props.some(p => p.key === 'office_chair' && Math.abs(p.deg - rh.deg) < 1 && Math.abs(p.r - rh.r) < 0.2), 'Rhonda sits on the reception chair, reachable across the counter');
    assert.ok(/ROOM 64/.test(HQ.rooms.training.sub), 'the Training Room is Room 64');
});

test('hqCastInRoom draws one spot per member per session, honours hidden / weights / clearance', () => {
    const rooms = Object.keys(HQ.rooms);
    const seen = {};
    for (let i = 0; i < 40; i++) {
        const salt = 'salt' + i;
        const where = {};
        for (const rid of rooms) {
            for (const c of D.hqCastInRoom(rid, null, { salt })) {
                assert.ok(!CAST[c.id].hidden, c.id + ' is hidden');
                assert.strictEqual(c.spot.room, rid, c.id + ' drawn into the wrong room');
                assert.ok(CAST[c.id].spots.includes(c.spot));
                where[c.id] = (where[c.id] || 0) + 1;
                seen[c.id] = seen[c.id] || {}; seen[c.id][rid] = true;
            }
        }
        for (const [id, n] of Object.entries(where)) assert.strictEqual(n, 1, id + ' is in ' + n + ' rooms at once (salt ' + salt + ')');
        /* the same salt draws the same building twice */
        const a = D.hqCastInRoom('central_egress', null, { salt }).map(c => c.id + '@' + c.spot.deg).join(',');
        const b = D.hqCastInRoom('central_egress', null, { salt }).map(c => c.id + '@' + c.spot.deg).join(',');
        assert.strictEqual(a, b);
    }
    /* weights work: Elle (p 0.5, one spot) is sometimes away; the Janitor turns up in both his rooms over 40 sessions */
    assert.ok(seen.elle && Object.keys(seen.elle).length === 1, 'Elle only ever stands in the egress');
    let elleAbsent = 0;
    for (let i = 0; i < 40; i++) if (!D.hqCastInRoom('central_egress', null, { salt: 'salt' + i }).some(c => c.id === 'elle')) elleAbsent++;
    assert.ok(elleAbsent > 0 && elleAbsent < 40, 'Elle’s visits are unscheduled (absent ' + elleAbsent + '/40)');
    assert.ok(seen.janitor && seen.janitor.central_egress && seen.janitor.office, 'the Janitor is seen both mopping the hall and raiding your closet');
    assert.ok(seen.rhonda && seen.rhonda.central_egress && Object.keys(seen.rhonda).length === 1, 'Rhonda never leaves the desk');
    assert.ok(seen.sedaniel && seen.sedaniel.bay_terrestrial, 'Sedaniel is parked in the terrestrial bay');
    assert.strictEqual(D.hqCastInRoom('nope', null, { salt: 'x' }).length, 0);
    /* clearance gates are honoured (none set today, so a gated spot is simulated) */
    const gated = { name: 'T', title: 'T', model: 'player', gender: 'male', lines: [], spots: [{ room: 'office', x: 0, z: 0, face: 0, minClearance: 4, doing: 'x' }] };
    CAST._gatedTest = gated;
    try {
        assert.ok(!D.hqCastInRoom('office', null, { salt: 'g', clearance: 1 }).some(c => c.id === '_gatedTest'));
        assert.ok(D.hqCastInRoom('office', null, { salt: 'g', clearance: 4 }).some(c => c.id === '_gatedTest'));
    } finally { delete CAST._gatedTest; }
    /* lines: only a member's own, or null */
    for (let i = 0; i < 10; i++) assert.ok(CAST.locke.lines.includes(D.hqCastLine('locke')));
    assert.strictEqual(D.hqCastLine('rhonda'), null);
    assert.strictEqual(D.hqCastLine('nope'), null);
});

test('the building code carries the cast hooks (source scan)', () => {
    const tr = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
    const mp = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
    assert.match(tr, /function _hqSpawnCast\(/);
    assert.match(tr, /hqCastInRoom\(roomId, opts\.profile\)/);
    assert.match(tr, /spec\.def \|\|/, 'a cast spec brings its own def');
    assert.match(tr, /ch\.reach \|\| 1\.75/, 'the talk radius is per character');
    assert.match(tr, /e\.actions\[ch\.pose\]/, 'the building pose plays');
    assert.match(mp, /getCastModel\('player'\)/, 'the avatar prefers the Player model');
    assert.match(mp, /t\.kind === 'cast'/, 'the panel knows cast members');
    assert.match(SPRITES_SRC, /function getCastModel\(id\)/);
    assert.match(SPRITES_SRC, /Meshy_AI_Agent_Glass_Character_output\.glb/, 'Glass’s export has no _biped');
    assert.match(SPRITES_SRC, /Meshy_AI_Janitor_Character_output\.glb/, 'the Janitor’s export has no _biped');
});
