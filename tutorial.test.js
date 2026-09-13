// tutorial.test.js — THE TUTORIAL (ORIENTATION, HQ plan 4.3, 2026-09-13).
//
// Three jobs, all against the REAL files (load-data.js vm sandbox + source
// scans), repo-only tooling (CLAUDE.md TOOLING), `npm test`:
//   1. THE DRIFT REGISTER — every number a lesson states (TUTORIAL_MECHANICS
//      pins) still matches its source, every rule function a lesson describes
//      (watch) still has the body it was written against, the type wheel and
//      the arena row still say what the copy says. A drift FAILS here with the
//      lesson named: re-read it, fix it, re-stamp (check-tutorial-drift.js).
//   2. THE LESSONS' SCHEMA — every race / job / spell / tile / verb / goal /
//      focus / cpu plan a lesson names exists and is legal on an 8×8 Δ board.
//   3. THE WIRING — the engine hooks the runtime relies on are present in
//      battle.js / ui.js / state.js / hud.js / map.js / index.html / the CSS.

'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadGameData } = require('./load-data');
const drift = require('./check-tutorial-drift');

const D = loadGameData();
const LESSONS = D.TUTORIAL_LESSONS;
const MECH = D.TUTORIAL_MECHANICS;
const TAPE = D.TUTORIAL_TAPE;
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const has = (file, re) => re.test(read(file));

const GOALS = new Set(['ack', 'move', 'attack', 'spell', 'press', 'guard', 'end', 'inspect', 'channel', 'entropy', 'cpuDone', 'round', 'nexus', 'key', 'cube', 'visible', 'activation', 'item']);
const VERBS = new Set(['move', 'attack', 'spell', 'guard', 'end', 'item', 'inspect', 'channel', 'entropy', 'combo', 'switch']);
const HUD = new Set(['move', 'jump', 'attack', 'abil', 'combo', 'items', 'guard', 'end', 'ap', 'entropy', 'nexus']);
const CPU = new Set(['hold', 'approach', 'attack', 'guard', 'pass']);

test('the tutorial content loads (tape, lessons, register, helpers)', () => {
    assert.ok(TAPE && Array.isArray(TAPE.beats) && TAPE.beats.length >= 8, 'the tape has its beats');
    assert.ok(Array.isArray(LESSONS) && LESSONS.length >= 9, 'nine lessons');
    assert.ok(MECH && Object.keys(MECH).length >= 15, 'the drift register');
    for (const fn of ['tutorialFacts', 'tutorialText', 'tutorialLesson', 'tutorialProgress', 'tutorialMarkDone']) assert.strictEqual(typeof D[fn], 'function', fn);
    const core = LESSONS.filter(l => l.tier === 'core');
    assert.strictEqual(core.length, 3, 'three core tapes');
    assert.strictEqual(core.map(l => l.id).join(','), 'first_steps,the_press,three_ways');   // sandbox-realm arrays: compare as strings
    assert.ok(LESSONS.filter(l => l.tier === 'optional').length >= 5, 'at least five optional tapes');
    const ids = LESSONS.map(l => l.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'lesson ids unique');
    const nos = LESSONS.map(l => l.no).join(',');
    assert.strictEqual(nos, LESSONS.map((l, i) => i + 1).join(','), 'tapes numbered 1..n in order');
});

test('THE DRIFT REGISTER — every taught number and rule still matches the source', () => {
    const { problems } = drift.checkDrift(D);
    assert.deepStrictEqual(problems, []);
});

test('the register covers every mechanic a lesson teaches, and every lesson it names exists', () => {
    const problems = [];
    for (const L of LESSONS) for (const t of (L.teaches || [])) if (!MECH[t]) problems.push(L.id + ' teaches unknown mechanic ' + t);
    for (const [mid, m] of Object.entries(MECH)) {
        for (const lid of (m.lessons || [])) if (!LESSONS.some(l => l.id === lid)) problems.push('mechanic ' + mid + ' names unknown lesson ' + lid);
        for (const lid of (m.lessons || [])) { const L = LESSONS.find(l => l.id === lid); if (L && !(L.teaches || []).includes(mid)) problems.push('lesson ' + lid + ' does not list mechanic ' + mid + ' in teaches'); }
        for (const w of (m.watch || [])) if (!/^[0-9a-f]{10}$/.test(w.hash || '')) problems.push('mechanic ' + mid + ': ' + w.fn + ' has no stamped hash');
    }
    assert.deepStrictEqual(problems, []);
});

test('every {{fact}} in the copy resolves, live or from a pin', () => {
    const facts = D.tutorialFacts();
    const problems = [];
    const check = (where, s) => { const out = D.tutorialText(s, facts); const m = out.match(/\{\{\w+\}\}/g); if (m) problems.push(where + ': unresolved ' + m.join(' ')); };
    for (const b of TAPE.beats) check('tape ' + b.id, b.cap);
    for (const L of LESSONS) { check(L.id + ' sub', L.sub); for (const st of L.steps) { check(L.id + '/' + st.id, st.say); if (st.hint) check(L.id + '/' + st.id + ' hint', st.hint); } }
    assert.deepStrictEqual(problems, []);
    /* the numbers the copy states are the register's pins (the sandbox has no engine) */
    assert.strictEqual(facts.AP, 2); assert.strictEqual(facts.PRESS_AP, 2); assert.strictEqual(facts.PRESS_PENALTY, 1);
    assert.strictEqual(facts.NEXUS_TICKS, 4); assert.strictEqual(facts.KEYS_TO_WIN, 3); assert.strictEqual(facts.KEYS_POOL, 5);
    assert.strictEqual(facts.SIEGE, '1.5'); assert.strictEqual(facts.WEAK_MULT, '1.30'); assert.strictEqual(facts.RESIST_MULT, '0.75');
});

test('the type wheel the copy recites is TYPE_CHART, and the tape / lessons never contradict it', () => {
    const wheel = MECH.types.chart;
    for (const [t, beats] of Object.entries(wheel)) assert.strictEqual(Array.from(D.TYPE_CHART[t].strongVs).join(','), beats, t + ' beats ' + beats);
    /* the wheel closes: six types, each beaten by exactly one */
    const beaten = Object.values(wheel);
    assert.strictEqual(new Set(beaten).size, 6);
    /* the press lesson's dummies: SISTER (divine) vs a zombie (unholy → weak) and a grey (alien → resist) */
    const L = LESSONS.find(l => l.id === 'the_press');
    const types = r => Array.from(D.RACE_PROFILES[r].types);
    assert.ok(types(L.board.p1[0].race).includes('divine'), 'SISTER is divine');
    assert.ok(types(L.board.p2[0].race).includes('unholy'), 'DUMMY A is unholy');
    assert.ok(types(L.board.p2[1].race).includes('alien'), 'DUMMY B is alien');
    assert.strictEqual(wheel.divine, 'unholy'); assert.strictEqual(wheel.alien, 'divine');
});

test('every lesson is a legal scripted crossing (races, jobs, spells, tiles, verbs, goals, plans)', () => {
    const problems = [];
    const spellIds = new Set(Object.keys(D.SPELL_BY_ID || {}));
    for (const L of LESSONS) {
        const where = 'lesson ' + L.id;
        if (!D.EW_MAP_META.some(m => m.id === L.map && m.facility)) problems.push(where + ': map ' + L.map + ' is not a facility board');
        if (!['tdm', 'arena'].includes(L.mode)) problems.push(where + ': mode ' + L.mode);
        if (L.board.p1.length !== L.board.p2.length) problems.push(where + ': the two sides must be the same size (repairPartyBuilderState pads a short side)');
        const seen = new Set();
        [['p1', 1], ['p2', 2]].forEach(([k, p]) => (L.board[k] || []).forEach((u, i) => {
            const uw = where + ' ' + k + '[' + i + ']';
            if (!D.RACE_PROFILES[u.race]) problems.push(uw + ': race ' + u.race);
            if (!D.CLASS_TEMPLATES[u.job]) problems.push(uw + ': job ' + u.job);
            if (!(u.x >= 0 && u.x < 8 && u.y >= 0 && u.y < 8)) problems.push(uw + ': tile off the board');
            if (seen.has(u.x + ',' + u.y)) problems.push(uw + ': shares a tile'); seen.add(u.x + ',' + u.y);
            if (p === 1 && u.y < 4) problems.push(uw + ': P1 stands on the north half'); if (p === 2 && u.y > 3) problems.push(uw + ': P2 stands on the south half');
            for (const sid of (u.spells || [])) if (!spellIds.has(sid) && !(D.RACE_ABILITIES[u.race] || []).some(a => a.id === sid)) problems.push(uw + ': spell ' + sid);
            if (u.items) for (const it of Object.keys(u.items)) if (!D.ITEM_RULES[it]) problems.push(uw + ': item ' + it);
            if (u.face && !(Array.isArray(u.face) && u.face.length === 2)) problems.push(uw + ': face');
        }));
        const keys = new Set(L.board.p1.map((u, i) => 'p1-' + i).concat(L.board.p2.map((u, i) => 'p2-' + i)));
        for (const k of (L.order || [])) if (!keys.has(k)) problems.push(where + ': order names ' + k);
        if (L.keys) { if (L.mode !== 'arena') problems.push(where + ': keys on a non-arena lesson'); for (const xy of L.keys) if (seen.has(xy[0] + ',' + xy[1])) problems.push(where + ': a Key under a unit at ' + xy); }
        const stepIds = new Set();
        let finishes = 0;
        for (const st of L.steps) {
            const sw = where + '/' + st.id;
            if (stepIds.has(st.id)) problems.push(sw + ': duplicate step id'); stepIds.add(st.id);
            if (!st.say) problems.push(sw + ': no say');
            if (!st.goal && !st.auto) problems.push(sw + ': neither a goal nor auto');
            if (st.goal) {
                if (!GOALS.has(st.goal.type)) problems.push(sw + ': goal ' + st.goal.type);
                if (st.goal.unit && !keys.has(st.goal.unit)) problems.push(sw + ': goal unit ' + st.goal.unit);
                for (const f of ['target', 'inRangeOf', 'closer']) if (st.goal[f] && !keys.has(st.goal[f])) problems.push(sw + ': goal ' + f + ' ' + st.goal[f]);
                if (st.goal.finish) finishes++;
                if (st.goal.type !== 'ack' && st.goal.type !== 'cpuDone' && st.goal.type !== 'round' && !st.allow) problems.push(sw + ': an action goal with no allow list');
            }
            if (st.allow && st.allow !== 'all') for (const v of st.allow) if (!VERBS.has(v.split(':')[0])) problems.push(sw + ': allow ' + v);
            if (st.allow && st.allow !== 'all') for (const v of st.allow) if (v.startsWith('spell:') && !spellIds.has(v.slice(6))) problems.push(sw + ': allow names spell ' + v);
            if (st.focus) {
                if (st.focus.hud && !HUD.has(st.focus.hud)) problems.push(sw + ': focus hud ' + st.focus.hud);
                if (st.focus.unit && !keys.has(st.focus.unit)) problems.push(sw + ': focus unit ' + st.focus.unit);
                if (st.focus.tile && !(st.focus.tile[0] >= 0 && st.focus.tile[0] < 8 && st.focus.tile[1] >= 0 && st.focus.tile[1] < 8)) problems.push(sw + ': focus tile');
            }
            if (st.cpu) for (const [k, plan] of Object.entries(st.cpu)) { if (!keys.has(k) || !k.startsWith('p2')) problems.push(sw + ': cpu plan for ' + k); if (!CPU.has(plan)) problems.push(sw + ': cpu plan ' + plan); }
            if (st.enter) for (const fx of st.enter) if (!['gauge', 'fog', 'ap', 'hp', 'key', 'camera'].includes(fx[0])) problems.push(sw + ': effect ' + fx[0]);
        }
        if (finishes !== 1 || !L.steps[L.steps.length - 1].goal || !L.steps[L.steps.length - 1].goal.finish) problems.push(where + ': exactly one finishing ack, last');
    }
    assert.deepStrictEqual(problems, []);
});

test('the three ways out: the arena lesson teaches the real rules (keys, nexus, cube), the press lesson a real press', () => {
    const A = LESSONS.find(l => l.id === 'three_ways');
    assert.strictEqual(A.mode, 'arena');
    assert.ok(A.steps.some(s => s.goal && s.goal.type === 'key'), 'a Key is scanned');
    assert.ok(A.steps.some(s => s.goal && s.goal.type === 'nexus' && s.goal.section === 'earth'), 'the centre nexus is captured');
    assert.ok(A.steps.some(s => s.goal && s.goal.type === 'cube'), 'the Cube is struck');
    assert.ok(A.keys && A.keys.length === MECH.keys.modePins.keySpawnCount, 'the fixed Key pool');
    /* the first Key sits within the scan reach of a P1 unit (Chebyshev 1) */
    const k0 = A.keys[0];
    assert.ok(A.board.p1.some(u => Math.max(Math.abs(u.x - k0[0]), Math.abs(u.y - k0[1])) <= 1), 'the first Key is beside a P1 unit');
    const P = LESSONS.find(l => l.id === 'the_press');
    assert.ok(P.steps.some(s => s.goal && s.goal.type === 'press' && s.goal.outcome === 'weak'), 'a weakness press');
    assert.ok(P.steps.some(s => s.goal && s.goal.type === 'press' && s.goal.outcome === 'resist'), 'a resist');
    assert.ok(P.steps.some(s => s.goal && s.goal.type === 'entropy'), 'the strike');
    assert.ok(P.steps.some(s => (s.enter || []).some(fx => fx[0] === 'gauge')), 'the gauge is filled for training');
    /* SMITE reaches DUMMY A from SISTER's tile (range 3) */
    const smite = D.SPELL_BY_ID.raceSmite || (D.RACE_ABILITIES.nun || []).find(a => a.id === 'raceSmite');
    const s = P.board.p1[0], d = P.board.p2[0];
    assert.ok(Math.abs(s.x - d.x) + Math.abs(s.y - d.y) <= smite.range, 'Smite reaches DUMMY A');
});

test('the profile ledger: tutorialProgress / tutorialMarkDone', () => {
    const p = {};
    let pr = D.tutorialProgress(p);
    assert.strictEqual(pr.coreDone, 0); assert.strictEqual(pr.tape, null); assert.strictEqual(pr.next.id, 'first_steps');
    D.tutorialMarkDone(p, 'tape', 0);
    D.tutorialMarkDone(p, 'first_steps', 0);
    D.tutorialMarkDone(p, 'no_such_lesson', 0);
    pr = D.tutorialProgress(p);
    assert.ok(pr.tape, 'tape stamped');
    assert.strictEqual(pr.coreDone, 1); assert.strictEqual(pr.doneCount, 1); assert.strictEqual(pr.next.id, 'the_press');
    assert.strictEqual(Object.keys(p.door.tutorial.done).join(','), 'first_steps');
});

test('the wiring: the runtime, its hooks and its surfaces are in the files (source scan)', () => {
    /* ui.js: the runtime + the tape */
    assert.ok(has('ui.js', /window\._tutorialLaunch = function/) && has('ui.js', /window\._tutCpuTurn = function/) && has('ui.js', /window\._tutActionAllowed = function/) && has('ui.js', /window\._tutFilterBlades = function/) && has('ui.js', /window\._tutEvent = function/) && has('ui.js', /window\._tutTurnOrder = function/), 'ui.js: the runtime');
    assert.ok(has('ui.js', /window\._tutEngineFacts = function/), 'ui.js: the engine facts for the copy');
    assert.ok(has('ui.js', /function doorTapePlay\(/) && has('ui.js', /window\.doorTapePlay = doorTapePlay/) && has('ui.js', /doorTapeSkip/), 'ui.js: the tape player');
    for (const art of new Set(TAPE.beats.map(b => b.art))) assert.ok(has('ui.js', new RegExp('\\b' + art + ': \\(\\)')), 'ui.js draws the tape slide ' + art);
    /* battle.js: the gates + the reports */
    assert.ok(has('battle.js', /_tutActionAllowed\('move', unit\)/) && has('battle.js', /_tutActionAllowed\('attack', unit\)/) && has('battle.js', /_tutActionAllowed\('spell', unit, spell\.id\)/) && has('battle.js', /_tutActionAllowed\('item', unit\)/) && has('battle.js', /_tutActionAllowed\('inspect', unit\)/), 'battle.js: the verb gates');
    for (const ev of ['move', 'attack', 'spell', 'item', 'inspect', 'entropy', 'press', 'cube', 'activation']) assert.ok(has('battle.js', new RegExp("_tutEvent\\('" + ev + "'")), 'battle.js reports ' + ev);
    assert.ok(has('battle.js', /window\._tutCpuTurn\(unit\)/), 'battle.js: the dummies follow the script');
    assert.ok(has('battle.js', /THE TUTORIAL: a lesson ends itself/) && has('battle.js', /THE TUTORIAL: no result screen/), 'battle.js: no engine win, no result screen');
    /* ui.js gates */
    assert.ok(has('ui.js', /_tutActionAllowed\('guard', unit\)/) && has('ui.js', /_tutActionAllowed\('end', unit\)/) && has('ui.js', /_tutActionAllowed\('channel', unit\)/) && has('ui.js', /spells: 'spell', items: 'item', entropy: 'entropy'/), 'ui.js: guard / end / channel / menu gates');
    for (const ev of ['guard', 'endTurn', 'channel']) assert.ok(has('ui.js', new RegExp("_tutEvent\\('" + ev + "'")), 'ui.js reports ' + ev);
    /* state.js / hud.js */
    assert.ok(has('state.js', /window\._tutTurnOrder\(\)/), 'state.js: the lesson dictates the initiative');
    assert.ok(has('hud.js', /window\._tutFilterBlades\(rootBlades, unit\)/) && has('hud.js', /b\.tut \? ' tut'/) && has('hud.js', /'data-pid': p\.id/) && has('hud.js', /\.hrlg-blade\.tut \.hrlg-body/), 'hud.js: the ladder filter, the glow, the pusher tag');
    /* map.js + index.html + CSS */
    assert.ok(has('map.js', /window\._goToTutorial = function/) && has('map.js', /window\._renderTutorialPage = function/) && has('map.js', /window\._tutReturnPage/) && has('map.js', /data-tutorial="tape"/) && has('map.js', /window\._tutorialStartFromHq = function/), 'map.js: the shelf, the return, the RANGE console');
    assert.ok(has('index.html', /mm-btn-tutorial/) && has('index.html', /id="tutorialPage"/) && has('index.html', /id="doorTape"/), 'index.html: the button, the page, the tape');
    assert.ok(has('styles-base.css', /\.tut-coach \{/) && has('styles-base.css', /\.tut-glow \{/) && has('styles-base.css', /\.mm-btn-tutorial:hover/), 'styles-base.css: the coach, the glow, the button');
    assert.ok(has('styles-cinematic.css', /\.door-tape \{/) && has('styles-cinematic.css', /\.tape-svg \.draw/), 'styles-cinematic.css: the tape');
    /* the token moved with the R2 files (RULE #1b) */
    const tokens = new Set((read('index.html').match(/\?v=([A-Za-z0-9-]+)/g) || []));
    assert.strictEqual(tokens.size, 1, 'one cache token');
});
