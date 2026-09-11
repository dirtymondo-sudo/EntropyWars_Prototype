// door-hq.test.js — headless validation of the D.O.O.R. headquarters layout.
//
// Loads the REAL data.js (load-data.js) and checks the invariants the HQ
// builder (three-renderer.js) and the flow layer (map.js) silently rely on:
// every door leaf / prop key resolves, every catalogue entry names a .glb
// with exactly one target size, doors don't overlap each other or the stair
// arcs, the seven sector bays partition the launch maps, and the door-state /
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

test('doors on a level are ≥ 25° apart (or leave ≥ 2 m of wall between their panels) and clear of the stair arcs', () => {
    const problems = [];
    const norm = d => ((d % 360) + 360) % 360;
    const diff = (a, b) => { const x = norm(a - b); return Math.min(x, 360 - x); };
    /* Room 86 (2026-09-11) sits 15° from the Quartermaster: at the lower wall
       that is 5.5 m of wall for two panels needing 2.9 — the angle rule was a
       proxy for the wall, so the wall is the rule now (2 m of pier between
       the panel edges); the 25° still passes on its own */
    const panel = d => (d.wide || (d.leaf && HQ.catalogue[d.leaf] && HQ.catalogue[d.leaf].wide)) ? 3.3 : 2.5;
    for (const level of [0, 1]) {
        const R = level ? ROOM.shell.mezz.outer : ROOM.shell.radius;
        const ds = ROOM.doors.filter(d => (d.level || 0) === level);
        for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
            const dg = diff(ds[i].deg, ds[j].deg);
            const pier = dg * Math.PI / 180 * R - (panel(ds[i]) + panel(ds[j])) / 2;
            if (dg < 25 && pier < 2.0) problems.push(`${ds[i].id} and ${ds[j].id} are ${dg}° apart on level ${level} (${pier.toFixed(2)} m of pier)`);
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

test('the seven sector bays partition the launch maps exactly once', () => {
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
        /* the dispatch desk's well (inside rInner, floor at 0.05 m) may hold furniture — Rhonda's chair */
        const inWell = !level && ROOM.desk && p.r <= ROOM.desk.rInner - 0.3 && p.y === 0.05;
        if (p.r < rMin && !(p.y > 0.5) && !inWell) problems.push(`${label} r=${p.r} is inside the desk / off the slab (min ${rMin})`);
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

test('hqMasteryCount tallies stabilized sites over the seven bays', () => {
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


/* ── Phase 2.6 (2026-09-03): the bays as curved corridors (six then; seven since 7.5) ── */

/* the stage-1 bay rooms (one per sector) stay registered as `bay_<sector>` — the
   kill-switch path and the frame the cast's bay spots are authored in; with the
   CONTAINMENT RING corridor on (plan 5.4a stage 2) hqBayId(sector) is the RING
   of the bay's floor, tested in its own block below */
const BAYS = Object.keys(HQ.sectors).map(k => [k, HQ.rooms['bay_' + k]]);

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
    assert.strictEqual(D.hqBayId('celestial'), HQ.bayShell.corridor && HQ.bayShell.corridor.on ? D.hqRingId(0) : 'bay_celestial');
    assert.strictEqual(D.hqBayRoom('nope'), null);
    assert.strictEqual(D.hqBayId('nope'), 'bay_nope');
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
            /* an OUTDOOR room (S.open) has no ceiling: a MOUNTED prop still has
               to fit under the top of its wall, but a free-standing one may
               stand taller than the perimeter (the Moon's lander does). */
            if (mount + (c.h || 0) > S.h - 0.05 && (mount > 0 || !S.open)) problems.push(k + ': prop ' + p.key + ' mounts through the ceiling');
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
        /* an OUTDOOR room (plan 7.2 stage 3) has no ceiling to hang a fluorescent from: its lights are masts */
        if (S.open) assert.ok(Array.isArray(S.lights) && S.lights.length >= 4 && !room.props.some(p => p.ceil), k + ': an outdoor room is lit by masts, nothing hangs from a ceiling');
        else assert.ok(room.props.some(p => p.key === 'fluorescent' && (p.ceil || HQ.catalogue.fluorescent.ceil)), k + ': lit by a fluorescent');
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
    const revolving = ALL_DOORS.filter(d => d.leaf === 'leaf_revolving' && !/^egress_/.test(d.id)).length + Object.values(HQ.thresholds).filter(t => t.leaf === 'leaf_revolving').length;
    assert.ok(revolving <= 2, 'the revolving door is the one sparing use (bay + its way out; the ring\'s egress_* copy is the same door), got ' + revolving);
});

/* ── Phase 7.5 (2026-09-07, MASTER C-23 DECIDED): Bay 7 · URBAN and the rebalance ── */

test('seven bays: Bay 7 · URBAN hangs on the mezzanine at 180° and the rebalance moved the right sites', () => {
    assert.strictEqual(Object.keys(HQ.sectors).length, 7, 'seven sectors');
    const urban = ROOM.doors.find(d => d.action && d.action.sector === 'urban');
    assert.ok(urban, 'the urban bay door exists');
    assert.strictEqual(urban.level, 1);
    assert.strictEqual(urban.deg, 180);
    assert.match(urban.label, /BAY 7/);
    assert.deepStrictEqual(Array.from(HQ.sectors.urban.maps).sort(), ['prebuilt_cyberpunk', 'prebuilt_stadium']);
    assert.strictEqual(D.hqSectorOfMap('prebuilt_vatican'), 'diplomatic', 'Vatican City → Diplomatic');
    assert.strictEqual(D.hqSectorOfMap('prebuilt_atlantis'), 'hollow', 'Atlantis → Hollow');
    assert.ok(!HQ.sectors.celestial.maps.includes('prebuilt_cyberpunk') && !HQ.sectors.terrestrial.maps.includes('prebuilt_stadium'));
    /* the bay numbers on the egress doors are 1–7, each once */
    const nos = ROOM.doors.filter(d => d.action && d.action.sector).map(d => +(d.label.match(/BAY\s*(\d+)/) || [])[1]).sort((a, b) => a - b);
    assert.strictEqual(JSON.stringify(nos), JSON.stringify([1, 2, 3, 4, 5, 6, 7]));
    /* nothing else stands where the door now hangs (the two boxes moved) */
    const near = ROOM.props.filter(p => (p.level || 0) === 1 && p.r != null && Math.abs(((p.deg - 180 + 540) % 360) - 180) < 8);
    assert.deepStrictEqual(Array.from(near.map(p => p.key + '@' + p.deg)), [], 'floor props inside Bay 7\'s door panel');
});

/* ── Phase 5.4a (2026-09-07): THE CONTAINMENT RING — the bays link end to end ── */

test('the ring: every bay on a shared floor wears two cap doors that lead to its neighbours and back', () => {
    assert.ok(HQ.bayShell.ring, 'the ring is on');
    assert.strictEqual(typeof D.hqBayRing, 'function');
    const problems = [];
    const leafCat = HQ.catalogue[HQ.bayShell.ringLeaf];
    assert.ok(leafCat && leafCat.leaf && leafCat.wide && !leafCat.rank, 'the ring leaf is a wide, non-rank catalogue leaf');
    for (const [k, room] of BAYS) {
        const ring = D.hqBayRing(k);
        const caps = room.doors.filter(d => d.cap);
        const bayDoor = ROOM.doors.find(d => d.action && d.action.sector === k);
        const floorMates = ROOM.doors.filter(d => d.action && d.action.sector && (d.level || 0) === (bayDoor.level || 0));
        if (floorMates.length < 2) { if (ring || caps.length) problems.push(k + ': a bay alone on its floor has no ring'); continue; }
        if (!ring || caps.length !== 2) { problems.push(k + ': expected two cap doors, got ' + caps.length); continue; }
        assert.strictEqual(JSON.stringify(room.ring), JSON.stringify(ring), k + ': the room carries its ring');
        for (const d of caps) {
            const nbSector = d.action && d.action.sector;
            if (!(d.id === 'cap_' + d.cap && ['cw', 'ccw'].includes(d.cap))) problems.push(k + ': cap door id/cap ' + d.id);
            if (Math.abs(d.deg) !== room.shell.arc[1]) problems.push(k + ': ' + d.id + ' stands at ' + d.deg + ', not on the cap ±' + room.shell.arc[1]);
            if (d.leaf !== HQ.bayShell.ringLeaf || !d.wide) problems.push(k + ': ' + d.id + ' leaf');
            if (nbSector !== (d.cap === 'cw' ? ring.cw : ring.ccw)) problems.push(k + ': ' + d.id + ' leads to ' + nbSector);
            if (d.roomNo != null) problems.push(k + ': ' + d.id + ' carries a room number');
            const far = HQ.rooms['bay_' + nbSector];   // the stage-1 neighbour room (hqBayId is the ring when the corridor is on)
            const farCap = far && far.doors.find(x => x.id === d.action.at);
            if (!farCap || !farCap.cap) { problems.push(k + ': ' + d.id + ' lands at no cap (' + d.action.at + ')'); continue; }
            if (farCap.cap === d.cap) problems.push(k + ': ' + d.id + ' lands at the same-handed cap');
            if (farCap.action.sector !== k || farCap.action.at !== d.id) problems.push(k + ': ' + d.id + ' is not reciprocated by ' + nbSector + '/' + farCap.id);
            /* the neighbour on the far side is on the same floor */
            const nbDoor = ROOM.doors.find(x => x.action && x.action.sector === nbSector);
            if ((nbDoor.level || 0) !== (bayDoor.level || 0)) problems.push(k + ': ' + d.id + ' crosses floors');
            /* the cap door is a bay door in every way the lamp cares about */
            if (D.doorSiteState(d, null) !== D.doorSiteState(nbDoor, null)) problems.push(k + ': ' + d.id + ' lamp differs from the egress door of ' + nbSector);
        }
        /* the cap-side dressing steps back from the door frame (a 3.3 m panel on a 4 m cap protrudes 0.5 m) */
        for (const p of room.props) {
            if (p.ceil || typeof p.deg !== 'number') continue;
            const capDeg = room.shell.arc[1] - Math.abs(p.deg);
            const r = p.r != null ? p.r : (p.side === 'in' ? room.shell.rIn : room.shell.rOut);
            if (capDeg * Math.PI / 180 * r < 0.75) problems.push(k + ': ' + p.key + ' @' + p.deg + ' stands in the cap door');
        }
    }
    assert.deepStrictEqual(problems, []);
    /* walking clockwise from any bay comes home after exactly one lap of its floor */
    for (const [k] of BAYS) {
        const ring = D.hqBayRing(k);
        if (!ring) continue;
        const seen = [k];
        let cur = k;
        for (let i = 0; i < ring.count; i++) { cur = D.hqBayRing(cur).cw; if (i < ring.count - 1) seen.push(cur); }
        assert.strictEqual(cur, k, k + ': one clockwise lap returns home');
        assert.strictEqual(new Set(seen).size, ring.count, k + ': the lap visits every bay on the floor once');
        const lvl = (ROOM.doors.find(d => d.action && d.action.sector === k).level || 0);
        assert.strictEqual(ring.count, ROOM.doors.filter(d => d.action && d.action.sector && (d.level || 0) === lvl).length);
    }
    /* the ground floor is a two-bay loop (1 ⇄ 4); the mezzanine ring is the other five */
    assert.strictEqual(JSON.stringify(D.hqBayRing('terrestrial')), JSON.stringify({ level: 0, count: 2, cw: 'celestial', ccw: 'celestial' }));
    assert.strictEqual(D.hqBayRing('ancient').count, 5);
    assert.strictEqual(D.hqBayRing('urban').cw, 'hollow');
    assert.strictEqual(D.hqBayRing('urban').ccw, 'diplomatic');
    /* a locked sector seals the ring doors INTO it (the lamp is the neighbour bay's) */
    const intoQ = HQ.rooms.bay_hollow.doors.find(d => d.cap && d.action.sector === 'quarantined');
    assert.ok(intoQ, 'hollow\'s clockwise cap opens on the quarantined bay');
    assert.strictEqual(D.doorSiteState(intoQ, null), 'sealed');
});

test('the ring can be switched off: dead-end caps and no cap doors (the pre-5.4a bays)', () => {
    const was = HQ.bayShell.ring;
    try {
        HQ.bayShell.ring = false;
        assert.strictEqual(D.hqBayRing('ancient'), null);
        const room = D.hqBayRoom('ancient');
        assert.strictEqual(room.doors.filter(d => d.cap).length, 0);
        assert.strictEqual(room.ring, null);
    } finally { HQ.bayShell.ring = was; }
    assert.ok(D.hqBayRing('ancient'), 'restored');
});

/* ── Phase 5.4a stage 2 (2026-09-08): THE CONTAINMENT RING is one corridor per floor ── */

const CORR = HQ.bayShell.corridor;
const RINGS = CORR && CORR.on ? [0, 1].map(l => [l, D.hqRingLayout(l), HQ.rooms[D.hqRingId(l)]]).filter(x => x[1]) : [];
const unwrap = (deg, a0) => { let d = deg; while (d < a0 - 1e-6) d += 360; while (d >= a0 + 360 - 1e-6) d -= 360; return d; };

test('the corridor: two ring rooms, framed just outside the egress drum, every bay a segment of its floor', () => {
    assert.ok(CORR && CORR.on, 'the corridor is on');
    assert.ok(HQ.bayShell.ring, 'stage 2 rides stage 1');
    assert.strictEqual(RINGS.length, 2, 'a ring per floor of the egress');
    const S = ROOM.shell;
    for (const [level, lay, room] of RINGS) {
        assert.ok(room && room.kind === 'bay' && room.corridor, 'ring ' + level + ' is a corridor room');
        assert.strictEqual(room.level, level);
        assert.strictEqual(lay.id, D.hqRingId(level));
        /* just outside the drum the bay doors hang on: the lower wall (r 21) downstairs, the upper drum (mezz.outer 24) upstairs */
        const drum = level ? S.mezz.outer : S.radius;
        assert.ok(lay.rIn >= drum + 0.3 && lay.rIn <= drum + 1.5, 'ring ' + level + ' inner wall at ' + lay.rIn + ' vs the drum at ' + drum);
        assert.ok(Math.abs((lay.rOut - lay.rIn) - (HQ.bayShell.rOut - HQ.bayShell.rIn)) < 1e-9, 'the corridor keeps the bays\' 4 m width');
        assert.strictEqual(JSON.stringify(room.shell.arc), JSON.stringify(lay.arc));
        assert.strictEqual(!!room.shell.full, lay.full);
        /* every bay door on this floor of the egress is a segment, in door-angle order round the ring */
        const bays = ROOM.doors.filter(d => d.action && d.action.sector && (d.level || 0) === level);
        assert.strictEqual(lay.segments.length, bays.length, 'ring ' + level + ' segments');
        for (const bd of bays) {
            const sg = lay.segments.find(x => x.sector === bd.action.sector);
            assert.ok(sg, bd.id + ' has no segment');
            assert.strictEqual(sg.deg, bd.deg, bd.id + ' segment at the egress door\'s angle');
            assert.strictEqual(sg.bayNo, D.hqBayNo(bd.action.sector));
            assert.strictEqual(sg.n, HQ.sectors[bd.action.sector].maps.length);
            assert.strictEqual(D.hqBayId(bd.action.sector), lay.id, bd.id + ' resolves to its floor\'s ring');
            assert.strictEqual(D.hqBayLevel(bd.action.sector), level);
            /* the segment holds its own egress angle and its whole door run */
            const c = unwrap(sg.c, lay.arc[0]), dg = unwrap(sg.deg, lay.arc[0]);
            assert.ok(dg >= sg.from - 1e-6 && dg <= sg.to + 1e-6, bd.id + ': egress door at ' + dg + ' outside its segment [' + sg.from + ', ' + sg.to + ']');
            assert.ok(c - sg.w / 2 >= sg.from - 1e-6 && c + sg.w / 2 <= sg.to + 1e-6, bd.id + ': door run outside its segment');
            assert.ok(c - sg.w / 2 >= lay.arc[0] - 1e-6 && c + sg.w / 2 <= lay.arc[1] + 1e-6, bd.id + ': door run outside the arc');
        }
        for (let i = 1; i < lay.segments.length; i++) assert.ok(lay.segments[i].from >= lay.segments[i - 1].to - 1e-6, 'segments in order');
        assert.strictEqual(lay.segments[0].from, lay.arc[0]); assert.strictEqual(lay.segments[lay.segments.length - 1].to, lay.arc[1]);
        assert.match(room.sub, new RegExp('^' + lay.floor + ' · BAYS '));
    }
    /* the plan's floors: downstairs Bays 1 and 4; upstairs 2 · 5 · 7 · 3 · 6 in door order */
    assert.strictEqual(JSON.stringify(RINGS[0][1].segments.map(s => s.bayNo)), '[1,4]');
    assert.strictEqual(JSON.stringify(RINGS[1][1].segments.map(s => s.bayNo)), '[2,5,7,3,6]');
    assert.ok(!RINGS[0][1].full && !RINGS[1][1].full, 'neither ring closes by itself (the service side has no bays)');
});

test('the corridor: every threshold once, on the outer wall, at its bay, no two doors touching, the way back at the egress door\'s angle', () => {
    const launch = D.EW_MAP_META.filter(m => !m.isDelta).map(m => m.id);
    const seen = {};
    for (const [level, lay, room] of RINGS) {
        const problems = [];
        const a0 = lay.arc[0];
        const stage1 = k => HQ.rooms['bay_' + k];
        for (const sg of lay.segments) {
            const eg = room.doors.find(d => d.id === D.hqBayEntry(sg.sector));
            if (!eg) { problems.push(sg.sector + ': no way back'); continue; }
            const bd = ROOM.doors.find(d => d.action && d.action.sector === sg.sector);
            if (eg.side !== 'in' || eg.deg !== bd.deg || eg.leaf !== bd.leaf || !!eg.wide !== !!bd.wide) problems.push(sg.sector + ': the way back is not the egress door seen from behind');
            if (!eg.action || eg.action.room !== 'central_egress' || eg.action.at !== bd.id) problems.push(sg.sector + ': the way back does not land at ' + bd.id);
            if (eg.bay !== sg.label || eg.sector !== sg.sector) problems.push(sg.sector + ': the way back does not name its bay');
            /* the thresholds: the stage-1 bay's, same leaf / number / hook, spaced like the bays, inside the segment */
            const mine = room.doors.filter(d => d.action && d.action.mission && d.sector === sg.sector);
            if (mine.length !== sg.n) problems.push(sg.sector + ': ' + mine.length + ' thresholds, expected ' + sg.n);
            for (const d of mine) {
                const old = stage1(sg.sector).doors.find(x => x.id === d.id);
                if (!old) { problems.push(d.id + ': not a stage-1 threshold of ' + sg.sector); continue; }
                for (const f of ['leaf', 'wide', 'label', 'sub', 'roomNo', 'why', 'note']) if (JSON.stringify(d[f]) !== JSON.stringify(old[f])) problems.push(d.id + ': ' + f + ' differs from the bay\'s');
                if (d.side !== 'out') problems.push(d.id + ': not on the outer wall');
                const dg = unwrap(d.deg, a0);
                if (dg < sg.from || dg > sg.to) problems.push(d.id + ': at ' + dg + ', outside its segment');
                seen[d.action.mission] = (seen[d.action.mission] || 0) + 1;
            }
        }
        /* no two doors on one wall closer than their panels; a bay's outermost door keeps endPadM to the cap */
        const panel = d => (d.wide ? 3.3 : 2.5);
        for (const side of ['in', 'out']) {
            const R = side === 'in' ? lay.rIn : lay.rOut;
            const ds = room.doors.filter(d => d.side === side).sort((a, b) => unwrap(a.deg, a0) - unwrap(b.deg, a0));
            for (let i = 1; i < ds.length; i++) {
                const gapM = (unwrap(ds[i].deg, a0) - unwrap(ds[i - 1].deg, a0)) * Math.PI / 180 * R - (panel(ds[i]) + panel(ds[i - 1])) / 2;
                if (gapM < -1e-6) problems.push(ds[i - 1].id + ' and ' + ds[i].id + ' overlap by ' + (-gapM).toFixed(2) + ' m');
                if (ds[i].sector !== ds[i - 1].sector && gapM < CORR.gapM - 0.05) problems.push(ds[i - 1].id + ' | ' + ds[i].id + ': ' + gapM.toFixed(2) + ' m between bays, wants ' + CORR.gapM);
            }
            if (!lay.full && ds.length) {
                const lo = (unwrap(ds[0].deg, a0) - a0) * Math.PI / 180 * R - HQ.bayShell.spacing / 2;
                const hi = (lay.arc[1] - unwrap(ds[ds.length - 1].deg, a0)) * Math.PI / 180 * R - HQ.bayShell.spacing / 2;
                if (side === 'out' && (Math.abs(lo - CORR.endPadM) > 0.05 || Math.abs(hi - CORR.endPadM) > 0.05)) problems.push('ring ' + level + ': end pads ' + lo.toFixed(2) + ' / ' + hi.toFixed(2) + ' m past the run, wants ' + CORR.endPadM);
                if (lo + HQ.bayShell.spacing / 2 - panel(ds[0]) / 2 < 0.5 || hi + HQ.bayShell.spacing / 2 - panel(ds[ds.length - 1]) / 2 < 0.5) problems.push('ring ' + level + ' ' + side + ': a door in the cap');
            }
        }
        /* everything with an angle stands inside the corridor */
        for (const p of room.props) if (p.r != null && (p.r < lay.rIn + 0.3 || p.r > lay.rOut - 0.3)) problems.push(p.key + ' @' + p.deg + ' r ' + p.r + ' is in a wall');
        for (const ag of room.agents) if (ag.r < lay.rIn + 0.5 || ag.r > lay.rOut - 0.5) problems.push('guard ' + ag.sector + ' r ' + ag.r);
        assert.deepStrictEqual(problems, []);
        assert.strictEqual(room.agents.length, lay.segments.length, 'a guard per bay');
        for (const sg of lay.segments) {
            const g = room.agents.find(a => a.sector === sg.sector);
            const gd = unwrap(g.deg, a0);
            assert.ok(gd >= sg.from && gd <= sg.to, sg.sector + ': the guard stands in another bay');
            assert.strictEqual(g.line, HQ.bays[sg.sector].agent);
            assert.strictEqual(D.hqRingSectorAt(room, g.deg).sector, sg.sector, 'hqRingSectorAt names the guard\'s bay');
            const rs = room.segments.find(x => x.sector === sg.sector);
            assert.strictEqual(JSON.stringify(rs.lines), JSON.stringify(HQ.bays[sg.sector].lines), 'the bay\'s overheard lines ride its segment');
        }
        for (const d of room.doors.filter(d => d.action && d.action.mission)) assert.strictEqual(D.hqRingSectorAt(room, d.deg).sector, d.sector, d.id + ' is in its bay\'s segment');
    }
    assert.strictEqual(JSON.stringify(launch.filter(id => seen[id] !== 1)), '[]', 'every launch map has exactly one threshold on the rings');
});

test('the corridor: the caps wear the ring door to each other, clear of the dressing; the ring closes by hand', () => {
    for (const [level, lay, room] of RINGS) {
        const caps = room.doors.filter(d => d.cap);
        if (lay.full || !CORR.close) { assert.strictEqual(caps.length, 0); continue; }
        assert.strictEqual(caps.length, 2, 'ring ' + level + ' caps');
        for (const d of caps) {
            assert.strictEqual(d.id, 'cap_' + d.cap);
            assert.strictEqual(d.leaf, HQ.bayShell.ringLeaf); assert.ok(d.wide && d.ring && d.roomNo == null);
            assert.strictEqual(JSON.stringify(d.action), JSON.stringify({ room: lay.id, at: d.cap === 'cw' ? 'cap_ccw' : 'cap_cw' }), d.id + ' leads to the other cap of the same ring');
            assert.strictEqual(D.doorSiteState(d, null), 'open');
            assert.strictEqual(unwrap(d.deg, lay.arc[0]), d.cap === 'cw' ? lay.arc[1] : lay.arc[0], d.id + ' stands on its cap');
        }
        /* the cap-side dressing steps back from the door frame (a 3.3 m panel on a 4 m cap protrudes 0.5 m) */
        for (const p of room.props) {
            if (p.ceil || typeof p.deg !== 'number') continue;
            const dg = unwrap(p.deg, lay.arc[0]);
            const capDeg = Math.min(dg - lay.arc[0], lay.arc[1] - dg);
            const r = p.r != null ? p.r : (p.side === 'in' ? lay.rIn : lay.rOut);
            assert.ok(capDeg * Math.PI / 180 * r >= 0.75, 'ring ' + level + ': ' + p.key + ' @' + p.deg + ' stands in the cap door');
        }
    }
    /* a hand span of 360 closes the circle: no caps, `full`, the doors still fit */
    const was = CORR.arc[1];
    try {
        CORR.arc[1] = [0, 360];
        const lay = D.hqRingLayout(1), room = D.hqRingRoom(1);
        assert.ok(lay.full && room.shell.full);
        assert.strictEqual(JSON.stringify(lay.arc), '[0,360]');
        assert.strictEqual(room.doors.filter(d => d.cap).length, 0);
        assert.strictEqual(room.doors.filter(d => d.action && d.action.mission).length, RINGS[1][2].doors.filter(d => d.action && d.action.mission).length);
    } finally { CORR.arc[1] = was; }
});

test('the corridor: the site rooms, the register, the cast and the panels all follow hqBayId / hqBayEntry', () => {
    /* a site room's way back lands at its own threshold on the ring */
    for (const id of HQ.siteRooms.built) {
        const sr = HQ.rooms[D.hqSiteRoomId(id)];
        const back = sr.doors.find(d => d.id === 'egress');
        const ringId = D.hqBayId(D.hqSectorOfMap(id));
        assert.strictEqual(JSON.stringify(back.action), JSON.stringify({ room: ringId, at: 'site_' + id }), id + ': the way back');
        assert.ok(HQ.rooms[ringId].doors.find(d => d.id === 'site_' + id), id + ': that door is on the ring');
        if (!HQ.thresholds[id].sub) assert.match(sr.sub, new RegExp('BAY ' + D.hqBayNo(D.hqSectorOfMap(id)) + '$'), id + ': the site room names its bay');
    }
    /* the register knows the bay number of every site without a bay room */
    const reg = D.hqRoomRegister();
    for (const r of reg.filter(r => r.kind === 'site')) {
        assert.strictEqual(r.bayNo, D.hqBayNo(r.sector), r.id + ' bay number');
        assert.strictEqual(r.room, D.hqBayId(r.sector));
    }
    assert.strictEqual(reg.find(r => r.id === 'prebuilt_stadium').bayNo, 7);
    assert.strictEqual(reg.find(r => r.id === 'prebuilt_mars').bayNo, 4);
    /* the cast's bay spots carry over into the corridor, on the same side of the same door */
    const sed = CAST.sedaniel.spots[0];
    const moved = D.hqRingSpot('terrestrial', sed);
    const lay = D.hqRingLayout(0), seg = lay.segments.find(s => s.sector === 'terrestrial');
    assert.strictEqual(moved.room, lay.id); assert.strictEqual(moved.src, sed); assert.strictEqual(moved.bay, 'bay_terrestrial');
    assert.ok(moved.r > lay.rIn + 0.5 && moved.r < lay.rOut - 0.5, 'in the corridor');
    assert.ok(Math.abs(moved.r - lay.rIn - (sed.r - HQ.bayShell.rIn)) < 1e-6, 'the same distance off the inner wall');
    assert.ok(Math.sign(D.hqPolar ? 1 : 1) && (unwrap(moved.deg, lay.arc[0]) < unwrap(seg.c, lay.arc[0])) === (sed.deg < 0), 'the same side of the way in');
    assert.strictEqual(D.hqRingSectorAt(HQ.rooms[lay.id], moved.deg).sector, 'terrestrial');
    assert.strictEqual(D.hqRingSpot('nope', sed), sed, 'no segment, no change');
    /* the flavour props followed too */
    const tv = HQ.rooms[lay.id].props.find(p => p.key === 'tube_tv');
    assert.ok(tv && tv.src === HQ.bays.terrestrial.props[0] && D.hqRingSectorAt(HQ.rooms[lay.id], tv.deg).sector === 'terrestrial');
    /* the flow layer never hard-codes the landing door any more */
    const src = require('fs').readFileSync(require('path').join(__dirname, 'map.js'), 'utf8');
    assert.ok(src.includes('function _hqBayEntry(sector)'), 'map.js resolves the bay entry through hqBayEntry');
    assert.strictEqual((src.match(/data-at="egress"/g) || []).length, 2, 'the two remaining literal landings are the site rooms\' own way-in door');
    const rsrc = require('fs').readFileSync(require('path').join(__dirname, 'three-renderer.js'), 'utf8');
    assert.ok(/S\.full \? \[\] : \[a0, a1\]/.test(rsrc) && /!S\.full && !_hqWithinArc/.test(rsrc), 'the renderer knows a full ring has no caps');
});

test('the corridor can be switched off: the stage-1 bays come back, one room each', () => {
    const was = CORR.on;
    try {
        CORR.on = false;
        assert.strictEqual(D.hqCorridorOn(), false);
        assert.strictEqual(D.hqBayId('celestial'), 'bay_celestial');
        assert.strictEqual(D.hqBayEntry('celestial'), 'egress');
        assert.strictEqual(D.hqRingLayout(0), null);
        assert.strictEqual(D.hqRingRoom(1), null);
        assert.strictEqual(D.hqRingSpot('terrestrial', CAST.sedaniel.spots[0]), CAST.sedaniel.spots[0]);
        assert.ok(D.hqCastInRoom('bay_terrestrial', null, { salt: 'x' }).some(c => c.id === 'sedaniel'), 'Sedaniel is back in the bay room');
        assert.strictEqual(D.hqRoomRegister().find(r => r.id === 'prebuilt_mars').room, 'bay_celestial');
    } finally { CORR.on = was; }
    assert.strictEqual(D.hqBayId('celestial'), D.hqRingId(0), 'restored');
});

/* the renderer hangs a cap door on a flat wall (the _hqCapWall path) and map.js lands ring walks at the far cap */
test('source scan: the renderer knows cap doors and map.js honours a sector door\'s `at`', () => {
    const fs = require('fs');
    const tr = fs.readFileSync(require('path').join(__dirname, 'three-renderer.js'), 'utf8');
    assert.match(tr, /function _hqCapWall\(room, door\)/);
    assert.match(tr, /room\.kind === 'bay' && door\.cap\) \? _hqCapWall\(room, door\)/);
    const mp = fs.readFileSync(require('path').join(__dirname, 'map.js'), 'utf8');
    assert.match(mp, /return \{ room: bayId, at: act\.at \|\| _hqBayEntry\(act\.sector\) \}/);
    assert.match(mp, /data-at="\$\{_hqEsc\(act\.at \|\| _hqBayEntry\(act\.sector\)\)\}"/);
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
            if (s.reach != null && !(s.reach > 0 && s.reach <= 5.5)) problems.push(id + ': reach');
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
                    /* the dispatch desk's WELL (inside rInner, floor at 0.05 m) is a legal post — Rhonda's */
                    const inWell = ROOM.desk && s.r <= ROOM.desk.rInner - BODY && s.y === 0.05;
                    if (s.r > S.radius - BODY - 0.1 || (s.r < rMin && !inWell)) problems.push(id + ': floor spot r=' + s.r + ' outside the ring');
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
    assert.ok(ROOM.props.filter(p => p.key === 'cardboard_box' && (p.level || 0) === 1).length >= 2, 'Otto’s crates on the mezzanine');
    assert.ok(HQ.rooms.office.props.some(p => p.key === 'mop_bucket'), 'the closet keeps its bucket');
    const rh = CAST.rhonda.spots[0];
    assert.ok(rh.pose === 'hqSit' && rh.reach >= 3 && rh.r < ROOM.desk.rInner && ROOM.props.some(p => p.key === 'office_chair' && Math.abs(p.deg - rh.deg) < 1 && Math.abs(p.r - rh.r) < 0.2 && p.y === 0.05), 'Rhonda sits on the chair inside the dispatch desk, reachable across the counter');
    const kt = CAST.kit.spots[0];
    assert.ok(kt.pose === 'hqSit' && ROOM.props.some(p => p.key === 'folding_chair' && Math.abs(p.deg - kt.deg) < 1 && Math.abs(p.r - kt.r) < 0.2), 'Kit waits on a folding chair at the desk');
    const jn = CAST.janitor.spots[0];
    assert.ok(jn.hold && jn.hold.key === 'mop' && HQ.catalogue.mop && /Hand$/.test(jn.hold.bone), 'the Janitor holds the mop');
    /* every held prop names a catalogue GLB and a hand bone */
    for (const [id, m] of Object.entries(CAST)) for (const sp of m.spots) if (sp.hold) assert.ok(HQ.catalogue[sp.hold.key] && HQ.catalogue[sp.hold.key].file && /^(Left|Right)Hand$/.test(sp.hold.bone), id + ': hold');
    assert.strictEqual(HQ.rooms.training.roomNo, '64', 'the Training Room is Room 64');
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
                /* a bay spot carried onto the containment ring (plan 5.4a stage 2) is a copy whose `src` is the sheet's row */
                assert.ok(CAST[c.id].spots.includes(c.spot) || (c.spot.src && CAST[c.id].spots.includes(c.spot.src)));
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
    assert.ok(seen.sedaniel && seen.sedaniel[D.hqBayId('terrestrial')], 'Sedaniel is parked in the terrestrial bay (its ring, when the corridor is on)');
    if (D.hqCorridorOn()) assert.ok(!seen.sedaniel.bay_terrestrial, 'his stage-1 spot is not ALSO drawn into the retired bay room');
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

/* ── Phase 7.1 (2026-09-07): THE ROOM REGISTER — a number on every door ── */

test('every launch map wears a roomNo on its threshold; hqRoomNo reads it (Δ suffix stripped)', () => {
    const launch = Array.from(D.EW_MAP_META.filter(m => !m.isDelta).map(m => m.id));
    const missing = launch.filter(id => !HQ.thresholds[id] || HQ.thresholds[id].roomNo == null || String(HQ.thresholds[id].roomNo).trim() === '');
    assert.deepStrictEqual(missing, [], 'launch maps without a room number');
    for (const id of launch) {
        assert.strictEqual(typeof HQ.thresholds[id].roomNo, 'string', id + ': roomNo is a string (alphanumerics ride the same field)');
        assert.strictEqual(D.hqRoomNo(id + '_delta'), HQ.thresholds[id].roomNo, id + ': the Δ board wears the site number');
        assert.ok(HQ.thresholds[id].why, id + ': every number has its hook (why)');
    }
    /* the user's numbers, spot-checked */
    assert.strictEqual(D.hqRoomNo('prebuilt_stonehenge'), '56');
    assert.strictEqual(D.hqRoomNo('prebuilt_camelot'), 'i');
    assert.strictEqual(D.hqRoomNo('prebuilt_atlantis'), 'H-20');
    assert.strictEqual(D.hqRoomNo('prebuilt_antarctica'), '90S');
    assert.strictEqual(D.hqRoomNo('prebuilt_flatlands'), '2D');
    assert.strictEqual(D.hqRoomNo('prebuilt_backrooms'), '90');
    assert.strictEqual(D.hqRoomNo('prebuilt_hell'), '666');
    assert.strictEqual(D.hqRoomNo('nope'), '');
    assert.strictEqual(D.hqRoomNo(null), '');
    assert.strictEqual(D.DOOR_TEXT.SITE_FILE_LABELS.room, 'ROOM', 'the site file header knows the word');
});

test('the facility boards wear rooms: the Training Room board is Room 64, the Holo Sim is 404', () => {
    assert.strictEqual(HQ.rooms.training.roomNo, '64');
    assert.strictEqual(D.hqRoomNo('prebuilt_training'), '64');
    assert.strictEqual(D.hqRoomNo('prebuilt_training_delta'), '64');
    assert.strictEqual(D.hqRoomNo('prebuilt_holosim'), '404');
    assert.strictEqual(D.hqRoomNo('training'), '64', 'the room id resolves too');
    assert.strictEqual(D.hqRoomNo('office'), '101');
    assert.ok(!/ROOM 64/.test(HQ.rooms.training.sub), 'the hand-written ROOM 64 moved onto the field');
    /* never sites: no threshold, no bay */
    for (const id of Object.keys(HQ.facility)) {
        assert.ok(D.EW_MAP_META.some(m => m.id === id && m.isDelta), id + ' is a Δ facility board in EW_MAP_META');
        assert.ok(!HQ.thresholds[id] && !D.hqSectorOfMap(id), id + ' is a facility board, not a site');
    }
});

test('one number, one place: the register is unique, every entry resolves, and it sorts numbers first then alphanumerics', () => {
    const reg = D.hqRoomRegister();
    assert.ok(reg.length >= 36, 'register short: ' + reg.length);
    const seen = new Map();
    for (const r of reg) {
        assert.ok(r.no && typeof r.no === 'string', 'blank number on ' + r.label);
        assert.ok(r.label, 'no label on ' + r.no);
        assert.ok(['site', 'room', 'door', 'counter', 'facility'].includes(r.kind), r.no + ': kind');
        assert.strictEqual(D.hqRoomNo(r.mapId || r.id), r.no, r.no + ': hqRoomNo round-trips');
        seen.set(r.no, (seen.get(r.no) || 0) + 1);
    }
    const dups = Array.from(seen.entries()).filter(([, n]) => n > 1).map(([no]) => no);
    assert.deepStrictEqual(dups, [], 'numbers shared by more than one place');
    /* every site is in it exactly once, with its bay */
    const launch = Array.from(D.EW_MAP_META.filter(m => !m.isDelta).map(m => m.id));
    for (const id of launch) {
        const rows = reg.filter(r => r.mapId === id);
        assert.strictEqual(rows.length, 1, id + ' listed ' + rows.length + ' times');
        assert.ok(rows[0].kind === 'site' && rows[0].sector && rows[0].room === D.hqBayId(rows[0].sector) && rows[0].bayNo >= 1, id + ': site row carries its bay');
    }
    /* the order: plain numbers ascending, then the alphanumerics */
    const nos = reg.map(r => r.no);
    const firstAlpha = nos.findIndex(n => !/^\d+$/.test(n));
    assert.ok(firstAlpha > 0, 'alphanumerics exist and come after the numbers');
    for (let i = 1; i < firstAlpha; i++) assert.ok(+nos[i] > +nos[i - 1], 'numeric order at ' + nos[i]);
    for (let i = firstAlpha; i < nos.length; i++) assert.ok(!/^\d+$/.test(nos[i]), 'a plain number after the alphanumerics: ' + nos[i]);
    assert.ok(D.hqRoomNoCompare('56', '444') < 0 && D.hqRoomNoCompare('444', '56') > 0 && D.hqRoomNoCompare('9600', 'H-20') < 0 && D.hqRoomNoCompare('2D', '90S') < 0 && D.hqRoomNoCompare('i', 'i') === 0);
    /* the plate machine: a door into a numbered room shows the room's number; a threshold shows its site's; a bay door shows none */
    const E = ROOM.doors;
    assert.strictEqual(D.hqDoorNo(E.find(d => d.id === 'training')), '64');
    assert.strictEqual(D.hqDoorNo(E.find(d => d.id === 'office')), '101');
    assert.strictEqual(D.hqDoorNo(E.find(d => d.id === 'records')), '42');
    assert.strictEqual(D.hqDoorNo(E.find(d => d.id === 'bay_ancient')), '', 'bays wear bay numbers, not room numbers');
    for (const d of E.filter(d => d.action && d.action.sector)) assert.ok(d.roomNo == null, d.id + ': bay doors carry no roomNo');
    for (const d of E.filter(d => d.action && d.action.room)) assert.ok(d.roomNo == null || !HQ.rooms[d.action.room] || HQ.rooms[d.action.room].roomNo == null, d.id + ': a door into a numbered room does not carry its own number');
    const stone = HQ.rooms.bay_ancient.doors.find(d => d.action && d.action.mission === 'prebuilt_stonehenge');
    assert.strictEqual(D.hqDoorNo(stone), '56');
    assert.strictEqual(stone.roomNo, '56');
    const atl = HQ.rooms.bay_hollow.doors.find(d => d.action && d.action.mission === 'prebuilt_atlantis');   // Atlantis → Hollow (plan 7.5)
    assert.strictEqual(atl.sub, 'DEEP OCEAN ORICHALCUM RESEARCH', "a threshold's sub replaces the bay sub-line");
    /* the Canon Office's plate is a joke and a policy */
    assert.ok(/CONTESTED/.test(D.hqRoomNo('continuity')));
});

test('the elevator floor panel skips 13', () => {
    const el = ROOM.doors.find(d => d.id === 'elevator');
    assert.ok(Array.isArray(el.floors) && el.floors.length > 10, 'the elevator has a floor panel');
    assert.ok(!el.floors.includes('13'), 'there is no 13th floor');
    assert.ok(el.floors.includes('12') && el.floors.includes('14'), '12 and 14 are both there');
    assert.strictEqual(new Set(el.floors).size, el.floors.length, 'no floor twice');
});

test('the register reaches every surface it is due on (source scan)', () => {
    const has = (file, re) => re.test(fs.readFileSync(path.join(__dirname, file), 'utf8'));
    assert.ok(has('three-renderer.js', /_hqPlateNo\(door\)/) && has('three-renderer.js', /_hqPlateNo\(c\)/) && has('three-renderer.js', /room\.roomNo/), 'renderer: door, counter and room plates');
    assert.ok(has('map.js', /hqDoorNo/) && has('map.js', /hqRoomRegister/) && has('map.js', /d\.floors/), 'map.js: panels, the directory register, the elevator panel');
    assert.ok(has('match-select.js', /siteRoomNo\(mp\)/) && has('match-select.js', /SITE_FILE_LABELS[^\n]*room/), 'match-select: the SITE FILE header');
    assert.ok(has('battle.js', /' · ROOM ' \+ roomNo/) && has('battle.js', /'SITE FILE · ' \+ \(roomNo/), 'battle.js: the result stamp case line and the loading card');
    assert.ok(has('styles-base.css', /\.hq-plate em/) && has('styles-base.css', /\.hq-no/), 'the plate + tag styles');
});

/* ── Phase 7.2 (2026-09-07): the walkable site — D.U.M.B. first ──────── */

test('hqSiteBoardInfo reads a Δ board as room geometry: 8×8 cells with levels, the edge walls, the monuments, the nexus', () => {
    const info = D.hqSiteBoardInfo('prebuilt_dumb');
    assert.ok(info && info.w === 8 && info.h === 8 && info.base === 5, 'the D.U.M.B. Δ board');
    assert.strictEqual(D.hqSiteBoardInfo('prebuilt_dumb_delta').w, 8, 'the Δ suffix is stripped');
    assert.strictEqual(D.hqSiteBoardInfo('nope'), null);
    const tb = D.hqSiteBoard('prebuilt_training');
    assert.ok(tb && tb.isDelta && tb.w === 8 && tb.name === 'Training Room', 'a facility board reads too (never a room, never a site)');
    let steps = 0, blocks = 0;
    for (const row of info.cells) for (const c of row) {
        assert.ok(typeof c.key === 'string' && Number.isInteger(c.lvl) && c.lvl >= -2 && c.lvl <= 2, 'cell ' + JSON.stringify(c));
        assert.ok(typeof c.walk === 'boolean' && typeof c.fluid === 'boolean');
        if (c.lvl === 1) steps++; if (c.lvl === 2) blocks++;
    }
    assert.ok(steps === 4 && blocks === 2, 'the server banks (+1 ×4) and the bulkheads (+2 ×2): ' + steps + '/' + blocks);
    /* the holding cell: two W walls + two N walls, and their 180° twins */
    assert.strictEqual(info.walls.length, 8);
    for (const w of info.walls) assert.ok(['N', 'W'].includes(w.side) && w.z0 === 1 && w.h === 2 && w.tex === 'dungeon_2', 'wall ' + JSON.stringify(w));
    /* (sandbox-realm arrays / objects: compare as strings, never by deepStrictEqual) */
    assert.strictEqual(info.mons.map(m => m.kind + '@' + m.x + ',' + m.y).sort().join('|'), 'greytube@0,2|greytube@7,5');
    assert.ok(info.nexus && info.nexus.x === 3 && info.nexus.y === 3, 'the nexus anchor at the zone\'s NW corner');
    assert.strictEqual(info.objs.length, 0, 'no trees underground');
    /* the walk rule: hazards block, shallow water wades, a wall of terrain blocks */
    const bb = D.hqSiteBoardInfo('prebuilt_backrooms');
    const wet = bb.cells.flat().filter(c => c.key === 'water');
    assert.ok(wet.length >= 2 && wet.every(c => c.walk && c.fluid && c.lvl === -1), 'the almond water is a −1 pit you can wade');
    const hell = D.hqSiteBoardInfo('prebuilt_hell');
    if (hell) { const lava = hell.cells.flat().filter(c => c.key === 'lava'); for (const c of lava) assert.ok(!c.walk && c.fluid, 'lava is never walked'); }
});

test('every built site is a launch map with a threshold and generates a box room that IS the site (no number of its own)', () => {
    const built = HQ.siteRooms && HQ.siteRooms.built;
    assert.ok(Array.isArray(built) && built.includes('prebuilt_dumb'), 'D.U.M.B. is the first walkable site (plan 7.2 order)');
    assert.ok(built.includes('prebuilt_cern') && built.includes('prebuilt_backrooms'), 'CERN and the Backrooms follow (plan 7.2 stage 2)');
    assert.ok(built.includes('prebuilt_nuketown') && built.includes('prebuilt_stadium'), 'Nuketown and the Stadium follow (plan 7.2 stage 3: the outdoor rooms)');
    const MOAT_SITES = ['prebuilt_camelot', 'prebuilt_atlantis', 'prebuilt_hell', 'prebuilt_technoticlan', 'prebuilt_agartha', 'prebuilt_antarctica'];
    for (const id of MOAT_SITES) assert.ok(built.includes(id), id + ' is a moat room (plan 7.2 stage 4)');
    assert.strictEqual(new Set(built).size, built.length, 'no site is built twice');
    const CAT = HQ.catalogue;
    /* an outdoor room dresses itself in battle terrain keys (the renderer's _hqTex falls through to the terrain sheet) */
    const TERRAIN_RULES = require('vm').runInContext('TERRAIN_RULES', D);
    const HQ_SITE_FLUIDS = require('vm').runInContext('HQ_SITE_FLUIDS', D);
    const HQ_SITE_HAZARDS = require('vm').runInContext('HQ_SITE_HAZARDS', D);
    const texOK = n => !!(HQ.textures[n] || TERRAIN_RULES[n]);
    const META = Object.fromEntries(D.EW_MAP_META.map(m => [m.id, m]));
    /* where the dry walkway starts: the board's edge, or the quay's inner edge in a moat room */
    const dryFrom = S => S.grid.cells * S.grid.cell / 2 + (S.moat ? S.moat.gap : 0);
    /* THE SETTING (plan 7.2 stage 5): the renderer's builders and the apron width each hands _nrKit */
    const trSrc = require('fs').readFileSync(require('path').join(__dirname, 'three-renderer.js'), 'utf8');
    const builderW = key => { const m = trSrc.match(new RegExp('_NR_BUILDERS\\.' + key + ' = function \\(group, ctx\\) \\{\\s*var K = _nrKit\\(group, ctx, \\{ w: ([0-9.]+)')); return m ? +m[1] : null; };
    const NEAR = HQ.siteRooms.near || {};
    assert.ok(Object.keys(NEAR).length >= 11, 'the setting table covers the built sites');
    for (const key of Object.keys(NEAR)) {
        assert.strictEqual(builderW(key), NEAR[key].w, 'siteRooms.near.' + key + '.w must equal the w its builder hands _nrKit (' + builderW(key) + ')');
        if (NEAR[key].h != null) assert.ok(NEAR[key].h >= 2.4 && NEAR[key].h <= 4, key + ': a room height in tiles');
    }
    const onCauseway = (S, x, z) => !!S.moat && S.moat.causeways.some(sd => Math.abs(sd === 'n' || sd === 's' ? x : z) < S.moat.deckW / 2 && (sd === 's' ? z > 0 : sd === 'n' ? z < 0 : sd === 'e' ? x > 0 : x < 0));
    for (const id of built) {
        const th = HQ.thresholds[id];
        assert.ok(th && th.roomNo, id + ': a built site has a threshold with a number');
        const sector = D.hqSectorOfMap(id);
        assert.ok(sector, id + ': in a bay');
        const rid = D.hqSiteRoomId(id);
        assert.strictEqual(rid, 'site_' + id);
        const room = HQ.rooms[rid];
        assert.ok(room && room.kind === 'box' && room.fx === 'site' && room.site === id && room.sector === sector, id + ': the site room');
        assert.strictEqual(D.hqSiteRoom(id).label, room.label, 'hqSiteRoom regenerates the same room');
        assert.ok(room.roomNo == null, id + ': the room carries no number of its own (7.0 rule 1)');
        assert.strictEqual(D.hqRoomNo(rid), th.roomNo, id + ': the room resolves to the site\'s number');
        assert.strictEqual(D.hqRoomNo(id), th.roomNo);
        const S = room.shell;
        const board = D.hqSiteBoard(id);
        assert.ok(S.grid && S.grid.cells === board.w && Math.abs(S.grid.cell - 128 / HQ.units) < 1e-9, id + ': one battle tile per cell, 1:1');
        assert.ok(S.w >= S.grid.cells * S.grid.cell + 4 && S.d === S.w && S.h === S.wallH && S.h > (S.open ? 2.8 : 3.5), id + ': at least 2 m of walkway round the board');
        /* the setting in the room (stage 5): the map's near builder, the room grown to its apron */
        const nearKey = META[id].near;
        if (nearKey && NEAR[nearKey] && (HQ.siteRooms.shells[id] || {}).setting !== false) {
            assert.ok(S.near && S.near.key === nearKey && S.near.w === NEAR[nearKey].w, id + ': the room carries its setting (' + nearKey + ')');
            assert.ok(Math.abs((S.w / 2 - dryFrom(S)) - S.near.w * S.grid.cell) < 0.02, id + ': the walkway is the setting\'s apron (' + (S.w / 2 - dryFrom(S)).toFixed(2) + ' m vs ' + (S.near.w * S.grid.cell).toFixed(2) + ')');
            assert.ok(Math.abs(S.near.gap * S.grid.cell - (S.moat ? S.moat.gap : 0)) < 0.01, id + ': the setting\'s gap is the moat\'s');
            assert.strictEqual(S.near.stands, !!NEAR[nearKey].stands);
            if (NEAR[nearKey].h != null) assert.ok(Math.abs(S.h - NEAR[nearKey].h * S.grid.cell) < 0.02, id + ': the room is as tall as the setting\'s');
        } else assert.ok(!S.near, id + ': no setting');
        for (const n of [S.floor, S.wall, S.dado, S.trim].concat(S.open ? [] : [S.ceiling])) assert.ok(texOK(n), id + ': texture ' + n);
        assert.ok(Array.isArray(S.lights) && S.lights.length >= 4, id + ': lit over every quarter of the board');
        if (S.open) {
            /* an OUTDOOR room (plan 7.2 stage 3): no ceiling, no conduits, the
               map's sky, ground past the walls, the lights on the walkway corners */
            assert.ok(S.ceiling == null && S.pipes === false, id + ': an outdoor room has no ceiling and nothing runs across it');
            assert.ok(S.sky && typeof S.sky === 'object' && (S.sky.night === 0 || S.sky.night === 1), id + ': the sky says day or night');
            assert.strictEqual(S.sky.scenery, (META[id].env || {}).scenery, id + ': the sky\'s far roster is the map\'s');
            assert.strictEqual(S.sky.tint, (META[id].env || {}).tint, id + ': the sky\'s tint is the map\'s');
            assert.ok(!S.sky.fog || (typeof S.sky.fog.color === 'number' && S.sky.fog.amount >= 0), id + ': the fog is the map\'s');
            assert.ok(texOK(S.apron) && texOK(S.skirt), id + ': the apron and the skirt are textures');
            for (const L of S.lights) assert.ok(Math.max(Math.abs(L.x), Math.abs(L.z)) > dryFrom(S) && Math.abs(L.x) < S.w / 2 && Math.abs(L.z) < S.d / 2, id + ': a mast stands on the walkway (the quay), not the board or the moat');
        } else {
            assert.ok(!S.sky && S.apron == null, id + ': an indoor room has no sky');
            assert.ok(!S.moat, id + ': a moat is outdoors');
            for (const L of S.lights) assert.ok(Math.abs(L.x) < S.grid.cells * S.grid.cell / 2, id + ': a fluorescent hangs over the board');
        }
        if (S.moat) {
            /* THE MOAT (plan 7.2 stage 4): the map's liquid in the ring between
               the island and the quay; the walker's rules come from the same
               tables as a board lake; the way in always has a bridge */
            const Mo = S.moat;
            assert.ok(HQ_SITE_FLUIDS.includes(Mo.key) && TERRAIN_RULES[Mo.key], id + ': the moat is a liquid the boards know (' + Mo.key + ')');
            assert.strictEqual(Mo.walk, !(TERRAIN_RULES[Mo.key].passable === false) && !HQ_SITE_HAZARDS.includes(Mo.key), id + ': waded exactly when a board lake of it is');
            assert.ok(Mo.gap >= 2 && Mo.depth >= 1 && Mo.deckW >= 2, id + ': a moat at least 2 m wide, one level deep, a deck at least 2 m wide');
            assert.ok(Math.abs(Mo.quay - (S.w / 2 - dryFrom(S))) < 0.02 && Mo.quay >= 2, id + ': the quay keeps at least 2 m of dry walkway (' + Mo.quay + ')');
            assert.ok(Mo.causeways.includes('s') && Mo.causeways.every(sd => 'nsew'.includes(sd)), id + ': the south causeway is the way in');
            for (const n of [Mo.bank, Mo.bed, Mo.deck]) assert.ok(texOK(n), id + ': moat texture ' + n);
            const tints = (D.hqSiteBoard(id).terrainTints) || {};
            const expTint = tints[Mo.key] || ((Mo.key === 'water' || Mo.key === 'deep_water') ? (tints.water || tints.deep_water) : null) || null;
            assert.strictEqual(Mo.tint, expTint, id + ': the moat wears the Δ\'s tint for its liquid');
            assert.ok(!S.moat.causeways.some(sd => sd === 's') || Math.abs(room.spawn.x) < Mo.deckW / 2 || Math.abs(room.spawn.z) > dryFrom(S), id + ': you arrive on the quay or the bridge');
        }
        /* the room's LIGHT (7.2 stage 2): the defaults under the site's overrides */
        const M = S.mood;
        assert.ok(M && typeof M === 'object', id + ': a mood');
        for (const k of ['lamp', 'glow', 'strip', 'light']) assert.ok(Number.isInteger(M[k]) && M[k] >= 0 && M[k] <= 0xffffff, id + ': mood.' + k + ' is a colour');
        for (const k of ['signN', 'signS']) assert.ok(M[k] && /^#[0-9a-f]{6}$/i.test(M[k].bg) && /^#[0-9a-f]{6}$/i.test(M[k].color), id + ': mood.' + k + ' is a sign palette');
        if (M.signLines) for (const side of Object.keys(M.signLines)) assert.ok(['n', 's'].includes(side) && Array.isArray(M.signLines[side]) && M.signLines[side].length === 3 && M.signLines[side].every(l => typeof l === 'string' && l), id + ': signLines.' + side + ' is three lines');
        /* the ceiling clears the tallest cell on the board (a +2 block is
           3.5 m; monuments are fitted by the builder, not by maxH) */
        const infoB = D.hqSiteBoardInfo(id);
        const tallest = Math.max(0, ...infoB.cells.flat().map(c => c.lvl));
        if (!S.open) assert.ok(S.h >= tallest * S.grid.cell + 0.3, id + ': the ceiling (' + S.h + ') clears the board (' + (tallest * S.grid.cell).toFixed(2) + ')');
        /* the way in must fit the wall: an outdoor room's fence still holds a 2.25 m leaf under its lintel */
        assert.ok(S.h - 0.25 >= 2.25 + 0.4, id + ': the wall (' + S.h + ') holds the leaf and its lintel');
        /* every prop is in the kit, on a wall, the ceiling or the floor inside the room */
        for (const p of room.props) {
            assert.ok(CAT[p.key], id + ': prop ' + p.key + ' is in the catalogue');
            if (p.wall) assert.ok(['n', 's', 'e', 'w'].includes(p.wall), id + ': ' + p.key + ' on a wall');
            else {
                assert.ok(Math.abs(p.x || 0) <= S.w / 2 && Math.abs(p.z || 0) <= S.d / 2, id + ': ' + p.key + ' inside the room');
                /* a moat room's floor props stand on the quay (or a causeway), never in the water */
                if (S.moat && !p.ceil) assert.ok(Math.max(Math.abs(p.x || 0), Math.abs(p.z || 0)) > dryFrom(S) || Math.max(Math.abs(p.x || 0), Math.abs(p.z || 0)) < S.grid.cells * S.grid.cell / 2 || onCauseway(S, p.x || 0, p.z || 0), id + ': ' + p.key + ' is in the moat');
            }
            if (p.ceil) assert.ok(CAT[p.key].ceil, id + ': ' + p.key + ' hangs from the ceiling');
        }
        /* the way in: the threshold leaf from the other side, on the south
           wall (P1's lane), landing at the bay's own threshold door */
        const out = room.doors.find(d => d.id === 'egress');
        assert.ok(out && out.wall === 's' && out.x === 0 && out.leaf === th.leaf, id + ': the way back wears the threshold leaf on the south wall');
        assert.strictEqual(out.wide, !!(HQ.catalogue[th.leaf] && HQ.catalogue[th.leaf].wide), id + ': wide agrees with the leaf');
        assert.strictEqual(out.action.room, D.hqBayId(sector));
        assert.strictEqual(out.action.at, 'site_' + id);
        const bay = HQ.rooms[D.hqBayId(sector)];
        const thDoor = bay.doors.find(d => d.id === 'site_' + id);
        assert.ok(thDoor && thDoor.action.mission === id && thDoor.leaf === th.leaf, id + ': the bay door it lands at is the threshold');
        assert.strictEqual(D.doorSiteState(out, null), 'open', 'the way back is never gated');
        assert.strictEqual(D.hqDoorNo(out), '', 'the way back into a bay wears no number');
        /* the way on: the CROSSING console at the tanker desk */
        const cc = room.counters.find(c => c.id === 'crossing');
        assert.ok(cc && cc.action.overlay === 'crossing' && cc.site === id && cc.radius > 0 && cc.verb === 'CROSS', id + ': the crossing console');
        assert.strictEqual(D.hqDoorNo(cc), th.roomNo, 'the console\'s plate wears the site\'s number');
        const desk = room.props.find(p => p.key === 'tanker_desk');
        const cWall = (HQ.siteRooms.shells[id] && HQ.siteRooms.shells[id].console && HQ.siteRooms.shells[id].console.wall) || 'w';
        assert.ok(cWall !== 's', id + ': the console is never on the wall with the way in');
        const ewWall = cWall === 'w' || cWall === 'e';
        assert.ok(desk && desk.wall === cWall && Math.abs((ewWall ? (desk.z || 0) : (desk.x || 0)) - (ewWall ? cc.z : cc.x)) < 2, id + ': the console stands at the tanker desk on the ' + cWall + ' wall');
        assert.ok(Math.abs(ewWall ? cc.x : cc.z) > dryFrom(S) && Math.abs(ewWall ? cc.x : cc.z) < S.w / 2, id + ': the console is on the walkway by its wall');
        assert.strictEqual(cc.face, { w: 90, n: 180, e: 270 }[cWall], id + ': the console faces into the room');
        for (const p of room.props.slice(1, 4)) assert.ok(p.y === 0.76 && Math.hypot(p.x - cc.x, p.z - cc.z) < 1.6, id + ': ' + p.key + ' is on the desk by the console');
        assert.ok(room.props.some(p => p.key === 'crt_terminal'), 'a CRT on the desk');
        /* the natives on the walkway: race hints from the mission pool, inside the room */
        const pool = D.hqMissionPool(id, 3);
        const hinted = room.npcSpots.filter(s => s.race);
        assert.strictEqual(hinted.length, Math.min(3, pool.natives || 0), id + ': one spot per native');
        for (const s of hinted) assert.ok(pool.slice(0, pool.natives).includes(s.race), s.race + ' is not a native of ' + id);
        for (const s of room.npcSpots) assert.ok(Math.abs(s.x) < S.w / 2 - 0.6 && Math.abs(s.z) < S.d / 2 - 0.6 && Math.max(Math.abs(s.x), Math.abs(s.z)) > dryFrom(S), id + ': the natives stand on the walkway (the quay), not the board or the moat');
        assert.ok(Math.abs(room.spawn.z) > dryFrom(S) && room.spawn.face === 0, id + ': you arrive on the walkway facing the board');
        assert.ok(room.agents.length >= 1 && room.lines.length >= 1, id + ': a guard and the overheard lines');
        for (const a of room.agents) assert.ok(Math.max(Math.abs(a.x), Math.abs(a.z)) > dryFrom(S), id + ': the guard stands on the walkway (the quay)');
        /* the register: the site is listed once, and knows its room */
        const rows = D.hqRoomRegister().filter(r => r.mapId === id);
        assert.strictEqual(rows.length, 1);
        assert.strictEqual(rows[0].siteRoom, rid);
    }
    /* the two stage-2 rooms, each in its own light */
    const cern = HQ.rooms[D.hqSiteRoomId('prebuilt_cern')];
    assert.ok(cern.doors[0].leaf === 'leaf_bulkhead' && cern.doors[0].wide === true, 'CERN: the blast door, wide');
    assert.ok(((cern.shell.mood.lamp & 0xff) > (cern.shell.mood.lamp >> 16)), 'CERN: blue lamps (the beam is on)');
    assert.ok(cern.props.filter(p => p.key === 'crt_terminal').length >= 3, 'CERN: the control bank');
    const br = HQ.rooms[D.hqSiteRoomId('prebuilt_backrooms')];
    assert.ok(br.doors[0].leaf === 'leaf_exit' && br.doors[0].wide === false, 'Backrooms: the way in is an EXIT door');
    assert.strictEqual(br.shell.pipes, false, 'Backrooms: nothing runs through here');
    assert.ok(br.shell.h < 4.4 && br.shell.floor === 'carpet', 'Backrooms: a lower ceiling over office carpet');
    const lies = br.props.filter(p => p.key === 'exit_sign');
    assert.ok(lies.length >= 3 && lies.every(p => p.wall && p.wall !== 's'), 'Backrooms: EXIT signs over walls with no door in them');
    assert.ok(br.shell.mood.signLines && br.shell.mood.signLines.s[1] === 'THE EXIT SIGN IS A LIE');
    const brInfo = D.hqSiteBoardInfo('prebuilt_backrooms');
    assert.ok(brInfo.mons.length === 2 && brInfo.mons.every(m => m.kind === 'monolith' && m.solid), 'Backrooms: two solid monoliths, here with you');
    assert.ok(brInfo.cells.flat().filter(c => c.key === 'water').every(c => c.tint), 'Backrooms: the almond water carries its tint for the sheet');
    assert.strictEqual(D.hqSectorOfMap('prebuilt_backrooms'), 'quarantined');
    /* the two stage-3 rooms — OUTDOORS, under the map's own sky */
    const nk = HQ.rooms[D.hqSiteRoomId('prebuilt_nuketown')];
    assert.ok(nk.shell.open === true && nk.shell.sky.night === 0 && nk.shell.sky.scenery === 'orbs', 'Nuketown: dusk, the orbs overhead');
    assert.ok(nk.shell.wall === 'wood_planks' && nk.shell.floor === 'grass_2' && nk.shell.apron === 'grass_2', 'Nuketown: a board fence round a lawn');
    assert.ok(nk.doors[0].leaf === 'leaf_motel' && nk.doors[0].wide === false, 'Nuketown: the motel door is the way in');
    assert.ok(nk.props.some(p => p.key === 'tube_tv') && !nk.props.some(p => p.key === 'wall_clock' || p.key === 'locker'), 'Nuketown: the TV on the lawn, no lockers on a fence');
    assert.ok(nk.shell.mood.signLines && nk.shell.mood.signLines.n[2] === 'POP. 0 · TEST SITE');
    assert.strictEqual(D.hqSectorOfMap('prebuilt_nuketown'), 'terrestrial');
    const st = HQ.rooms[D.hqSiteRoomId('prebuilt_stadium')];
    assert.ok(st.shell.open === true && st.shell.sky.night === 1 && st.shell.sky.scenery === 'city', 'the Stadium: night, the city overhead');
    assert.ok(st.shell.h >= 4 && st.shell.wall === 'concrete_floor', 'the Stadium: the bowl\'s concrete wall');
    assert.ok(st.doors[0].leaf === 'leaf_wired_double' && st.doors[0].wide === true, 'the Stadium: the turnstile, wide');
    assert.ok(st.props.filter(p => p.key === 'folding_chair').length >= 3 && st.props.some(p => p.key === 'water_cooler' && p.wall === 's'), 'the Stadium: the home bench and its cooler on the south wall (the stands fill the sides — stage 5)');
    assert.ok(st.shell.near && st.shell.near.stands && st.npcSpots.every(sp => Math.abs(sp.z) > Math.abs(sp.x)) && st.counters[0].z < 0, 'the Stadium: natives and the console on the n/s strips');
    assert.strictEqual(D.hqSectorOfMap('prebuilt_stadium'), 'urban');
    /* the six stage-4 rooms — the MOAT rooms: outdoors, an island in the map's liquid */
    const moatRoom = id => HQ.rooms[D.hqSiteRoomId(id)];
    for (const id of MOAT_SITES) {
        const r = moatRoom(id);
        assert.ok(r.shell.open === true && r.shell.moat && r.shell.pad == null, id + ': an outdoor room with a moat');
        assert.ok(r.shell.moat.causeways.length >= 2 && r.shell.moat.causeways.includes('n'), id + ': causeways both ways, like the near kit');
        assert.ok(!r.props.some(p => p.key === 'wall_clock' || p.key === 'locker' || p.key === 'fluorescent'), id + ': nothing hung from a ceiling that is not there');
        assert.strictEqual(r.shell.sky.scenery, META[id].env.scenery, id + ': the map\'s roster overhead');
    }
    const cam = moatRoom('prebuilt_camelot');
    assert.ok(cam.shell.moat.key === 'water' && cam.shell.moat.walk === true && cam.shell.moat.deck === 'wood_planks', 'Camelot: a water moat you can wade, the drawbridge in planks');
    assert.ok(cam.doors[0].leaf === 'leaf_portcullis' && cam.doors[0].wide === true, 'Camelot: the portcullis, wide');
    assert.ok(cam.shell.wall === 'bricks_2' && cam.shell.sky.night === 1, 'Camelot: the curtain wall, torchlight');
    assert.ok(D.hqSiteBoardInfo('prebuilt_camelot').cells.flat().every(c => !c.fluid), 'Camelot: the board is dry — the moat is the room\'s');
    const atl = moatRoom('prebuilt_atlantis');
    assert.ok(atl.shell.moat.key === 'water' && atl.shell.moat.tint === '#49c2d8' && atl.shell.moat.walk === true, 'Atlantis: the canals\' own tint on the moat');
    assert.ok(atl.doors[0].leaf === 'leaf_bulkhead' && atl.shell.sky.night === 1 && atl.shell.wall === 'marble_light', 'Atlantis: the wet bulkhead, the marble hall at night');
    assert.ok(D.hqSiteBoardInfo('prebuilt_atlantis').cells.flat().some(c => c.key === 'water' && c.lvl < 0), 'Atlantis: canals on the board to open into the moat');
    const hel = moatRoom('prebuilt_hell');
    assert.ok(hel.shell.moat.key === 'lava' && hel.shell.moat.walk === false && hel.shell.moat.deck === 'obsidian', 'Hell: a lava moat never waded, basalt causeways');
    assert.ok(hel.doors[0].leaf === 'leaf_hell_arch' && hel.shell.wall === 'obsidian' && ((hel.shell.mood.lamp >> 16) > (hel.shell.mood.lamp & 0xff)), 'Hell: the arch, obsidian, red light');
    /* THE EDGE (2026-09-11): Hell stands in the open now — the compliance extinguisher went with the wall it hung on (it is still on the shell's flavour sheet) */
    assert.ok(HQ.siteRooms.flavour.prebuilt_hell.props.some(p => p.key === 'fire_extinguisher' && p.wall === 'e') && !hel.props.some(p => p.key === 'fire_extinguisher'), 'Hell: the extinguisher was inspected monthly; the wall it hung on is gone');
    const tec = moatRoom('prebuilt_technoticlan');
    assert.ok(tec.shell.moat.key === 'water' && tec.shell.moat.tint === '#3fe0d8' && tec.shell.wall === 'bricks_3', 'Technoticlan: the canal cyan, the glyph wall');
    assert.ok(tec.doors[0].leaf === 'leaf_portcullis' && tec.props.some(p => p.key === 'crt_terminal' && p.z < -5), 'Technoticlan: the temple gate, the calendar terminal in the corner');
    const aga = moatRoom('prebuilt_agartha');
    assert.ok(aga.shell.moat.key === 'water' && aga.shell.moat.tint === '#4ae0c8' && aga.shell.sky.night === 0, 'Agartha: the inner sea, day by the inner sun');
    assert.ok(aga.doors[0].leaf === 'leaf_vault' && aga.props.filter(p => /plant/.test(p.key)).length >= 3, 'Agartha: the inner gate; things grow');
    const ant = moatRoom('prebuilt_antarctica');
    assert.ok(ant.shell.moat.key === 'deep_water' && ant.shell.moat.walk === false && ant.shell.moat.tint === '#3a78b8', 'Antarctica: deep water, never entered, the board\'s water tint');
    assert.ok(ant.doors[0].leaf === 'leaf_bulkhead' && ant.shell.wall === 'ice_1' && ant.shell.moat.deck === 'igloo' && ant.shell.sky.night === 0, 'Antarctica: the ice-wall hatch, an ice bridge, polar day');
    assert.ok(ant.props.some(p => p.key === 'cot'), 'Antarctica: the overwinter cot');
    /* THE REST OF THE REGISTER (plan 7.2 stage 6, 2026-09-08 rev 4): every
       launch map with a threshold is a room now — the register has no
       site without one; the eighteen new rooms are all outdoors, none of
       them a moat room (no board in the batch holds lava, void or a lake
       worth opening), each under its own map's sky */
    const siteIds = Object.keys(HQ.thresholds);
    for (const id of siteIds) assert.ok(built.includes(id), id + ': every site in the register is walkable (stage 6)');
    assert.strictEqual(siteIds.length, built.length, 'the built list is exactly the register');
    assert.ok(D.hqRoomRegister().filter(r => r.mapId && r.sector).every(r => r.siteRoom), 'the register knows every site\'s room (the facility boards are not sites)');
    const STAGE6 = ['prebuilt_shasta', 'prebuilt_stonehenge', 'prebuilt_giza', 'prebuilt_heaven', 'prebuilt_cyberpunk', 'prebuilt_babel', 'prebuilt_olympus', 'prebuilt_mars', 'prebuilt_area51',
        'prebuilt_skinwalker', 'prebuilt_hollow_earth', 'prebuilt_fairy_forest', 'prebuilt_moon', 'prebuilt_vatican', 'prebuilt_bohemian_grove', 'prebuilt_gobekli', 'prebuilt_northpole', 'prebuilt_flatlands'];
    for (const id of STAGE6) {
        const r = HQ.rooms[D.hqSiteRoomId(id)];
        assert.ok(r.shell.open === true && !r.shell.moat, id + ': an outdoor room without a moat');
        assert.ok(r.shell.mood.signLines && r.shell.mood.signLines.n[1] === 'ROOM ' + HQ.thresholds[id].roomNo, id + ': the north sign wears the room number');
        assert.ok(r.shell.mood.signLines.s[2] === 'THE CROSSING IS AT THE CONSOLE', id + ': the south sign points at the console');
        assert.ok((HQ.siteRooms.flavour[id] || {}).fitted === true, id + ': the flavour props are placed for this room');
    }
    /* the settings that fill a wall move the console off it */
    assert.strictEqual(HQ.siteRooms.shells.prebuilt_area51.console.wall, 'n', 'Area 51: the hangar has the west wall');
    assert.strictEqual(HQ.siteRooms.shells.prebuilt_fairy_forest.console.wall, 'e', 'Fairy Forest: the spring has the west wall');
    assert.strictEqual(HQ.siteRooms.shells.prebuilt_northpole.console.wall, 'n', 'North Pole: the workshop has the west wall');
    const bab = HQ.rooms[D.hqSiteRoomId('prebuilt_babel')];
    assert.ok(bab.shell.near.stands && bab.counters[0].z < 0 && bab.npcSpots.every(sp => Math.abs(sp.z) > Math.abs(sp.x)), 'Babel: the terraces fill the flanks — natives and the console on the n/s strips');
    /* Flat Lands opts out of its setting: the plane's apron is fourteen tiles, the room keeps a plain walkway */
    const flat = HQ.rooms[D.hqSiteRoomId('prebuilt_flatlands')];
    assert.ok(HQ.siteRooms.shells.prebuilt_flatlands.setting === false && !flat.shell.near && !HQ.siteRooms.near.flatlands && flat.shell.w < 30, 'Flat Lands: no setting, a room you can cross');
    /* the Moon's berm: the lowest wall in the register still holds the leaf */
    const moon = HQ.rooms[D.hqSiteRoomId('prebuilt_moon')];
    assert.ok(moon.shell.h === 3.0 && moon.doors[0].leaf === 'leaf_frame_only' && moon.shell.sky.night === 1, 'the Moon: a low regolith berm, the frame, night');
    /* day and night follow the map's sky */
    for (const [id, night] of [['prebuilt_heaven', 0], ['prebuilt_giza', 0], ['prebuilt_vatican', 0], ['prebuilt_cyberpunk', 1], ['prebuilt_area51', 1], ['prebuilt_stonehenge', 1], ['prebuilt_northpole', 1]])
        assert.strictEqual(HQ.rooms[D.hqSiteRoomId(id)].shell.sky.night, night, id + ': day/night');
});

/* THE EDGE (2026-09-11): the doorway is a doorway to the ACTUAL place — an
   outdoor site stands in the open unless the place itself is walled */
test('the edge: outdoor site rooms stand without facility walls unless the place is walled; the props that need a wall go with it', () => {
    const CAT = HQ.catalogue;
    const built = HQ.siteRooms.built;
    const WALLED_OUTDOORS = ['prebuilt_stadium', 'prebuilt_camelot', 'prebuilt_cyberpunk', 'prebuilt_babel', 'prebuilt_agartha', 'prebuilt_hollow_earth'];
    const LOW = ['prebuilt_stonehenge', 'prebuilt_gobekli', 'prebuilt_flatlands'];
    for (const id of built) {
        const room = HQ.rooms[D.hqSiteRoomId(id)], S = room.shell, sh = HQ.siteRooms.shells[id] || {};
        assert.ok(['walls', 'open', 'low'].includes(S.edge), id + ': edge is walls | open | low');
        if (!S.open) assert.strictEqual(S.edge, 'walls', id + ': an indoor room is always the full box');
        else if (WALLED_OUTDOORS.includes(id)) assert.ok(S.edge === 'walls' && sh.edge === 'walls', id + ': the place is walled (a building, a cavern) — its shell says so');
        else if (LOW.includes(id)) assert.ok(S.edge === 'low' && sh.edge === 'low', id + ': a knee-high field wall');
        else assert.strictEqual(S.edge, 'open', id + ': an outdoor place stands in the open (the default)');
        /* roaming: only past an open edge, and never through a wall or a field wall */
        assert.strictEqual(S.roam, S.edge === 'open' ? 5 : 0, id + ': roam ' + S.roam);
        if (S.edge === 'walls') continue;
        /* nothing hangs on a wall that is not there; what stands, stands */
        for (const p of room.props) {
            if (typeof p.wall !== 'string') continue;
            const c = CAT[p.key];
            assert.ok(c && c.foot > 0 && !(c.mount > 0) && !(p.mount > 0), id + ': ' + p.key + ' hangs on a wall the room does not have');
            assert.ok(D.hqSitePropStands(p), id + ': ' + p.key + ' stands');
        }
        assert.ok(!room.props.some(p => p.key === 'clipboard' || p.key === 'fire_extinguisher' || p.key === 'breaker_panel'), id + ': the wall fixtures went with the wall');
        assert.ok(room.props[0].key === 'tanker_desk' && room.props.some(p => p.key === 'crt_terminal') && room.props.some(p => p.key === 'wet_floor_sign'), id + ': the console desk and the sill sign stay');
        /* the way in is still a door on the south line — the lone panel of the crossing */
        assert.ok(room.doors[0].wall === 's' && room.doors[0].x === 0, id + ': the lone door stands where the wall was');
    }
    assert.strictEqual(D.hqSitePropStands({ key: 'locker', wall: 'n', x: 1 }), true);
    assert.strictEqual(D.hqSitePropStands({ key: 'clipboard', wall: 'w', z: 1 }), false);
    assert.strictEqual(D.hqSitePropStands({ key: 'metal_shelving', wall: 'e', z: 1, mount: 1.2 }), false, 'a mounted placement of a standing piece still needs the wall');
    assert.strictEqual(D.hqSitePropStands({ key: 'wet_floor_sign', x: 1, z: 1 }), true, 'a floor prop never needed one');
    /* the Moon: the door stands without a wall again (the threshold's own note) */
    const moon = HQ.rooms[D.hqSiteRoomId('prebuilt_moon')];
    assert.ok(moon.shell.edge === 'open' && /without a wall/.test(moon.agents[0].line) && !/until Records built one/.test(moon.agents[0].line), 'the Moon: no wall, and the guard says so');
    /* the site's own rover / lander come from the SETTING now (the user's real models) — not doubled as room props */
    assert.ok(!HQ.rooms[D.hqSiteRoomId('prebuilt_mars')].props.some(p => p.key === 'mars_rover'), 'Mars: one rover, the setting\'s');
    assert.ok(!moon.props.some(p => p.key === 'lunar_lander'), 'the Moon: one lander, the setting\'s');
    for (const k of ['mars_rover', 'lunar_lander', 'palm_tree']) assert.ok(CAT[k] && CAT[k].file && CAT[k].foot > 0, k + ': in the kit with a footprint');
    /* the renderer: the shell reads the edge, the walker roams past an open one, the setting keeps its own perimeter, the kit stands on the boards */
    const tr = require('fs').readFileSync(require('path').join(__dirname, 'three-renderer.js'), 'utf8');
    assert.match(tr, /var edge = \(S\.edge === 'open' \|\| S\.edge === 'low'\) \? S\.edge : 'walls';/, 'the box shell reads shell.edge');
    assert.match(tr, /if \(edge === 'walls'\) \{\s*G\.add\(slab\(0, H, -0\.02, 0\.04/, 'full walls only on a walled room');
    assert.match(tr, /var HQ_EDGE_KERB_H = 0\.05;/, 'an open edge is a flush paving line');
    assert.match(tr, /var HQ_EDGE_LOW_H = 0\.95;/, 'a low edge is knee-high');
    assert.match(tr, /rect: \{ hw: ax \? L \/ 2 : 0\.25, hd: ax \? 0\.25 : L \/ 2 \}, site: true \}\);/, 'the field wall is a wall to the walker');
    assert.match(tr, /function _hqRoamM\(S\) \{ return \(S && S\.edge === 'open' && S\.roam > 0\) \? S\.roam : 0; \}/, 'roam reads shell.roam on an open edge only');
    for (const fn of ['_hqSurface', '_hqAirOK', '_hqCamBlocked']) {
        const body = tr.slice(tr.indexOf('function ' + fn + '('), tr.indexOf('function ' + fn + '(') + 1400);
        assert.match(body, /_hqRoamM\(S\)/, fn + ' honours the roam');
    }
    assert.match(tr, /var walled = !\(S\.edge === 'open' \|\| S\.edge === 'low'\);/, 'the setting cull knows the edge');
    assert.match(tr, /var hugX = walled && /, 'a wall-less room keeps the setting\'s perimeter (the natural walls)');
    assert.match(tr, /if \(u\.o\._ew_footM > 0\) \{/, 'a kit GLB still loading gets its collision disc');
    assert.match(tr, /var noWall = \(S\.edge === 'open' \|\| S\.edge === 'low'\);/, 'the signs know the edge');
    assert.match(tr, /if \(noWall\) \{ signboard\(5\.0, -signIn, 0, 4\.8, 1\.7\); signboard\(-5\.0, signIn, Math\.PI, 4\.8, 1\.7\); \}/, 'freestanding signboards where the walls were');
    assert.match(tr, /function _hzDoorKitGLB\(key, o\)/, 'the D.O.O.R. kit on the board');
    assert.match(tr, /_hzDoorKitGLB\('mars_rover', \{ metres: 2\.6, foot: 1\.1, rng: rng, fallback: _hzRover \}\)/, 'Mars: the real rover, the buggy as fallback');
    assert.match(tr, /_hzDoorKitGLB\('lunar_lander', \{ metres: 3\.2, foot: 1\.5, rng: rng, fallback: landerProc \}\)/, 'the Moon: the real lander, the foil box as fallback');
    assert.match(tr, /_hzDoorKitGLB\('palm_tree', \{ metres: 3\.2 \+ \(i % 2\) \* 0\.5, foot: 0\.35, rng: rng \}\)/, 'Atlantis: the palms');
    const atl = tr.slice(tr.indexOf('_NR_BUILDERS.atlantis = function'), tr.indexOf('_NR_BUILDERS.babel = function'));
    assert.strictEqual((atl.match(/_hzDoorKitGLB\('palm_tree'/g) || []).length, 1, 'one palm call, four corners');
    assert.match(atl, /\.forEach\(function \(p, i\) \{\s*_nrProp\(K, function \(rng\) \{ return _hzDoorKitGLB\('palm_tree'/, 'the palms stand through _nrProp');
});

test('source scan: the renderer builds the site board and walks it; map.js walks a threshold in and crosses from the console', () => {
    const fs = require('fs');
    const tr = fs.readFileSync(require('path').join(__dirname, 'three-renderer.js'), 'utf8');
    assert.match(tr, /function _hqBuildSiteBoard\(room\)/);
    assert.match(tr, /if \(room\.fx === 'site'\) \{ try \{ _hqBuildSiteBoard\(room\); \}/);
    assert.match(tr, /function _hqSiteCellAt\(x, z\)/);
    assert.match(tr, /top - curY <= \(b\.step \|\| HQ_STEP_TOL\)/, 'a site step climbs one level');
    assert.match(tr, /hqSiteBoardInfo\(room\.site\)/);
    assert.match(tr, /'hq-native-' \+ si/, 'the natives spawn from the race hint');
    assert.match(tr, /var mood = S\.mood \|\| \{\};/, 'the site board reads the room\'s mood');
    assert.match(tr, /var SL = mood\.signLines \|\| \{\};/, 'signLines replace a sign\'s text');
    assert.match(tr, /_hzGlowMat\(lampC, 0\.95\)/, 'the containment lamps take the mood\'s colour');
    assert.match(tr, /_hzGlowMat\(stripC, 0\.75\)/, 'the wall strips take the mood\'s colour');
    assert.match(tr, /var signY = S\.h - 0\.9, lampY = S\.h - 1\.0;/, 'signs and lamps hang from the ceiling height');
    assert.match(tr, /\(pc\.key === 'water' \|\| pc\.key === 'deep_water'\) && pc\.tint\) fluidColor = new THREE\.Color\(pc\.tint\)/, 'water wears the Δ tint');
    assert.match(tr, /new THREE\.PointLight\(plC,/, 'the fluorescents\' point lights take the mood');
    /* stage 3: the outdoor room */
    /* (room, Hx) since 2026-09-08: the main menu's lone-door scene builds the same sky into its own record */
    assert.match(tr, /function _hqBuildSky\(room, Hx\)/, 'the sky over an outdoor room');
    assert.match(tr, /function _hqTickSky\(now, Hx\)/, 'the sky ticks under the HQ loop');
    assert.match(tr, /menu: _menuApi,/, 'the main menu scene rides the public API (ThreeRenderer.menu)');
    assert.match(tr, /_hqBuildSky\(M\.room, M\)/, 'the menu scene borrows the outdoor-room sky');
    assert.match(tr, /rec = _introBuildDoor\(zi, ts, leaf, B\.mapId\)/, 'the menu door is the crossing\'s own threshold');
    assert.match(tr, /if \(S\.open\) \{ try \{ _hqBuildSky\(room\); \}/, '_hqEnter builds the sky for an open room');
    assert.match(tr, /if \(H\.sky\) _hqTickSky\(now\);/, '_hqTickWorld drives it');
    assert.match(tr, /function _hzCosmicRoster\(\)/, 'the default roster is shared with the battle');
    assert.match(tr, /var ROSTER = themeRoster \|\| _hzCosmicRoster\(\);/, 'the battle draws from the same roster');
    assert.match(tr, /TERRAIN_SPRITES\[name\]\) \? TERRAIN_SPRITES\[name\]\[0\] : null\)/, '_hqTex falls through to the terrain sheet');
    assert.match(tr, /if \(!S\.open && py > S\.h - 0\.3\) return true;/, 'the camera boom has no ceiling outdoors');
    assert.match(tr, /_horizonFogDirty = true;   \/\/ an outdoor room drove the shared sky uniforms/, 'leaving re-arms the battle\'s fog');
    assert.match(tr, /\(S\.open \? \[\] : \[\['n', -8\.6\]/, 'no containment lamps outdoors');
    /* stage 4: the moat room */
    assert.match(tr, /function _hqSiteOnCauseway\(x, z\)/, 'a causeway is the quay\'s floor');
    assert.match(tr, /var M = st\.moat; if \(!M\) return null;/, '_hqSiteCellAt hands the walker the moat cell');
    assert.match(tr, /_hq\.site\.moat = \{ gap: gap, deckW: deckW, causeways: cw, cell: \{ top: -mDepth, walk: !!M\.walk, fluid: true, key: M\.key, moat: true \} \};/, 'the moat cell: one level down, walk from the data');
    assert.match(tr, /\(_hqSiteCellAt\(x, z\) \|\| curY < -0\.5\)/, 'climbing out of the moat onto the quay is one level');
    assert.match(tr, /try \{ fluidMat = _buildFluidTopMat\(M\.key\); \}/, 'the moat is the battle\'s own fluid sheet');
    assert.match(tr, /if \(moatMerged\[px \+ ',' \+ py\]\) continue;   \/\/ opens into the moat/, 'a board-edge lake of the same liquid opens into the moat');
    assert.match(tr, /function _hqTickMoat\(dt\)/, 'the moat\'s water animates under the HQ loop');
    assert.match(tr, /if \(H\.moatTick\) _hqTickMoat\(dt\);/, '_hqTickWorld drives it');
    assert.match(tr, /var siteHole = \(room\.fx === 'site' && S\.grid\) \? \(S\.grid\.cells \* S\.grid\.cell \/ 2 \+ \(S\.moat \? S\.moat\.gap : 0\)\) : 0;/, 'a site room\'s floor is a frame round the board / the moat, so pits show');
    const mp = fs.readFileSync(require('path').join(__dirname, 'map.js'), 'utf8');
    /* stage 5: the setting in the room */
    assert.match(tr, /function _hqBuildSetting\(room\)/, 'the map\'s near builder runs in the room');
    assert.match(tr, /if \(room\.fx === 'site' && S\.near\) \{ try \{ _hqBuildSetting\(room\); \}/, '_hqEnter builds it after the board');
    assert.match(tr, /var HQ = ctx\.hq \|\| null;/, '_nrKit takes the room\'s w / gap / base / tints');
    assert.match(tr, /if \(!HQ\) _nrLastKit = \{/, 'the crossing\'s kit facts are the battle\'s only');
    for (const fn of ['_nrApron', '_nrMoat', '_nrRoom', '_nrSign']) assert.ok(new RegExp('function ' + fn + '\\([^)]*\\) \\{\\s*(o = o \\|\\| \\{\\};\\s*)?if \\(K\\.hq\\) return').test(tr), fn + ' is a no-op in the room (the shell stands for it)');
    assert.match(tr, /function _hqSettingFreeSpot\(x, z\)/, 'natives and props stand clear of the setting');
    assert.match(tr, /var nsp = _hqSettingFreeSpot\(spot\.x, spot\.z\);/, 'the natives are nudged');
    assert.match(tr, /var fsp = _hqSettingFreeSpot\(p\.x \|\| 0, p\.z \|\| 0\);/, 'the floor props are nudged');
    assert.match(tr, /if \(H\.setting\) _nrPollPending\(\);/, 'the setting\'s trees land under the HQ loop');
    assert.match(tr, /site: true, setting: true \}\);/, 'every piece is a blocker');
    assert.match(tr, /window\.EW_HQ_NO_SETTING/, 'the kill-switch');
    assert.match(mp, /if \(sr && _hqRoomExists\(sr\)\) return \{ room: sr, at: 'egress' \};/, 'a threshold with a room walks you in');
    assert.match(mp, /if \(act\.overlay === 'crossing'\) return _hqCrossingHtml\(t\);/);
    assert.match(mp, /doorId: door \? door\.id : \(console_ \? \(console_\.counter\.id \|\| 'crossing'\) : null\)/, 'post-match returns to the console');
    assert.match(mp, /data-goto="crossing">WALK TO THE CONSOLE/);
    assert.match(mp, /r\.siteRoom && _hqRoomExists\(r\.siteRoom\)/, 'the directory GOes into a walkable site');
});

/* ── 2026-09-08: THE TERMINAL — the match-select screen is a console's CRT ── */
test('the terminal: consoles light their own screen, the pointer comes back (source scan)', () => {
    const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
    const mp = read('map.js'), tr = read('three-renderer.js'), ms = read('match-select.js'), css = read('styles-base.css'), html = read('index.html');
    /* the host in the building */
    assert.ok(html.includes('id="hqTerminal"'), 'index.html: #hqTerminal inside #hqPage');
    assert.ok(html.indexOf('id="hqTerminal"') > html.indexOf('id="hqPanel"') && html.indexOf('id="hqTerminal"') < html.indexOf('id="hqLoad"'), 'the host sits between the panel and the load card');
    assert.match(css, /\.hq-terminal \{[^}]*z-index: 35/, 'the host stacks over the panel (30) and under the load card (40)');
    for (const c of ['.ms-crt-bezel', '.ms-crt-glass', '.ms-crt-screen', '.ms-crt-scan', '.ms-tty-body', '.ms-tty-site', '.ms-tty-full', '.ms-tty-filebox']) assert.ok(css.includes(c + ' {'), 'styles-base.css: ' + c);
    assert.match(css, /@keyframes msCrtOn/, 'the power-on raster');
    /* the flow layer */
    assert.match(mp, /function _hqOpenTerminal\(spec\)/, 'map.js opens the screen');
    assert.match(mp, /window\._hqTerminalClose = function \(o\)/, 'and closes it');
    assert.match(mp, /if \(_hqTerm\) window\._hqTerminalClose\(\{ launch: true \}\);/, 'FILE takes the building down first (_msConfirm)');
    assert.match(mp, /if \(_hqTerm\) \{ window\._hqTerminalClose\(\); return; \}/, 'STEP AWAY resumes the walk (_msBack)');
    assert.match(mp, /onEscape: \(\) => \{ if \(_hqTerm\) \{ window\._hqTerminalClose\(\); return; \}/, 'ESC closes the screen before anything else');
    assert.match(mp, /o\.terminal !== false && _hqOpenTerminal\(\{ variant: o\.variant \|\| 'site', counterId: o\.counterId \|\| null, pre \}\)/, '_hqLaunchMission files on the screen, the page is the fallback');
    assert.match(mp, /t\.counter\.action\.overlay === 'crossing' \|\| t\.counter\.action\.overlay === 'training'/, 'E at a console lights the screen');
    assert.match(mp, /variant: 'site' \}\);/, 'the CROSSING console is the SITE variant');
    assert.match(mp, /launchId: 'prebuilt_training', gm: 'arena', teamSize: 4/, 'the RANGE console presets ORIENTATION');
    assert.match(mp, /launchId: 'prebuilt_holosim', gm: 'arena', teamSize: 4/, 'and PRACTICE');
    assert.match(mp, /data-terminal="full"/, 'DISPATCH offers the desk\'s screen');
    assert.match(mp, /window\._hqClosePanel\(\{ keepPaused: true \}\)/, 'a panel on the way to a launch closes without the re-grab');
    assert.match(mp, /_hqTermDrop\(\);   \/\/ a console screen left up goes down with the building/, '_hqLeave drops a screen left up');
    /* the renderer */
    assert.match(tr, /focusScreen: _hqFocusScreen,/, 'hq.focusScreen: the camera pushes onto the CRT');
    assert.match(tr, /unfocus: _hqUnfocus,/, 'hq.unfocus: and back');
    assert.match(tr, /_hq\.props\.push\(\{ key: p\.key, grp: grp \}\);/, 'placed props are on record (the CRT is found by key)');
    assert.match(tr, /function _hqOnLockChange\(\)/, 'a late pointer lock is released');
    assert.match(tr, /document\.addEventListener\('pointerlockchange', _hqOnLockChange\);/, 'and the listener is installed');
    assert.match(tr, /if \(_hq && _hq\.paused\) \{ document\.exitPointerLock\(\); return; \}/, 'a lock landing on a paused walk is refused');
    assert.match(tr, /if \(!_hqKeepLock\) \{\s*_hqLockStaleAt = performance\.now\(\);/, 'leaving marks the stale window');
    assert.match(tr, /e\.group\.visible = !H\.fp && !\(H\.focus && H\.focus\.k > 0\.3\);/, 'the avatar hides under the push');
    /* the screen */
    assert.match(ms, /window\._mountReactMatchSelect = function\(opts\)/, 'match-select mounts per host');
    assert.match(ms, /const isSite = variant === 'site';/, 'the SITE variant');
    assert.match(ms, /className: 'ms-tty-body ms-tty-site'/, 'renders the two-column form');
    assert.match(ms, /className: 'ms-tty-body ms-tty-full'/, 'the FULL variant the three-column desk');
    assert.match(ms, /className: 'ms-crt ms-crt-' \+ frame \+ ' ms-crt-' \+ variant/, 'inside the monitor');
    assert.match(ms, /if \(variant === 'site' && deltaIdx < 0 && fullIdx < 0\) variant = 'full';/, 'a site without a launch entry falls back to the desk');
    assert.match(ms, /function pickBoard\(b\)/, 'Δ board ↔ the full site');
});


/* ── ROOM 86 · THE CAFETERIUM (HQ plan 7.4, 2026-09-11) and the first ROOM
   VARIANT (plan 5.1): after hours the same room is the MÖBIUS STRIP CLUB ── */
const CAFE = HQ.rooms.cafeteria;
const boxPropProblems = (k, room) => {
    const S = room.shell, out = [];
    for (const p of room.props) {
        const c = HQ.catalogue[p.key];
        if (!c) { out.push(k + ': ' + p.key + ' not in catalogue'); continue; }
        if (typeof p.wall === 'string') { const a = alongOf(S, p.wall, p); if (Math.abs(a.v) > a.half - 0.15) out.push(k + ': wall prop ' + p.key + ' runs off wall ' + p.wall); }
        else if (Math.abs(p.x) > S.w / 2 - 0.1 || Math.abs(p.z) > S.d / 2 - 0.1) out.push(k + ': ' + p.key + ' @' + p.x + ',' + p.z + ' is in a wall');
        const mount = (p.mount != null) ? p.mount : (c.mount || 0);
        if (mount + (c.h || 0) > S.h - 0.05) out.push(k + ': ' + p.key + ' mounts through the ceiling');
        if ((p.y || 0) > S.h - 0.1) out.push(k + ': ' + p.key + ' sits above the ceiling');
    }
    for (const sp of (room.npcSpots || []).concat(room.onlineSpots || [], room.agents || [])) if (!(Math.abs(sp.x) < S.w / 2 - 0.4 && Math.abs(sp.z) < S.d / 2 - 0.4)) out.push(k + ': a person stands in a wall @' + sp.x + ',' + sp.z);
    return out;
};

test('Room 86 is a box room off the ground ring at 75°: the way in, the way out, the number, the kit that moved in from the hall', () => {
    assert.ok(CAFE && CAFE.kind === 'box' && CAFE.roomNo === '86', 'rooms.cafeteria kind box, Room 86');
    assert.strictEqual(D.hqRoomNo('cafeteria'), '86');
    assert.ok(!CAFE.shell.open && CAFE.shell.pipes === false && CAFE.shell.h >= 3.4, 'an indoor room under an acoustic ceiling, no conduits');
    const eg = ROOM.doors.find(d => d.id === 'cafeteria');
    assert.ok(eg && eg.deg === 75 && (eg.level || 0) === 0 && eg.action.room === 'cafeteria' && eg.action.at === 'egress', 'the egress door at 75° walks into the room at its way out');
    assert.strictEqual(D.hqDoorNo(eg), '86', 'the plate over the hall door reads 86');
    const out = CAFE.doors.find(d => d.id === 'egress');
    assert.ok(out && out.wall === 'w' && out.action.room === 'central_egress' && out.action.at === 'cafeteria' && out.leaf === eg.leaf, 'the way out is the same saloon door and lands at the hall door');
    assert.strictEqual(D.doorSiteState(eg, null), 'open');
    /* between the east stair's top and the Quartermaster, clear of both */
    const qm = ROOM.doors.find(d => d.id === 'quartermaster');
    const pier = (qm.deg - eg.deg) * Math.PI / 180 * ROOM.shell.radius - (3.3 + 2.5) / 2;
    assert.ok(pier > 2.0, 'a pier of ' + pier.toFixed(2) + ' m to the vault door');
    assert.ok(eg.deg > ROOM.stairs.find(s => s.id === 'stair_e').to + 7, 'clear of the east stair');
    assert.ok(!ROOM.props.some(p => (p.level || 0) === 0 && p.wall && Math.abs(p.deg - eg.deg) < 5), 'no wall prop stands in the new doorway');
    assert.ok(!ROOM.props.some(p => (p.level || 0) === 0 && p.r > 18.5 && Math.abs(p.deg - eg.deg) < 5), 'nothing stands in front of it');
    /* the break nook left the hall (the vending machine has always been there) */
    for (const key of ['round_fridge', 'microwave', 'coffee_maker', 'hook_rail_long']) {
        assert.ok(!ROOM.props.some(p => p.key === key && (p.level || 0) === 0 && p.deg >= 95 && p.deg <= 110), 'the hall keeps no ' + key + ' at the old nook');
    }
    assert.ok(ROOM.props.some(p => p.key === 'vending_machine' && (p.level || 0) === 0), 'the hall keeps its vending machine');
    /* 7.11's build sheet, every row */
    const has = key => CAFE.props.filter(p => p.key === key).length;
    for (const key of ['tanker_desk', 'reception_wedge', 'cash_register', 'meal_tray', 'meal_tray_empty', 'observation_window', 'microwave', 'coffee_maker',
                       'round_fridge', 'mini_fridge', 'hook_rail_long', 'conference_table', 'cafeteria_chair', 'molded_chair', 'coffee_mug', 'solo_cup', 'trash_bin',
                       'rug_office', 'potted_plant', 'palm_tree', 'picture_round_a', 'notice_board', 'wall_clock', 'exit_sign', 'vent_grille', 'vending_machine', 'fluorescent']) {
        assert.ok(has(key) >= 1, 'Room 86 has its ' + key);
    }
    assert.strictEqual(has('conference_table'), 2, 'two long tables');
    assert.strictEqual(has('wall_clock'), 2, 'two clocks that disagree');
    assert.ok(has('cafeteria_chair') + has('molded_chair') >= 10, 'chairs round both tables');
    assert.deepStrictEqual(boxPropProblems('cafeteria', CAFE), []);
    /* the counters: the notice board → the leaderboard, the till → the Quartermaster */
    const notice = CAFE.counters.find(c => c.id === 'notice'), till = CAFE.counters.find(c => c.id === 'till');
    assert.ok(notice && notice.action.fn === '_mountLeaderboard' && notice.verb && notice.radius > 0, 'the notice board reads the leaderboard');
    assert.ok(till && till.action.fn === '_goToShop' && till.verb && till.radius > 0, 'the till is the shop');
    assert.ok(CAFE.props.some(p => p.key === 'notice_board' && p.wall === 's' && Math.abs(p.x - notice.x) < 0.5), 'the board hangs where its counter stands');
    assert.ok(CAFE.props.some(p => p.key === 'cash_register' && Math.hypot(p.x - till.x, p.z - till.z) < till.radius), 'the register is within reach of the till');
    /* the people: the roster on break, the operatives on shift, one cashier */
    assert.ok(CAFE.npcSpots.length >= 3 && CAFE.onlineSpots.length >= 2 && CAFE.agents.length >= 1, 'spots for the roster, the online shift and the cashier');
    assert.ok(CAFE.lines.length >= 3, 'overheard lines');
    /* the two procedural pieces */
    const nb = HQ.catalogue.notice_board, mb = HQ.catalogue.mobius_bar;
    assert.ok(nb && nb.proc === 'notice_board' && nb.wall && nb.depth > 0 && nb.mount > 0, 'the notice board is a wall proc with a depth');
    assert.ok(mb && mb.proc === 'mobius_bar' && mb.foot >= 1.2 && mb.block, 'the bar is a floor proc the walker cannot enter');
    /* the register lists it once, as a room */
    const rows = D.hqRoomRegister().filter(r => r.no === '86');
    assert.strictEqual(rows.length, 1); assert.strictEqual(rows[0].kind, 'room'); assert.strictEqual(rows[0].id, 'cafeteria');
});

test('room variants (plan 5.1): after hours Room 86 is the MÖBIUS STRIP CLUB — same room, same number, re-plated door, restored on the way back', () => {
    /* (JSON: the sandbox's arrays are another realm's) */
    assert.strictEqual(JSON.stringify(D.hqRoomVariantIds('cafeteria')), '["after_hours"]');
    assert.strictEqual(JSON.stringify(D.hqRoomVariantIds('office')), '[]');
    assert.strictEqual(D.hqRoomBase('cafeteria'), CAFE, 'the sheet is the base');
    const V = CAFE.variants.after_hours;
    assert.ok(V.when && Array.isArray(V.when.hours) && V.when.p > 0 && V.when.p < 1, 'after hours by the clock, else a roll');
    /* the roll: forced, by the clock, by the seed */
    const prof = seed => ({ door: { hq: { variantSeed: seed, visits: 3 } } });
    assert.strictEqual(D.hqVariantRoll('cafeteria', prof(1), { force: 'after_hours' }), 'after_hours');
    assert.strictEqual(D.hqVariantRoll('cafeteria', prof(1), { force: '' }), null);
    assert.strictEqual(D.hqVariantRoll('cafeteria', prof(1), { force: 'nope' }), null);
    assert.strictEqual(D.hqVariantRoll('office', prof(1), {}), null, 'a room without variants never rolls one');
    const night = new Date(2026, 8, 11, 23, 30), noon = new Date(2026, 8, 11, 12, 0), small = new Date(2026, 8, 12, 3, 0);
    for (let sd = 0; sd < 20; sd++) { assert.strictEqual(D.hqVariantRoll('cafeteria', prof(sd), { now: night }), 'after_hours'); assert.strictEqual(D.hqVariantRoll('cafeteria', prof(sd), { now: small }), 'after_hours'); }
    let hits = 0;
    for (let sd = 0; sd < 400; sd++) if (D.hqVariantRoll('cafeteria', prof(sd), { now: noon }) === 'after_hours') hits++;
    assert.ok(hits > 30 && hits < 200, 'one visit in five, roughly (' + hits + '/400 at noon)');
    assert.strictEqual(D.hqVariantRoll('cafeteria', prof(7), { now: noon }), D.hqVariantRoll('cafeteria', prof(7), { now: noon }), 'the same visit is the same room');
    assert.strictEqual(D.hqVariantRoll('cafeteria', null, { now: noon }), D.hqVariantRoll('cafeteria', undefined, { now: noon }), 'no profile is a seed of 0');
    /* apply: the room, the door, the register — then restore */
    const eg = ROOM.doors.find(d => d.id === 'cafeteria');
    const baseLabel = eg.label, baseSub = eg.sub, baseDesc = eg.desc;
    try {
        const r = D.hqApplyRoomVariant('cafeteria', 'after_hours');
        assert.strictEqual(HQ.rooms.cafeteria, r);
        assert.notStrictEqual(r, CAFE);
        assert.strictEqual(r.variant, 'after_hours');
        assert.strictEqual(r.label, 'MÖBIUS STRIP CLUB');
        assert.strictEqual(r.roomNo, '86'); assert.strictEqual(r.kind, 'box');
        assert.strictEqual(D.hqRoomNo('cafeteria'), '86', 'the number does not change after hours');
        assert.strictEqual(D.hqDoorNo(eg), '86');
        assert.strictEqual(eg.label, 'MÖBIUS STRIP CLUB', 'the hall door is re-plated');
        assert.ok(eg._base && eg._base.label === baseLabel, 'the sheet\'s plate is kept');
        assert.strictEqual(r.doors, CAFE.doors, 'the doors are the room\'s own');
        assert.strictEqual(r.shell.w, CAFE.shell.w); assert.strictEqual(r.shell.mood.light, 0xff4f9a, 'the light goes pink');
        assert.strictEqual(CAFE.shell.mood, undefined, 'the sheet\'s shell is untouched');
        assert.ok(!r.props.some(p => p.key === 'tanker_desk' || p.key === 'conference_table' || p.key === 'cash_register'), 'the serving line and the tables went home');
        assert.ok(r.props.some(p => p.key === 'mobius_bar'), 'the bar is one lathe');
        assert.ok(r.props.filter(p => p.key === 'cafeteria_chair').length >= 6, 'chairs round it');
        assert.ok(r.props.some(p => p.key === 'vending_machine') && r.props.some(p => p.key === 'notice_board') && r.props.filter(p => p.key === 'fluorescent').length === CAFE.props.filter(p => p.key === 'fluorescent').length, 'what was not dropped still stands');
        assert.deepStrictEqual(boxPropProblems('cafeteria/after_hours', r), []);
        assert.ok(r.counters.some(c => c.id === 'bar' && c.action.fn === '_goToShop') && r.counters.some(c => c.id === 'notice'), 'the bar is the shop; the board stays');
        assert.ok(r.agents.length >= 1 && r.lines.length >= 3 && r.npcSpots.length >= 3 && r.onlineSpots.length >= 2, 'a bartender, the lines, the spots');
        const row = D.hqRoomRegister().find(x => x.no === '86');
        assert.strictEqual(row.label, 'MÖBIUS STRIP CLUB', 'the directory insists it was always so');
        /* the same variant twice is idempotent; the sheet is never patched */
        D.hqApplyRoomVariant('cafeteria', 'after_hours');
        assert.strictEqual(eg._base.label, baseLabel, 'the kept plate is still the sheet\'s');
        assert.ok(!('variant' in CAFE), 'the sheet wears no variant');
    } finally {
        D.hqApplyRoomVariant('cafeteria', null);
    }
    assert.strictEqual(HQ.rooms.cafeteria, CAFE, 'restored: the sheet stands');
    assert.strictEqual(eg.label, baseLabel); assert.strictEqual(eg.sub, baseSub); assert.strictEqual(eg.desc, baseDesc);
    assert.ok(!('_base' in eg), 'the door forgets the night');
    assert.strictEqual(D.hqRoomRegister().find(x => x.no === '86').label, 'THE CAFETERIUM');
    /* the building-wide roll */
    try {
        assert.strictEqual(JSON.stringify(D.hqRollRoomVariants(prof(1), { force: { cafeteria: 'after_hours' } })), '{"cafeteria":"after_hours"}');
        assert.strictEqual(HQ.rooms.cafeteria.label, 'MÖBIUS STRIP CLUB');
        assert.strictEqual(JSON.stringify(D.hqRollRoomVariants(prof(1), { force: '' })), '{"cafeteria":null}');
        assert.strictEqual(HQ.rooms.cafeteria, CAFE);
        const rolled = D.hqRollRoomVariants(prof(1), { now: night });
        assert.strictEqual(rolled.cafeteria, 'after_hours');
    } finally {
        D.hqApplyRoomVariant('cafeteria', null);
    }
    assert.strictEqual(HQ.rooms.cafeteria, CAFE);
});

test('source scan: the renderer builds the board and the bar, seats the online shift; map.js rolls the variants on a fresh arrival; online.js publishes the count', () => {
    const tr = fs.readFileSync(path.join(__dirname, 'three-renderer.js'), 'utf8');
    const mp = fs.readFileSync(path.join(__dirname, 'map.js'), 'utf8');
    const ol = fs.readFileSync(path.join(__dirname, 'online.js'), 'utf8');
    assert.match(tr, /notice_board: function \(U\) \{/, 'the notice board builder');
    assert.match(tr, /mobius_bar: function \(U\) \{/, 'the Möbius bar builder');
    assert.match(tr, /var rr = R \+ v \* Math\.cos\(u \/ 2\);/, 'one half twist');
    assert.match(tr, /side: THREE\.DoubleSide/, 'one side, drawn from both');
    assert.match(tr, /var os = room\.onlineSpots \|\| \[\];/, 'the online spots');
    assert.match(tr, /window\._ewOnlineCount\) \|\| 0\) \| 0\) - 1\)/, 'one operative per online player besides you');
    assert.match(tr, /label: 'OPERATIVE · ON SHIFT'/, 'anonymous');
    assert.match(mp, /if \(!returning && !walking && typeof window\.hqRollRoomVariants === 'function'\)/, 'a fresh arrival rolls the variants');
    assert.match(mp, /window\.hqRollRoomVariants\(_hqProfile\(\), \{ force: _hqVariantForce\(\) \}\)/, 'with the dev override');
    assert.match(mp, /function _hqVariantForce\(\)/, '?hqvariant=');
    assert.match(mp, /if \(p\.door\.hq\.variantSeed == null\) p\.door\.hq\.variantSeed = Math\.floor\(Math\.random\(\) \* 1e9\);/, 'the seed is set once per profile');
    assert.match(ol, /window\._ewOnlineCount = count \| 0;/, 'the lobby counter is published');
    assert.ok(mp.indexOf('window.hqRollRoomVariants(') < mp.indexOf('const roomDef = DOOR_HQ.rooms[roomId];'), 'rolled before the room is read');
});
