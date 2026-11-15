#!/usr/bin/env node
// bake-dungeons.js — THE PLOT DUNGEONS' checker (docs/PLOT_DUNGEONS_PLAN.md §6.1). Repo tooling, never shipped.
//
//   node bake-dungeons.js            check every level of data.js PD_DUNGEONS and print its shortest solution
//   node bake-dungeons.js crypt1     one level, with its board drawn
//
// Nothing is written: the dungeons are hand-written rows in data.js (between PD-LEVELS-BEGIN / PD-LEVELS-END) and the
// game builds their rooms at load (pdInstall). This tool reads the REAL rows through load-data.js and
//   1. checks the grammar: 12 strings of 12 known squares per plot, every board slot names a plot, the entry has a spawn,
//      a plot that moves is never the entry, every mark kind is one the engine knows;
//   2. searches the level's `goal` (a condition, data.js pdCheck) breadth first over everything the officer can do: every
//      lever pulled and every thing pressed (the lever / act / take / gate / fight marks, pdDoAct). It ignores where the officer stands,
//      so it proves the board CAN be solved and how many steps the shortest way takes; the walk is proven in the browser.
'use strict';
const vm = require('vm');
const { loadGameData } = require('./load-data.js');
const sb = loadGameData({ quiet: true });
const run = (code) => vm.runInContext(code, sb);
const only = process.argv[2] || null;

const KNOWN_MARKS = { spawn: 1, lever: 1, prop: 1, act: 1, take: 1, gate: 1, exit: 1, fight: 1, trace: 1, lamp: 1, box: 1, rail: 1 };
const KNOWN_SQUARES = '#.o=/~ ';

sb.__bd = { only, KNOWN_MARKS, KNOWN_SQUARES, out: [] };
run(`(function () {
    const B = __bd, say = (s) => B.out.push(s);
    let bad = 0;
    Object.keys(pdLevels()).forEach(id => {
        if (B.only && id !== B.only) return;
        const V = pdLevel(id), L = V.L, errs = [];
        Object.keys(L.plots).forEach(pid => {
            const P = pdPlot(id, pid), C = P.cells || [];
            if (C.length !== 12 || C.some(r => r.length !== 12)) errs.push(pid + ': cells are not 12 x 12');
            C.forEach((r, y) => r.split('').forEach((ch, x) => { if (B.KNOWN_SQUARES.indexOf(ch) < 0) errs.push(pid + ': unknown square "' + ch + '" at ' + x + ',' + y); }));
            /* a plot's edge is crossed through its 7 m door only (the stage joins that span): a walked square on the edge beside
               the door would be open ground with a wall you cannot see */
            if (!P.edgeOk && C.length === 12) for (let i = 0; i < 12; i++) [[i, 0], [i, 11], [0, i], [11, i]].forEach(q => {
                const ch = (C[q[1]] || '')[q[0]], port = (i === 5 || i === 6);
                if (!port && '.o/~='.indexOf(ch) >= 0) errs.push(pid + ': square ' + q[0] + ',' + q[1] + ' is walked on the edge outside the door (squares 5-6)');
            });
            (P.marks || []).forEach(m => { if (!B.KNOWN_MARKS[m.k]) errs.push(pid + ': unknown mark kind "' + m.k + '"'); });
            if (!DOOR_HQ.rooms[pdRoomId(id, pid)]) errs.push(pid + ': no room was built');
            /* THE DRESSING's big pieces block whole squares: the ground floor must still be one walk without them */
            const R = DOOR_HQ.rooms[pdRoomId(id, pid)], big = {}; ((R && R.pdDraw) || []).forEach(r => { const m = /^big(\\d+)_(\\d+)$/.exec(r.id || ''); if (m) big[m[1] + ',' + m[2]] = 1; });
            if (Object.keys(big).length && C.length === 12) {
                const fl = (x, y, cut) => x >= 0 && y >= 0 && x < 12 && y < 12 && './o~'.indexOf(C[y][x]) >= 0 && !(cut && big[x + ',' + y]);
                const groups = (cut) => { const seen = {}; let n = 0; for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { if (!fl(x, y, cut) || seen[x + ',' + y]) continue; n++; const q = [[x, y]]; seen[x + ',' + y] = 1; while (q.length) { const c = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => { const k = (c[0] + d[0]) + ',' + (c[1] + d[1]); if (fl(c[0] + d[0], c[1] + d[1], cut) && !seen[k]) { seen[k] = 1; q.push([c[0] + d[0], c[1] + d[1]]); } }); } } return n; };
                if (groups(true) !== groups(false)) errs.push(pid + ': a big dressing piece cuts the floor in two');
            }
        });
        Object.keys(L.board || {}).forEach(s => { if (!L.plots[L.board[s]]) errs.push('slot ' + s + ' names no plot: ' + L.board[s]); });
        if (!L.plots[L.entry]) errs.push('no entry plot'); else {
            const E = pdPlot(id, L.entry);
            if (!(E.marks || []).some(m => m.k === 'spawn')) errs.push('the entry has no spawn mark');
            if (E.turn || E.slide) errs.push('the entry plot moves');
        }
        /* a plot that moves needs a lever somewhere */
        {
            const lev = {}; Object.keys(L.plots).forEach(pid => ((pdPlot(id, pid) || {}).marks || []).forEach(m => { if (m.k === 'lever') lev[m.plot || pid] = 1; }));
            Object.keys(L.plots).forEach(pid => { const Q = pdPlot(id, pid); if ((Q.turn || Q.slide) && !lev[pid]) errs.push(pid + ' moves but no lever moves it'); });
        }
        /* the presses of the level: every counter the rooms carry that writes the state */
        const acts = [];
        Object.keys(L.plots).forEach(pid => (DOOR_HQ.rooms[pdRoomId(id, pid)].counters || []).forEach(c => { if (c.proc === 'pd_act' && c.pdAct) acts.push({ id: c.id, label: c.label, plot: pid, A: c.pdAct }); }));
        const key = (S) => JSON.stringify([S.slots, S.rot, S.vars, S.items, S.fights]);
        const S0 = pdNewState(id), seen = {}, q = [{ S: S0, path: [] }];
        seen[key(S0)] = 1;
        let found = null, n = 0;
        if (!L.goal) errs.push('no goal row');
        while (L.goal && q.length && n < 400000) {
            const cur = q.shift(); n++;
            if (pdCheck(id, cur.S, L.goal)) { found = cur; break; }
            if (cur.path.length >= 14) continue;
            const next = [];
            acts.forEach(a => {
                const on = !a.A.show || pdCheck(id, cur.S, a.A.show); if (!on) return;
                const R = pdDoAct(id, cur.S, a.A); if (R.ok) next.push({ S: R.S, step: R.move ? ('lever on ' + a.plot + ': ' + (R.move.t === 'turn' ? 'turn ' + R.move.plot + (R.move.by > 0 ? ' left' : ' right') : 'slide ' + R.move.plot + ' ' + R.move.from + '>' + R.move.to)) : (a.A.fight ? 'fight ' : 'press ') + (a.label || a.id) });
            });
            next.forEach(x => { const k = key(x.S); if (seen[k]) return; seen[k] = 1; q.push({ S: x.S, path: cur.path.concat(x.step) }); });
        }
        if (L.goal && !found) errs.push('the goal was not reached (' + n + ' boards searched)');
        say((errs.length ? 'FAIL ' : 'ok   ') + id + ' · ' + (L.title || V.T.label) + ' · ' + Object.keys(L.plots).length + ' plots');
        if (found) say('       ' + found.path.length + ' steps: ' + (found.path.join(' → ') || '(already there)'));
        errs.forEach(e => say('       ! ' + e));
        if (errs.length) bad++;
        if (B.only) {
            const S = pdNewState(id);
            say('       board at the start: ' + Object.keys(S.slots).sort().map(s => s + '=' + S.slots[s] + (S.rot[S.slots[s]] ? '(turned ' + S.rot[S.slots[s]] + ')' : '')).join('  '));
            say('       joined at the start: ' + (_pdJoinsOf(id, S).map(j => j.a + '-' + j.b + ' [' + j.layer + ']').join(', ') || 'nothing'));
        }
    });
    B.bad = bad;
})()`);
console.log(sb.__bd.out.join('\n'));
process.exit(sb.__bd.bad ? 1 : 0);
