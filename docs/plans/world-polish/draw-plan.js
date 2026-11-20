#!/usr/bin/env node
/* WORLD POLISH: THE ONE PLAN TOOL (2026-11-20; repo-only tooling, docs/plans/world-polish/WORLD_POLISH_PLAN.md sections A, E, F).
   It generalizes the three drawers that came first (thread6/plan3.js, thread5/draw-mountain.js, thread21/draw-island.js + draw-bay.js).

       node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/<zone>.js [--no-png] [--no-room] [--ascii]

   READS a data-only plan (the format is in plans/README.md; plans/woods-clearing.js is the worked example), CHECKS it against the
   standard and PRINTS EVERY FAILURE, then WRITES plans/<zone>.svg + .png (+ one picture per `pictures` row) for mondo to read in chat.
   Exit code 1 when a check fails. A build thread keeps its zone's plan passing on every change.

   One square = one 3.5 m battle square. One level = 1.75 m. A RAMP climbs one level over two squares. A LEDGE is two open squares side
   by side more than LEDGE levels apart: you walk off it and cannot climb it. No new mechanic anywhere in a plan. */
'use strict';
const fs = require('fs'), path = require('path');

/* ───────────── SECTION A'S NUMBERS: mondo changes any of them in this one table ───────────── */
const A = {
    mainWidth: 3,          // a main way, squares wide (4 only where a plan row says cars / skating: `wide: 4, why: '…'`)
    thinMax: 2,            // a thin trail is 1 or 2 squares wide
    leg: 8,                // no way runs straight for more than this many squares
    mainPlotsInLine: 3,    // the MAIN way never follows a row or a column of plots: more than this many plots in one line fails
    thinEveryPlots: 2,     // one thin trail off the main way every N plots it crosses
    districtGap: 2,        // two districts that touch: their ranges differ, or WARN when their middles are under this many levels apart
    districtLevels: 3,     // 3 or more different plot levels in a district
    sameLevelRun: 2,       // along the main way, never more than this many plots in a row on one level (unless level on purpose)
    reliefShare: 0.5,      // at least this share of a district's plots is shaped inside
    board: 8,              // a fight place: board x board squares, one whole level
    boardEveryPlots: 3,    // one fight place every N plots along the main way
    ledge: 0.6,            // two open squares this many levels apart (or more) are a ledge (the walker steps 0.62 m, jumps 1.46 m)
    smallDistrict: 2,      // a district of this many plots or fewer is not asked for a range, a lookout or a building
    /* the variety rule (mondo 11-20, same weight as the rest): these WARN */
    tooHilly: 0.85,        // more than this share of all plots shaped inside, and no plot level on purpose
    tooZigzag: 0.85,       // more than this share of the ways have legs under `shortLeg` on average
    shortLeg: 4.5,
    eye: 1,                // a walker's eye over the ground, in levels (a lookout's sight line)
};

/* the squares: letter -> [name in the legend, open to walk?, low colour, high colour]. A plan adds or renames with `tiles`. */
const TILES = {
    ' ': ['the wall of the place (forest, corn, rock, ice: the plan\'s `mass`)', false, [10, 26, 18], [52, 84, 50]],
    p: ['MAIN WAY', true, [92, 58, 28], [214, 160, 96]], P: [null, true, [92, 58, 28], [214, 160, 96]],
    q: ['THIN TRAIL', true, [150, 120, 20], [255, 232, 90]], Q: [null, true, [150, 120, 20], [255, 232, 90]],
    d: ['SECOND WAY, 2 squares (a bed, a lane)', true, [96, 84, 74], [200, 186, 160]], D: [null, true, [96, 84, 74], [200, 186, 160]],
    g: ['open ground (a clearing, a field, a yard)', true, [58, 104, 52], [176, 222, 128]],
    c: ['hard ground (paving, concrete)', true, [110, 112, 116], [190, 192, 196]],
    m: ['soft ground (mud, marsh)', true, [74, 64, 50], [74, 64, 50]],
    u: ['the ground as it stands today (`underlay`: read from the real room; the plan lays its ways over it)', true, [84, 100, 92], [214, 226, 220]],
    k: ['a building / a big landmark', true, [176, 54, 44], [176, 54, 44]],
    r: ['rock face', false, [109, 111, 115], [109, 111, 115]],
    w: ['water', false, [59, 131, 201], [59, 131, 201]],
    f: ['fence', false, [154, 160, 166], [154, 160, 166]],
};
const WAYS = { main: { w: A.mainWidth, t: 'p', tr: 'P', keep: 'gckm' }, thin: { w: 1, t: 'q', tr: 'Q', keep: 'gckmpPd' }, lane: { w: 2, t: 'd', tr: 'D', keep: 'gckmpP' } };

/* ───────────── BUILD: the plan's rows -> the grid of squares ───────────── */
function build(plan) {
    const W = plan.grid.w, H = plan.grid.h, N = plan.grid.n || 12, FAIL = [], NEW = [], WARN = [], NOTE = [];
    const tiles = Object.assign({}, TILES, plan.tiles || {}), OPEN = Object.keys(tiles).filter(k => tiles[k][1]).join('');
    const T = [], L = [], RAMP = {}, LABELS = [], WAYLIST = [];
    for (let y = 0; y < H; y++) { T.push(new Array(W).fill('.')); L.push(new Array(W).fill(0)); }
    const PLOTS = plan.plots.map(p => ({ bx: p[0], by: p[1], name: p[2], d: p[3], today: p[4], level: p[5], f: p[6] || {} })), plotAt = {};
    PLOTS.forEach(p => { if (plotAt[p.bx + ',' + p.by]) FAIL.push('two plots on one place: ' + p.name + ' / ' + plotAt[p.bx + ',' + p.by].name); plotAt[p.bx + ',' + p.by] = p;
        if (p.bx < 0 || p.by < 0 || (p.bx + 1) * N > W || (p.by + 1) * N > H) { FAIL.push('a plot outside the grid: ' + p.name); return; }
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { T[p.by * N + y][p.bx * N + x] = ' '; L[p.by * N + y][p.bx * N + x] = p.level; } });
    const plotOf = (x, y) => plotAt[Math.floor(x / N) + ',' + Math.floor(y / N)];
    /* `underlay: true` (a room that already has its height: "improve upon what's already there"): every square starts as it REALLY stands
       today, read from the room (open ground `u` at its real height to a quarter level; walls, cracks and deep drops stay closed; water = w) */
    if (plan.underlay && plan.room && !process.argv.includes('--no-room')) { try { const S = require(path.join(__dirname, '..', '..', '..', 'load-data.js')).loadGameData(), room = S.DOOR_HQ.rooms[plan.room], info = S.hqTerrainInfo(plan.room), zero = plan.grid.zero || 0, deep = plan.underlay.deep || 4;
        PLOTS.forEach(p => { for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = p.bx * N + i, y = p.by * N + j, wx = -room.shell.w / 2 + (x + 0.5) * 3.5, wz = -room.shell.d / 2 + (y + 0.5) * 3.5; let h = null, shut = false, wet = false;
            try { h = S.hqTerrainFeet(info, wx, wz, null); shut = !!(S.hqTerrainSolidAt(info, wx, wz, 0.6) || S.hqTerrainWallAt(info, wx, wz, 0.6)); const f = S.hqTerrainFluidAt(info, wx, wz); wet = !!(f && f.y != null && f.y > h + 0.3); } catch (e) { shut = true; }
            if (h == null || !isFinite(h) || shut) continue; let lv = Math.round((h - zero) / 1.75 * 4) / 4; if (wet) { T[y][x] = 'w'; L[y][x] = lv; continue; } if (lv < (p.today == null ? p.level : p.today) - deep) continue; T[y][x] = 'u'; L[y][x] = lv + (plan.underlay.shift && p.today != null ? p.level - p.today : 0); } }); } catch (e) { FAIL.push('underlay: could not read the room (' + String(e.message).slice(0, 80) + ')'); } }
    const inRoom = (x, y) => x >= 0 && y >= 0 && x < W && y < H && T[y][x] !== '.', isOpen = (x, y) => inRoom(x, y) && OPEN.indexOf(T[y][x]) >= 0, key = (x, y) => x + ',' + y;
    function set(x, y, t, l, keep) { if (y < 0 || y >= H || x < 0 || x >= W) return; if (!inRoom(x, y)) { FAIL.push('off the plots: ' + x + ',' + y + ' (' + t + '): a piece reaches a plot side with no neighbour'); return; }
        if (keep && keep.indexOf(T[y][x]) >= 0) { if (l != null && Math.abs(L[y][x] - l) > 0.01 && !RAMP[key(x, y)]) FAIL.push('level clash at ' + x + ',' + y + ': ' + T[y][x] + ' ' + L[y][x] + ' vs ' + t + ' ' + l); return; }
        T[y][x] = t; if (l != null) L[y][x] = l; delete RAMP[key(x, y)]; }
    const area = (x0, y0, x1, y1, t, l) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t, l); };
    /* a way: pts = [x, y, level]; legs along the grid; a level change of 1 = a ramp of two squares in the leg's middle */
    function way(kind, pts, o) { o = o || {}; const K = WAYS[kind], wd = o.wide || K.w, off = wd === 4 ? [-1, 0, 1, 2] : wd === 3 ? [-1, 0, 1] : wd === 2 ? [0, 1] : [0], t = K.t, tr = K.tr, nm = o.name || o.to || kind;
        if (kind === 'main' && wd > A.mainWidth && !o.why) FAIL.push('a main way ' + wd + ' squares wide with no `why` (A: ' + A.mainWidth + '; 4 only for cars / skating / fights): ' + nm);
        if (kind !== 'main' && wd > A.thinMax) FAIL.push('a thin trail over ' + A.thinMax + ' squares wide: ' + nm);
        WAYLIST.push({ kind, pts, o, wd });
        for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]), n = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
            if (dx && dy) { FAIL.push('a diagonal leg (ways lie on the battle grid): ' + a + ' -> ' + b); continue; }
            if (i > 1) { const z = pts[i - 2]; if (Math.sign(a[0] - z[0]) === dx && Math.sign(a[1] - z[1]) === dy) FAIL.push('two legs in one line (no turn): ' + z + ' -> ' + a + ' -> ' + b); }
            if (n > A.leg && !o.straight) FAIL.push('a leg over ' + A.leg + ' squares (' + n + '): ' + a + ' -> ' + b + ' (' + nm + ')');
            const dl = b[2] - a[2], steps = Math.abs(dl); if (steps && n < steps * 2 + (wd >= 3 ? 3 : 1)) FAIL.push('no room for the ramp (one level needs two squares): ' + a + ' -> ' + b);
            let r0 = Math.floor((n - steps * 2) / 2); if (wd >= 3) r0 = Math.min(Math.max(1, r0), n - 2 - steps * 2);
            for (let k = 0; k <= n; k++) { const x = a[0] + dx * k, y = a[1] + dy * k; let lv, rp = null;
                if (!steps || k <= r0) lv = a[2]; else if (k > r0 + steps * 2) lv = b[2]; else { const j = k - r0; lv = a[2] + Math.sign(dl) * (j - 0.5) / 2; rp = dl > 0 ? [dx, dy] : [-dx, -dy]; }
                const ends = (k === 0 || k === n), cap = ends && wd >= 3;
                for (const of of off) for (const o2 of (cap ? off : [0])) { const px = dx ? x + (cap ? o2 : 0) : x + of, py = dx ? y + of : y + (cap ? o2 : 0);
                    if (rp) { set(px, py, tr, lv); RAMP[key(px, py)] = rp; } else set(px, py, t, lv, K.keep); } } } }
    const applyDoors = () => (plan.doors || []).forEach(d => { if (d[4] != null) set(d[0], d[1], 'p', d[4], 'pgqdc'); });
    let doorsDone = false;
    (plan.steps || []).forEach(s => { const k = s[0];
        if (k === 'area') area(s[1], s[2], s[3], s[4], s[5], s[6]);
        else if (k === 'set') set(s[1], s[2], s[3], s[4], s[5]);
        else if (k === 'ramp') { set(s[1], s[2], s[6] || 'P', s[3]); RAMP[key(s[1], s[2])] = [s[4], s[5]]; }   // one ramp square: x, y, level, uphill dx, dy[, letter]
        else if (k === 'label') LABELS.push([s[1], s[2], s[3], s[4] || 'place']);
        else if (k === 'doors') { applyDoors(); doorsDone = true; }
        else if (WAYS[k]) way(k, s[1], s[2]);
        else FAIL.push('a step the tool does not know: ' + JSON.stringify(s).slice(0, 80)); });
    if (!doorsDone) applyDoors();
    return { plan, W, H, N, A, T, L, RAMP, LABELS, WAYLIST, PLOTS, plotAt, plotOf, inRoom, isOpen, key, tiles, OPEN, FAIL, NEW, WARN, NOTE };
}

/* ───────────── CHECK ───────────── */
function check(B, opts) { opts = opts || {}; const { plan, W, H, N, T, L, RAMP, PLOTS, plotAt, plotOf, isOpen, inRoom, key, FAIL, WARN, NOTE } = B;
    /* a rule the first plans were not drawn to: on a plan mondo has OK'd (`approved`) it is a NOTE, never a stop */
    const NEWR = s => (plan.approved ? NOTE : FAIL).push(s + (plan.approved ? '  [a newer rule; this plan has mondo\'s OK]' : ''));
    const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], dists = plan.districts || {}, dname = d => (dists[d] && dists[d].name) || d;
    const big = d => PLOTS.filter(p => p.d === d).length > A.smallDistrict && !(dists[d] && dists[d].skip) /* `skip: 'why'` = plots in the room that are not this plan's (a route's) */, DKEYS = [...new Set(PLOTS.map(p => p.d))];
    /* bridges: a deck from one square over to another, walked both ways */
    const BR = {}, brEnd = {}; (plan.bridges || []).concat(plan.stairs || []).forEach(b => { const a = b[0], c = b[1]; (BR[key(a[0], a[1])] = BR[key(a[0], a[1])] || []).push(c); (BR[key(c[0], c[1])] = BR[key(c[0], c[1])] || []).push(a);
        brEnd[key(a[0], a[1])] = [Math.sign(c[0] - a[0]), Math.sign(c[1] - a[1])]; brEnd[key(c[0], c[1])] = [Math.sign(a[0] - c[0]), Math.sign(a[1] - c[1])]; });
    /* THE LEDGES */
    const LEDGES = B.LEDGES = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!isOpen(x, y)) continue;
        for (const [dx, dy] of D4) { const X = x + dx, Y = y + dy; if (!isOpen(X, Y)) continue; const d = L[y][x] - L[Y][X], e = brEnd[key(x, y)];
            if (d > A.ledge && !(e && (e[0] ? dx !== 0 : dy !== 0))) { LEDGES.push([x, y, dx, dy, d]); if ((RAMP[key(x, y)] || RAMP[key(X, Y)]) && T[y][x] !== 'u' && T[Y][X] !== 'u') FAIL.push('a ramp beside open ground at another height: ' + x + ',' + y + ' / ' + X + ',' + Y); } } }
    /* WALKED: every open square and every way out is reached on foot from the start with no ledge; nothing is a trap */
    function reach(sx, sy, drops) { const seen = new Set([key(sx, sy)]), q = [[sx, sy]];
        for (let i = 0; i < q.length; i++) { const [x, y] = q[i]; (BR[key(x, y)] || []).forEach(br => { if (!seen.has(key(br[0], br[1]))) { seen.add(key(br[0], br[1])); q.push(br); } });
            for (const [dx, dy] of D4) { const X = x + dx, Y = y + dy; if (!isOpen(X, Y) || seen.has(key(X, Y))) continue; const up = L[Y][X] - L[y][x];
                if (up > A.ledge) continue; if (up < -A.ledge && !drops) continue; seen.add(key(X, Y)); q.push([X, Y]); } } return seen; }
    const st = plan.start || [0, 0]; if (!isOpen(st[0], st[1])) FAIL.push('`start` ' + st + ' is not an open square');
    const noDrop = reach(st[0], st[1], false); let openN = 0; const lost = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isOpen(x, y)) { openN++; if (!noDrop.has(key(x, y))) lost.push(key(x, y)); }
    (plan.doors || []).forEach(d => { if (!isOpen(d[0], d[1])) FAIL.push('the way out to ' + d[3] + ' stands on a closed square ' + d[0] + ',' + d[1]); else if (!noDrop.has(key(d[0], d[1]))) FAIL.push('the way out to ' + d[3] + ' is not reached on foot from the start (a ledge is never the only way)'); });
    const trap = lost.filter(k => { const [x, y] = k.split(',').map(Number), tp = plotOf(x, y); if (tp && dists[tp.d] && dists[tp.d].skip) return false;   // a skipped district's ground is not this plan's
        return !reach(x, y, true).has(key(st[0], st[1])); });
    if (trap.length) FAIL.push('a trap (' + trap.length + ' squares with no way back to the start): ' + trap.slice(0, 12).join(' '));
    B.stats = { open: openN, ledges: LEDGES.length, hopOnly: lost.filter(k => trap.indexOf(k) < 0) };

    /* THE WAYS: where the main way runs, plot by plot */
    const mains = B.WAYLIST.filter(w => w.kind === 'main'), thins = B.WAYLIST.filter(w => w.kind !== 'main');
    const seqOf = w => { const s = []; for (let i = 0; i < w.pts.length; i++) { const a = w.pts[Math.max(0, i - 1)], b = w.pts[i], n = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]), dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]);
        for (let k = 0; k <= n; k++) { const p = plotOf(a[0] + dx * k, a[1] + dy * k); if (p && s[s.length - 1] !== p) s.push(p); } } return s; };
    const mainPlots = new Set(); let boardsNeed = 0;
    mains.forEach(w => { const s = seqOf(w); s.forEach(p => mainPlots.add(p)); let run = 1, same = 1;
        for (let i = 1; i < s.length; i++) { const dx = s[i].bx - s[i - 1].bx, dy = s[i].by - s[i - 1].by, pd = i > 1 ? [s[i - 1].bx - s[i - 2].bx, s[i - 1].by - s[i - 2].by] : null;
            run = (pd && pd[0] === dx && pd[1] === dy) ? run + 1 : 2;
            if (run === A.mainPlotsInLine + 1) FAIL.push('THE MAIN WAY FOLLOWS A ' + (dx ? 'ROW' : 'COLUMN') + ' OF PLOTS (' + s.slice(i - A.mainPlotsInLine, i + 1).map(p => p.name).join(' > ') + '): it must turn from row to row and use the plots beside it');
            same = (s[i].level === s[i - 1].level && !s[i].f.flat && !s[i - 1].f.flat) ? same + 1 : 1;
            if (same === A.sameLevelRun + 1) NEWR('the main way crosses ' + same + ' plots in a row on level ' + s[i].level + ' (' + s.slice(i - A.sameLevelRun, i + 1).map(p => p.name).join(' > ') + '): change a level, or mark a plot `flat: \'why\'`'); } });
    /* thin trails: each says WHERE IT LEADS; one every N plots of the main way; none ends at a dead wall */
    const led = thins.filter(w => w.o.to); thins.forEach(w => { if (!w.o.to && !w.o.cont) FAIL.push('a thin trail that does not say where it leads (`to`): ' + JSON.stringify(w.pts[0]) + ' …'); });
    const need = Math.ceil(mainPlots.size / A.thinEveryPlots); if (new Set(led.map(w => w.o.to)).size < need) FAIL.push('too few thin trails: ' + new Set(led.map(w => w.o.to)).size + ' lead somewhere, the main way crosses ' + mainPlots.size + ' plots (one every ' + A.thinEveryPlots + ' = ' + need + ')');
    const doorNear = (x, y) => (plan.doors || []).some(d => Math.abs(d[0] - x) + Math.abs(d[1] - y) <= 2);
    B.WAYLIST.forEach(w => [w.pts[0], w.pts[w.pts.length - 1]].forEach(e => { if (!e) return; const x = e[0], y = e[1];
        for (const [dx, dy] of D4) { const onEdge = (dx > 0 && x % N === N - 1) || (dx < 0 && x % N === 0) || (dy > 0 && y % N === N - 1) || (dy < 0 && y % N === 0);
            if (onEdge && !inRoom(x + dx, y + dy) && !doorNear(x, y)) FAIL.push('a way ends on a plot side with no neighbour and no way out there (' + x + ',' + y + ', ' + (w.o.to || w.o.name || w.kind) + '): the tool fills it back with the wall'); }
        if (w.kind !== 'main') { let n = 0; for (const [dx, dy] of D4) if (isOpen(x + dx, y + dy)) n++; if (n < 1) FAIL.push('a thin trail ends at a dead wall: ' + x + ',' + y); } }));

    /* THE LEVELS: district ranges, plot levels, relief inside plots */
    const range = {}; DKEYS.forEach(d => { const v = PLOTS.filter(p => p.d === d).map(p => p.level); range[d] = [Math.min(...v), Math.max(...v), new Set(v).size]; });
    DKEYS.filter(big).forEach(d => { if (range[d][2] < A.districtLevels && !(dists[d] && dists[d].flat)) NEWR(dname(d) + ' has ' + range[d][2] + ' plot level(s); A asks ' + A.districtLevels + ' or more (or the district says `flat: \'why\'`)'); });
    const touch = {}; PLOTS.forEach(p => D4.forEach(([dx, dy]) => { const q = plotAt[(p.bx + dx) + ',' + (p.by + dy)]; if (q && q.d < p.d) touch[q.d + '|' + p.d] = 1; }));
    Object.keys(touch).forEach(k => { const [a, b] = k.split('|'); if (!big(a) || !big(b)) return; const ra = range[a], rb = range[b];
        if (ra[0] === rb[0] && ra[1] === rb[1]) NEWR(dname(a) + ' and ' + dname(b) + ' touch and stand at the SAME range (' + ra[0] + ' to ' + ra[1] + '): districts stand at different heights');
        else if (Math.abs((ra[0] + ra[1]) / 2 - (rb[0] + rb[1]) / 2) < A.districtGap) WARN.push(dname(a) + ' (' + ra[0] + ' to ' + ra[1] + ') and ' + dname(b) + ' (' + rb[0] + ' to ' + rb[1] + ') touch and their middles are under ' + A.districtGap + ' levels apart'); });
    let shapedAll = 0; const shaped = p => { if (p.f.relief) return true; const s = new Set(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const X = p.bx * N + x, Y = p.by * N + y; if (isOpen(X, Y) || T[Y][X] === 'r' || T[Y][X] === 'w') s.add(Math.round(L[Y][X])); } return s.size > 1; };
    DKEYS.forEach(d => { const ps = PLOTS.filter(p => p.d === d), n = ps.filter(shaped).length; shapedAll += n; if (big(d) && n / ps.length < A.reliefShare && !(dists[d] && dists[d].flat)) NEWR(dname(d) + ': ' + n + ' of ' + ps.length + ' plots are shaped inside; A asks half (give a plot `relief: \'a bank\'`, or ground at two levels)'); });

    /* ORIENTATION: a landmark and a lookout in every district; the lookout really sees */
    const marks = plan.landmarks || [], looks = plan.lookouts || [], massH = plan.massHeight == null ? 4 : plan.massHeight, bH = {};
    (plan.buildings || []).forEach(b => { for (let y = b.rect[1]; y <= b.rect[3]; y++) for (let x = b.rect[0]; x <= b.rect[2]; x++) bH[key(x, y)] = b.tall || 3; });
    const top = (x, y) => !inRoom(x, y) ? (plan.outsideHeight == null ? massH : plan.outsideHeight) : T[y][x] === ' ' ? L[y][x] + massH : T[y][x] === 'k' ? L[y][x] + (bH[key(x, y)] || 3) : L[y][x];
    const sees = (fx, fy, tx, ty, th) => { const e = L[fy][fx] + A.eye, n = Math.max(Math.abs(tx - fx), Math.abs(ty - fy)); for (let i = 2; i < n - 1; i++) { const x = Math.round(fx + (tx - fx) * i / n), y = Math.round(fy + (ty - fy) * i / n); if (top(x, y) > e + (th - e) * i / n + 0.01) return [x, y]; } return null; };
    const dOf = at => { const p = plotOf(at[0], at[1]); return p ? p.d : null; };
    marks.forEach(m => { if (!inRoom(m.at[0], m.at[1])) FAIL.push('landmark off the plots: ' + m.name); });
    DKEYS.filter(big).forEach(d => { if (!marks.some(m => dOf(m.at) === d)) NEWR(dname(d) + ' has no landmark (A, orientation: one seen from its main way)');
        const lk = looks.filter(l => dOf(l.at) === d); if (!lk.length) NEWR(dname(d) + ' has no lookout (E 8: one high place that sees its landmark and the next district)'); });
    looks.forEach(l => { const [x, y] = l.at; if (!isOpen(x, y)) { FAIL.push('lookout "' + l.name + '" stands on a closed square'); return; }
        const m = marks.find(q => q.name === l.sees); if (!m) FAIL.push('lookout "' + l.name + '": its landmark "' + l.sees + '" is not in `landmarks`');
        else { const b = sees(x, y, m.at[0], m.at[1], L[m.at[1]][m.at[0]] + (m.tall || 3)); if (b) FAIL.push('lookout "' + l.name + '" (level ' + L[y][x] + ') does NOT see ' + m.name + ': blocked at ' + b + ' (top ' + top(b[0], b[1]) + '). Raise the lookout, open the line, or pick another landmark'); }
        if (l.next) { const tg = marks.filter(q => dOf(q.at) === l.next).map(q => [q.at[0], q.at[1], L[q.at[1]][q.at[0]] + (q.tall || 3)]); let ok = tg.some(t => !sees(x, y, t[0], t[1], t[2]));
            if (!ok) for (let Y = 0; Y < H && !ok; Y += 2) for (let X = 0; X < W && !ok; X += 2) if (isOpen(X, Y) && dOf([X, Y]) === l.next && !sees(x, y, X, Y, L[Y][X])) ok = true;
            if (!ok) FAIL.push('lookout "' + l.name + '" does NOT see the next district (' + dname(l.next) + ')'); }
        else if (DKEYS.filter(big).length > 1) NEWR('lookout "' + l.name + '" does not say which next district it sees (`next`)'); });

    /* E 2: every level has a walked way up (checked above) and a FOUND way up (a climb, a ledge chain, a fallen trunk, a ladder) */
    const found = plan.found || []; found.forEach(f => { [f.from, f.to].forEach(q => { if (!isOpen(q[0], q[1])) FAIL.push('found way "' + f.name + '" starts or ends on a closed square ' + q); });
        if (isOpen(f.from[0], f.from[1]) && isOpen(f.to[0], f.to[1]) && L[f.to[1]][f.to[0]] <= L[f.from[1]][f.from[0]]) FAIL.push('found way "' + f.name + '" does not go up'); });
    DKEYS.filter(big).forEach(d => { const lv = [...new Set(PLOTS.filter(p => p.d === d).map(p => p.level))].sort((a, b) => a - b), miss = [];
        lv.slice(1).forEach(v => { if (!found.some(f => (dOf(f.to) === d || dOf(f.from) === d) && isOpen(f.from[0], f.from[1]) && isOpen(f.to[0], f.to[1]) && L[f.from[1]][f.from[0]] < v && L[f.to[1]][f.to[0]] >= v)) miss.push(v); });
        if (miss.length) NEWR(dname(d) + ': no FOUND way up to level ' + miss.join(', ') + ' (E 2: every level has a way you walk and a way you find)'); });

    /* FLAT ON PURPOSE, OPEN PLACES, FIGHT PLACES */
    const flats = plan.flats || []; let boards = 0;
    flats.forEach(f => { const [x0, y0, x1, y1] = f.rect; if (!f.why) FAIL.push('a level place with no `why`: ' + f.name);
        if (!f.board) return; let ok = false;
        for (let y = y0; y + A.board - 1 <= y1 && !ok; y++) for (let x = x0; x + A.board - 1 <= x1 && !ok; x++) { let good = true; const l0 = L[y][x];
            for (let j = 0; j < A.board && good; j++) for (let i = 0; i < A.board && good; i++) if (!isOpen(x + i, y + j) || L[y + j][x + i] !== l0 || l0 !== Math.round(l0)) good = false; ok = good; }
        if (ok) boards++; else NEWR('fight place "' + f.name + '": no ' + A.board + ' x ' + A.board + ' open squares on one whole level inside ' + f.rect + ' (E 4)'); });
    boardsNeed = Math.ceil(mainPlots.size / A.boardEveryPlots); if (boards < boardsNeed) NEWR('fight places: ' + boards + ' fit a board; the main way crosses ' + mainPlots.size + ' plots (one every ' + A.boardEveryPlots + ' = ' + boardsNeed + ')');
    DKEYS.filter(big).forEach(d => { if (!flats.some(f => dOf([f.rect[0], f.rect[1]]) === d || dOf([f.rect[2], f.rect[3]]) === d)) NEWR(dname(d) + ' names no OPEN / LEVEL place (`flats`: a square, a meadow, a shore, a field)'); });

    /* REAL ARCHITECTURE */
    const bl = plan.buildings || []; if (!bl.length) WARN.push('THE ZONE HAS NO REAL BUILDINGS in its plan: terrain and trails alone are not a zone (mondo 11-20)');
    bl.forEach(b => { const [x0, y0, x1, y1] = b.rect; if (!b.inside) FAIL.push('building "' + b.name + '" does not say what its INSIDE is (same size, shape and style as its outside)');
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!inRoom(x, y) || T[y][x] !== 'k') { FAIL.push('building "' + b.name + '": square ' + x + ',' + y + ' is not drawn as a building (k)'); y = y1 + 1; break; }
        const s = b.door, mx = Math.round((x0 + x1) / 2), my = Math.round((y0 + y1) / 2), q = s === 'N' ? [mx, y0 - 1] : s === 'S' ? [mx, y1 + 1] : s === 'W' ? [x0 - 1, my] : s === 'E' ? [x1 + 1, my] : null;
        if (!q) FAIL.push('building "' + b.name + '" has no door side (N, S, E, W)'); else if (!isOpen(q[0], q[1]) || T[q[1]][q[0]] === 'k') FAIL.push('building "' + b.name + '": no open square in front of its ' + s + ' door (' + q + ')'); });
    DKEYS.filter(big).forEach(d => { if (bl.length && !bl.some(b => dOf([b.rect[0], b.rect[1]]) === d)) WARN.push(dname(d) + ' has no building in the plan (A: every district has buildings that fit it)'); });

    /* THE VARIETY RULE (mondo 11-20, same weight) */
    if (shapedAll / PLOTS.length > A.tooHilly && !PLOTS.some(p => p.f.flat)) WARN.push('NEARLY EVERY PLOT IS HILLY (' + shapedAll + ' of ' + PLOTS.length + ') and none is level on purpose: variety, not a formula');
    if (!flats.length) WARN.push('no open or level place is named: "There can still be open areas, still be flat areas"');
    const legs = B.WAYLIST.filter(w => w.pts.length > 3).map(w => { let t = 0; for (let i = 1; i < w.pts.length; i++) t += Math.abs(w.pts[i][0] - w.pts[i - 1][0]) + Math.abs(w.pts[i][1] - w.pts[i - 1][1]); return t / (w.pts.length - 1); });
    if (legs.length > 3 && legs.filter(v => v < A.shortLeg).length / legs.length > A.tooZigzag) WARN.push('NEARLY EVERY WAY ZIGZAGS (' + legs.filter(v => v < A.shortLeg).length + ' of ' + legs.length + ' ways turn every ' + A.shortLeg + ' squares or sooner): let some run easy');

    /* THE THREAD-3 TRAPS: the plan against the room as it REALLY stands */
    const strip = PLOTS.filter(p => { const ew = plotAt[(p.bx - 1) + ',' + p.by] || plotAt[(p.bx + 1) + ',' + p.by], ns = plotAt[p.bx + ',' + (p.by - 1)] || plotAt[p.bx + ',' + (p.by + 1)]; return !(ew && ns); });
    if (PLOTS.length > 3 && strip.length === PLOTS.length) FAIL.push('THE ROOM IS ONE PLOT WIDE (a chain): it cannot be fixed inside its plots; grow the room first (F, thread 3\'s lesson 3)');
    else if (PLOTS.length > 3 && strip.length / PLOTS.length >= 0.5) WARN.push(strip.length + ' of ' + PLOTS.length + ' plots stand in a strip one plot wide (' + strip.slice(0, 6).map(p => p.name).join(', ') + ' …): thin strips read bare; think of growing the room there');
    if (!opts.noRoom && plan.room) { let R = null; try { const S = require(path.join(__dirname, '..', '..', '..', 'load-data.js')).loadGameData(); R = { S, room: S.DOOR_HQ.rooms[plan.room] }; } catch (e) { WARN.push('could not load the real room (' + e.message.slice(0, 80) + '): the room checks did not run'); }
        if (R && !R.room) FAIL.push('the room ' + plan.room + ' is not in data.js'); else if (R) { const room = R.room, S = R.S, real = {};
            if (Math.round(room.shell.w / 3.5) !== W || Math.round(room.shell.d / 3.5) !== H) NEWR('the plan\'s grid (' + W + ' x ' + H + ') is not the room\'s today (' + Math.round(room.shell.w / 3.5) + ' x ' + Math.round(room.shell.d / 3.5) + ' squares): if the plan GROWS the room say so in `grows`' + (plan.grows ? ' — it does: ' + plan.grows : ''));
            const off = plan.grid.at || [0, 0];   // where the room's plot P00-00 stands in the plan's grid (a plan that grows the room west or north)
            ((room.plots || {}).names || []).forEach(n => { const m = /^P(\d+)-(\d+)$/.exec(n[0]); if (!m) return; const c = +m[1] + off[0], r = +m[2] + off[1]; real[c + ',' + r] = n; const p = plotAt[c + ',' + r];
                if (!p) FAIL.push('the room\'s plot ' + n[0] + ' "' + n[1] + '" is not in the plan: draw the plan in the room\'s REAL frame (One World re-laid the rooms; never the old home-frame sheet)');
                else if (p.today == null) NOTE.push('"' + p.name + '" is marked new in the plan and stands in the room already (' + n[0] + ' "' + n[1] + '")'); });
            PLOTS.forEach(p => { if (!real[p.bx + ',' + p.by] && p.today != null) FAIL.push('the plan says "' + p.name + '" stands today, the room has no plot there: mark it new (today = null) or fix its place'); });
            /* seams stay level (E 7): the baked height today at each way out against the plan's level there */
            try { const info = S.hqTerrainInfo(plan.room), zero = plan.grid.zero || 0;
                (plan.doors || []).forEach(d => { if (d[4] == null) return; const dp = plotOf(d[0], d[1]); if (dp && dp.today == null) return;   // a way out on a NEW plot has no height today
                    const x = -room.shell.w / 2 + (d[0] - off[0] * N + 0.5) * 3.5, z = -room.shell.d / 2 + (d[1] - off[1] * N + 0.5) * 3.5; if (Math.abs(x) > room.shell.w / 2 || Math.abs(z) > room.shell.d / 2) return;
                    const y = S.hqTerrainFeet(info, x, z, null); if (y == null || !isFinite(y)) return; const lv = (y - zero) / 1.75;
                    if (Math.abs(lv - d[4]) > 0.5) NEWR('SEAM: the way out to ' + d[3] + ' stands at ' + y.toFixed(2) + ' m today (level ' + lv.toFixed(1) + '), the plan puts it at level ' + d[4] + ': a seam keeps its height (E 7)'); });
            } catch (e) { WARN.push('could not read the room\'s heights (' + String(e.message).slice(0, 80) + ')'); }
            /* pieces across plot lines: fine in a room design (the room's own frame), cut apart in a home-frame district file */
            if (room.world && !(plan.build && plan.build.frame === 'room')) { const moved = PLOTS.filter(p => p.f.home), apart = [];
                moved.forEach(p => D4.forEach(([dx, dy]) => { const q = plotAt[(p.bx + dx) + ',' + (p.by + dy)]; if (q && q.f.home && (q.f.home[0] - p.f.home[0] !== dx || q.f.home[1] - p.f.home[1] !== dy)) apart.push(p.name + ' | ' + q.name); }));
                NEWR('One World re-laid this room. The plan does not say `build: { frame: \'room\', file }`: a way or a piece that crosses a plot line is CUT APART when it is written in a home-frame district file' + (apart.length ? ' (not neighbours at home: ' + apart.slice(0, 6).join('; ') + ')' : '')); } } }
    return B;
}

/* ───────────── THE PICTURE ───────────── */
function draw(B, o) { const { plan, W, H, N, T, L, RAMP, PLOTS, LEDGES, key, tiles, OPEN, plotOf } = B;
    const x0 = o.x0 || 0, x1 = o.x1 == null ? W - 1 : o.x1, y0 = o.y0 || 0, y1 = o.y1 == null ? H - 1 : o.y1, S = o.S || Math.max(9, Math.min(26, Math.floor(1880 / (x1 - x0 + 1))));
    const PAD = 14, TOP = 54, cw = (x1 - x0 + 1) * S, ch = (y1 - y0 + 1) * S, dists = plan.districts || {};
    const px = x => PAD + (x - x0) * S, py = y => TOP + (y - y0) * S, esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    let lo = Infinity, hi = -Infinity; PLOTS.forEach(p => { lo = Math.min(lo, p.level); hi = Math.max(hi, p.level); }); lo -= 2; hi += 1;
    const fill = (t, l) => { const c = tiles[t]; if (!c) return '#16191a'; const u = Math.max(0, Math.min(1, (l - lo) / Math.max(1, hi - lo))); return 'rgb(' + c[2].map((v, i) => Math.round(v + (c[3][i] - v) * u)).join(',') + ')'; };
    const vis = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1; let s = '';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = T[y][x]; if (t === '.') continue;
        s += '<rect x="' + px(x) + '" y="' + py(y) + '" width="' + S + '" height="' + S + '" fill="' + fill(t, L[y][x]) + '" stroke="#000" stroke-opacity="0.28" stroke-width="0.6"/>';
        const rp = RAMP[key(x, y)]; if (rp) { const cx = px(x) + S / 2, cy = py(y) + S / 2, a = S * 0.32; s += '<polygon points="' + [[cx + rp[0] * a, cy + rp[1] * a], [cx - rp[0] * a + rp[1] * a, cy - rp[1] * a + rp[0] * a], [cx - rp[0] * a - rp[1] * a, cy - rp[1] * a - rp[0] * a]].map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + '" fill="#111" fill-opacity="0.75"/>'; }
        else if (OPEN.indexOf(t) >= 0 && S >= 15) s += '<text x="' + (px(x) + S / 2) + '" y="' + (py(y) + S / 2 + S * 0.17) + '" font-size="' + (S * 0.46).toFixed(1) + '" text-anchor="middle" fill="#000" fill-opacity="0.62">' + L[y][x] + '</text>'; }
    LEDGES.forEach(q => { const [x, y, dx, dy] = q; if (!vis(x, y)) return; const cx = px(x) + S / 2 + dx * S / 2, cy = py(y) + S / 2 + dy * S / 2, hx = dy ? S / 2 : 0, hy = dx ? S / 2 : 0;
        s += '<line x1="' + (cx - hx) + '" y1="' + (cy - hy) + '" x2="' + (cx + hx) + '" y2="' + (cy + hy) + '" stroke="#fff" stroke-width="' + Math.max(2.2, S * 0.16) + '"/>';
        s += '<polygon points="' + [[cx + dx * S * 0.42, cy + dy * S * 0.42], [cx + dx * S * 0.1 + dy * S * 0.2, cy + dy * S * 0.1 + dx * S * 0.2], [cx + dx * S * 0.1 - dy * S * 0.2, cy + dy * S * 0.1 - dx * S * 0.2]].map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '" fill="#fff"/>'; });
    (plan.bridges || []).forEach(b => { const ax = Math.min(b[0][0], b[1][0]), ay = Math.min(b[0][1], b[1][1]), bx = Math.max(b[0][0], b[1][0]), by = Math.max(b[0][1], b[1][1]); if (!vis(ax, ay)) return; const v = ax === bx;
        s += '<rect x="' + (px(ax) + (v ? 0 : S)) + '" y="' + (py(ay) + (v ? S : 0)) + '" width="' + (v ? S : (bx - ax - 1) * S) + '" height="' + (v ? (by - ay - 1) * S : S) + '" fill="#b98a52" stroke="#3a2410" stroke-width="1.5"/>'; });
    (plan.stairs || []).forEach(b => { if (!vis(b[0][0], b[0][1])) return; s += '<line x1="' + (px(b[0][0]) + S / 2) + '" y1="' + (py(b[0][1]) + S / 2) + '" x2="' + (px(b[1][0]) + S / 2) + '" y2="' + (py(b[1][1]) + S / 2) + '" stroke="#ff9a2e" stroke-width="' + Math.max(3, S * 0.5) + '" stroke-dasharray="2 2"/>'; });
    (plan.flats || []).forEach(f => { const r = f.rect; if (!vis(r[0], r[1])) return; s += '<rect x="' + (px(r[0]) + 2) + '" y="' + (py(r[1]) + 2) + '" width="' + ((r[2] - r[0] + 1) * S - 4) + '" height="' + ((r[3] - r[1] + 1) * S - 4) + '" fill="none" stroke="#9be7ff" stroke-width="2" stroke-dasharray="3 4"/>'; });
    PLOTS.forEach(p => { const X = p.bx * N, Y = p.by * N; if (X + N - 1 < x0 || X > x1 || Y > y1 || Y + N - 1 < y0) return; const c = (dists[p.d] && dists[p.d].color) || '#f2c14e';
        s += '<rect x="' + (px(X) + 1) + '" y="' + (py(Y) + 1) + '" width="' + (N * S - 2) + '" height="' + (N * S - 2) + '" fill="none" stroke="' + c + '" stroke-width="2"' + (p.today == null ? ' stroke-dasharray="8 5"' : '') + '/>';
        s += '<text x="' + (px(X) + 5) + '" y="' + (py(Y) + N * S - 6) + '" font-size="' + Math.max(9, S * 0.62).toFixed(1) + '" font-weight="700" fill="#fff" stroke="#000" stroke-width="2.6" paint-order="stroke">' + esc(p.name) + ' · ' + (p.today == null ? 'new' : 'was ' + p.today) + ' → ' + p.level + (p.f.flat ? ' · level' : '') + '</text>'; });
    const txt = (x, y, t, col, big) => '<text x="' + x + '" y="' + y + '" font-size="' + (big ? Math.max(10, S * 0.74) : Math.max(8.5, S * 0.56)).toFixed(1) + '"' + (big ? ' font-weight="700"' : '') + ' text-anchor="middle" fill="' + col + '" stroke="#000" stroke-width="2.4" paint-order="stroke">' + esc(t) + '</text>';
    (plan.found || []).forEach(f => { if (!vis(f.from[0], f.from[1])) return; s += '<line x1="' + (px(f.from[0]) + S / 2) + '" y1="' + (py(f.from[1]) + S / 2) + '" x2="' + (px(f.to[0]) + S / 2) + '" y2="' + (py(f.to[1]) + S / 2) + '" stroke="#5dff8a" stroke-width="' + Math.max(2, S * 0.2) + '" stroke-dasharray="4 3"/><circle cx="' + (px(f.to[0]) + S / 2) + '" cy="' + (py(f.to[1]) + S / 2) + '" r="' + S * 0.3 + '" fill="#5dff8a" stroke="#000"/>'; });
    (plan.lookouts || []).forEach(l => { if (!vis(l.at[0], l.at[1])) return; const cx = px(l.at[0]) + S / 2, cy = py(l.at[1]) + S / 2, m = (plan.landmarks || []).find(q => q.name === l.sees);
        if (m) s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (px(m.at[0]) + S / 2) + '" y2="' + (py(m.at[1]) + S / 2) + '" stroke="#ff7bf0" stroke-width="1.2" stroke-dasharray="2 5" stroke-opacity="0.8"/>';
        s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + S * 0.46 + '" fill="#ff7bf0" stroke="#000" stroke-width="1.2"/><circle cx="' + cx + '" cy="' + cy + '" r="' + S * 0.17 + '" fill="#000"/>'; });
    (plan.landmarks || []).forEach(m => { if (!vis(m.at[0], m.at[1])) return; const cx = px(m.at[0]) + S / 2, cy = py(m.at[1]) + S / 2, r = S * 0.62; let pts = ''; for (let i = 0; i < 10; i++) { const a = Math.PI * i / 5 - Math.PI / 2, q = i % 2 ? r * 0.45 : r; pts += (cx + Math.cos(a) * q).toFixed(1) + ',' + (cy + Math.sin(a) * q).toFixed(1) + ' '; } s += '<polygon points="' + pts + '" fill="#ffd21f" stroke="#000" stroke-width="1.2"/>'; });
    (plan.doors || []).forEach(d => { if (!vis(d[0], d[1])) return; const cx = px(d[0]) + S / 2, cy = py(d[1]) + S / 2, o2 = d[2] === 'N' ? [0, -1] : d[2] === 'S' ? [0, 1] : d[2] === 'W' ? [-1, 0] : [1, 0];
        s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (S * 0.42) + '" fill="#ff8a00" stroke="#fff" stroke-width="1.5"/>';
        s += '<text x="' + (cx + (o2[0] > 0 ? -6 : o2[0] < 0 ? 6 : 0) + (d[0] < x0 + 6 ? 4 : 0)) + '" y="' + (cy + (o2[1] < 0 ? -S * 0.75 : o2[1] > 0 ? S * 1.25 : -S * 0.8)) + '" font-size="' + Math.max(10, S * 0.7) + '" font-weight="700" text-anchor="' + (o2[0] > 0 ? 'end' : (o2[0] < 0 || d[0] < x0 + 8) ? 'start' : 'middle') + '" fill="#ffb347" stroke="#000" stroke-width="2.6" paint-order="stroke">to ' + esc(d[3]) + '</text>'; });
    B.LABELS.forEach(q => { if (q[0] < x0 - 2 || q[0] > x1 + 2 || q[1] > y1 + 1 || q[1] < y0 - 1) return; const big = q[3] === 'mark' || q[3] === 'place'; s += txt(px(q[0]) + S / 2, py(q[1]) + S * 0.5, q[2], q[3] === 'mark' ? '#ff6b6b' : q[3] === 'door' ? '#ffb347' : '#fff', big); });
    /* the legend */
    const used = new Set(); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) used.add(T[y][x]);
    const items = Object.keys(tiles).filter(k => tiles[k][0] && used.has(k)).map(k => [fill(k, (lo + hi) / 2 + 1), k === ' ' && plan.mass ? plan.mass : tiles[k][0] + (k === 'p' ? ', ' + A.mainWidth + ' squares wide' : '')]);
    const ly = TOP + ch + 24; let lg = '', lx = PAD, row = 0; const WT = Math.max(cw + PAD * 2, 900);
    items.concat([['#ffd21f', '★ a landmark'], ['#ff7bf0', '◉ a lookout (dotted: what it sees)'], ['#5dff8a', '- - a FOUND way up (a climb, a trunk, a ladder)'], ['#9be7ff', '┄ level ON PURPOSE (an open place, a fight place)']].concat((plan.stairs || []).length ? [['#ff9a2e', '▒ a STAIR (real stair pieces cut in the face; walked both ways)']] : [])).forEach(q => { const wdt = 34 + q[1].length * 7.1; if (lx + wdt > WT - PAD) { lx = PAD; row++; } lg += '<rect x="' + lx + '" y="' + (ly + row * 22 - 11) + '" width="14" height="14" fill="' + q[0] + '" stroke="#000"/><text x="' + (lx + 19) + '" y="' + (ly + row * 22) + '" font-size="12.5" fill="#ddd">' + esc(q[1]) + '</text>'; lx += wdt; });
    const dl = Object.keys(dists).map(d => d + ' = ' + dists[d].name).join(' · ');
    const lines = ['Every box is one 3.5 m battle square. The number in a square is its LEVEL (1 level = 1.75 m); lighter = higher. A black triangle = a RAMP square, pointing uphill (one level over two squares).',
        'A WHITE BAR with a tooth = a LEDGE: you hop DOWN across it (the tooth points down) and cannot climb back. That is how the walk works today: no new rule.',
        'Plot lines by district: ' + dl + '. Dashes = a new plot. Orange dots = the ways out of the room; their squares keep today\'s height.' + (plan.approved ? '' : ' A PROPOSAL: nothing is built from it until mondo says so.')];
    const maxc = Math.floor((WT - PAD * 2) / 6.7), wrapped = []; lines.forEach(t => { let cur = ''; t.split(' ').forEach(wd => { if ((cur + ' ' + wd).length > maxc) { wrapped.push(cur); cur = wd; } else cur = cur ? cur + ' ' + wd : wd; }); wrapped.push(cur); }); lines.length = 0; wrapped.forEach(t => lines.push(t));
    lines.forEach((t, i) => { lg += '<text x="' + PAD + '" y="' + (ly + (row + 1) * 22 + 8 + i * 19) + '" font-size="13" fill="#ddd">' + esc(t) + '</text>'; });
    const HT = ly + (row + 1) * 22 + 8 + lines.length * 19 + 6;
    return { w: WT, h: HT, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="' + WT + '" height="' + HT + '" font-family="Helvetica,Arial,sans-serif"><rect width="100%" height="100%" fill="#16191a"/><text x="' + PAD + '" y="24" font-size="18" font-weight="700" fill="#eee">' + esc(o.title || plan.title || plan.zone) + '</text><text x="' + PAD + '" y="44" font-size="12.5" fill="#bbb">north is up · one plot = ' + N + ' x ' + N + ' squares = ' + N * 3.5 + ' m' + (plan.room ? ' · room ' + esc(plan.room) : '') + '</text>' + s + lg + '</svg>' }; }

/* the plots as a grid of levels, as text (it goes in the chat: mondo cannot see the repo) */
function levelGrid(B) { const xs = B.PLOTS.map(p => p.bx), ys = B.PLOTS.map(p => p.by), out = [];
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) { let r = ''; for (let x = Math.min(...xs); x <= Math.max(...xs); x++) { const p = B.plotAt[x + ',' + y]; r += p ? (p.d + String(p.level).padStart(2, ' ') + (p.f.flat ? '=' : ' ')).padEnd(5, ' ') : ' ·   '; } out.push(r.replace(/\s+$/, '')); }
    return out.join('\n'); }

function load(file) { const plan = require(path.resolve(file)); return check(build(plan), { noRoom: process.argv.includes('--no-room') }); }
module.exports = { A, TILES, build, check, draw, levelGrid, load };

if (require.main === module) { const file = process.argv.slice(2).find(a => !a.startsWith('--'));
    if (!file) { console.log('usage: node docs/plans/world-polish/draw-plan.js docs/plans/world-polish/plans/<zone>.js [--no-png] [--no-room] [--ascii]'); process.exit(2); }
    const B = load(file), plan = B.plan, base = path.join(path.dirname(path.resolve(file)), path.basename(file, '.js')), dists = plan.districts || {};
    console.log('THE PLAN: ' + (plan.title || plan.zone) + (plan.approved ? '\n  (approved: ' + plan.approved + ')' : '\n  (a proposal: nothing is built from it until mondo says so)'));
    console.log('\nTHE LEVELS, plot by plot (district letter + level; "=" = level on purpose; · = no plot):\n' + levelGrid(B));
    console.log('\nTHE DISTRICTS: ' + [...new Set(B.PLOTS.map(p => p.d))].map(d => { const v = B.PLOTS.filter(p => p.d === d).map(p => p.level); return d + ' ' + ((dists[d] && dists[d].name) || '') + ' ' + Math.min(...v) + ' to ' + Math.max(...v) + ' (' + v.length + ' plots)'; }).join(' · '));
    console.log('open squares ' + B.stats.open + ' · ledge edges ' + B.stats.ledges + ' · squares reached only by a hop down (they walk out again): ' + B.stats.hopOnly.length + ' · ways: ' + B.WAYLIST.filter(w => w.kind === 'main').length + ' main, ' + B.WAYLIST.filter(w => w.o.to).length + ' thin trails that lead somewhere');
    B.WAYLIST.filter(w => w.o.to).forEach(w => console.log('  thin trail from ' + w.pts[0].slice(0, 2) + ' -> ' + w.o.to));
    if (process.argv.includes('--ascii')) console.log(B.T.map(r => r.join('')).join('\n'));
    const sec = (t, a) => { if (a.length) console.log('\n' + t + ' (' + a.length + '):\n  ' + a.join('\n  ')); };
    sec('FAILS', B.FAIL); sec('WARNINGS (the variety rule and soft numbers)', B.WARN); sec('NOTES', B.NOTE);
    if (!B.FAIL.length) console.log('\nchecks: ok' + (B.WARN.length ? ' (with ' + B.WARN.length + ' warning(s) to read)' : ''));
    const pics = [Object.assign({ file: base + '.svg' }, plan.picture || {})].concat((plan.pictures || []).map(p => Object.assign({}, p, { file: base + '-' + p.suffix + '.svg' })));
    const outs = pics.map(p => { const d = draw(B, p); fs.writeFileSync(p.file, d.svg); return Object.assign({ file: p.file }, d); });
    const done = () => { console.log('\nwrote ' + outs.map(o => path.relative(process.cwd(), o.file) + ' (' + o.w + ' x ' + o.h + ')').join(', ')); process.exit(B.FAIL.length ? 1 : 0); };
    if (process.argv.includes('--no-png')) done();
    else (async () => { try { const { chromium } = require('playwright'); const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless'] } : {});
            for (const o of outs) { const p = await b.newPage({ viewport: { width: o.w, height: o.h } }); await p.setContent('<body style="margin:0">' + o.svg + '</body>'); await p.screenshot({ path: o.file.replace(/\.svg$/, '.png') }); await p.close(); } await b.close(); console.log('(+ a .png beside each .svg)'); }
        catch (e) { console.log('(no .png: ' + String(e.message).split('\n')[0] + ')'); } done(); })(); }
