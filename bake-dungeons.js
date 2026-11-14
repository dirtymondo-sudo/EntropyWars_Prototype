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
//   2. searches the level's `goal` (a condition, data.js pdCheck) breadth first over the board's own rules: every legal
//      move (pdMoves) and every press (the act / take / gate / fight marks, pdDoAct). It ignores where the officer stands,
//      so it proves the board CAN be solved and how many steps the shortest way takes; the walk is proven in the browser.
'use strict';
const vm = require('vm');
const { loadGameData } = require('./load-data.js');
const sb = loadGameData({ quiet: true });
const run = (code) => vm.runInContext(code, sb);
const only = process.argv[2] || null;

const KNOWN_MARKS = { spawn: 1, dial: 1, console: 1, model: 1, prop: 1, act: 1, take: 1, gate: 1, exit: 1, fight: 1, trace: 1, lamp: 1, box: 1, rail: 1 };
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
            (P.marks || []).forEach(m => { if (!B.KNOWN_MARKS[m.k]) errs.push(pid + ': unknown mark kind "' + m.k + '"'); });
            if (!DOOR_HQ.rooms[pdRoomId(id, pid)]) errs.push(pid + ': no room was built');
        });
        Object.keys(L.board || {}).forEach(s => { if (!L.plots[L.board[s]]) errs.push('slot ' + s + ' names no plot: ' + L.board[s]); });
        if (!L.plots[L.entry]) errs.push('no entry plot'); else {
            const E = pdPlot(id, L.entry);
            if (!(E.marks || []).some(m => m.k === 'spawn')) errs.push('the entry has no spawn mark');
            if (E.turn || E.slide) errs.push('the entry plot moves');
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
            pdMoves(id, cur.S).forEach(m => next.push({ S: pdApplyMove(id, cur.S, m), step: (m.t === 'turn' ? 'turn ' + m.plot + (Math.abs(m.by) > 1 ? ' half' : m.by > 0 ? ' left' : ' right') : 'slide ' + m.plot + ' ' + m.from + '>' + m.to) }));
            acts.forEach(a => {
                const on = !a.A.show || pdCheck(id, cur.S, a.A.show); if (!on) return;
                const R = pdDoAct(id, cur.S, a.A); if (R.ok) next.push({ S: R.S, step: (a.A.fight ? 'fight ' : 'press ') + (a.label || a.id) });
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
