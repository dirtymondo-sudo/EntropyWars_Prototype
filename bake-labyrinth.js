#!/usr/bin/env node
/* bake-labyrinth.js — THE UNDERGROUND LABYRINTH, a room from an approved square-by-square plan (2026-11-20, world polish thread 10, THE SEWERS;
   repo-only tooling). mondo 11-20: "The entire underground needs to be like a labyrinth"; "we need victory road. labyrinth, height diffs,
   cliffs, drops waterfalls, underground horror like the descent movie". The plans are `docs/plans/world-polish/plans/ug-<district>.js` (written by
   underground/gen-district.py, approved 11-20); this tool lays one of them as a ROOM, square for square, and a ROOM DESIGN file dresses it.

       node bake-labyrinth.js docs/areas/sewers/districts/room.js [--dry-run]

   THE DESIGN FILE (the Sewers' is the worked example): { plan, room, part, site, marker, label, sub, parti, districts: { L: { name, floor,
   chamber, channel } }, pal, plots: { 'bx,by': [district, name] }, doors: [one row a plan door, in the plan's order], spawn, spawnFace, lines,
   dress(a) }. It writes the room between `/* <marker>-BEGIN` and `<marker>-END` in data.js (before the old Sewers' block) and its
   floor decals as one DOOR_HQ.decals row. Never hand-edit between the markers.

   HOW THE PLAN BECOMES THE ROOM (the old Sewers' way, bake-sewers.js derive(), with a level a SQUARE instead of a level a plot):
     the open squares (g passage, c chamber, k landmark, w sump)  `space` rows: every other square is the wall, brick to the roof (gen plan walls)
     the levels                                                   one `plateau` a run of equal level: 1 level = 1.75 m, the lowest open square = 0.
                                                                  A plateau runs 0.3 m into a neighbour as high or higher (no notch on the line)
                                                                  and stops on a line where the neighbour is lower: that line is a LEDGE (walk off it)
     a ladder (the plan's `stairs`, both ways)                    a `climb` row, iron rungs on the face, from the low square
     a found way (the plan's `found`)                             a `climb` row: a drainpipe beside a fall, a chain on a cliff
     a FALL (a `drop` branch over a waterfall)                    a `fall` row from the lip to the floor below, a splash pool at its foot
     a sump (the plan's `w`, a level under a chamber's floor)    deep water to near its brim
     the roof                                                     every run of squares under one roof wears a brick barrel vault; a square's roof
                                                                  is CEIL over the highest open square within two steps, so a ladder's foot and a
                                                                  fall's foot open up into a shaft as tall as the climb; a brick curtain closes the
                                                                  step between two roofs
     a district's `channel`                                       every passage two squares wide carries a waded channel down one of its squares;
                                                                  where it reaches a ledge it pours over a weir as a small fall
   NO SOFT LOCKS (2026-11-22, mondo: "fell into this tiny crevice in the sewers"): the plan row says `noRescue: true` (the generator cut corridors
   through the brick at ground 0 to doors its plain walk could not reach), a floor runs out over a sump's brim and the sump's bed eases down inside
   its liquid. After a bake: `node find-softlocks.js <room>` must print 0 traps and 0 crevices.
   Notes: docs/notes/areas-complexes.md "THE SEWERS' LABYRINTH" + "THE SOFT-LOCK FINDER + THE STRAIGHT RAISE". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, ARGS = process.argv.slice(2), DRY = ARGS.includes('--dry-run');
const DESF = ARGS.find(a => !a.startsWith('--')); if (!DESF) throw new Error('usage: node bake-labyrinth.js <room design file> [--dry-run]');
const DES = require(path.resolve(REPO, DESF));
const C = 3.5, LEVEL = 1.75, CEIL = 5.25, r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const mkRnd = s => { let v = s >>> 0; return () => { v = (v * 1664525 + 1013904223) >>> 0; return v / 4294967296; }; };
const B = require('./docs/plans/world-polish/draw-plan.js').build(DES.plan);
if (B.FAIL.length) throw new Error('the plan fails its own tool: ' + B.FAIL.slice(0, 3).join(' | '));
const W = B.W, H = B.H, N = B.N, T = B.T, LV = B.L, PLAN = DES.plan, HX = W * C / 2, HZ = H * C / 2;
const gx = c => r2(-HX + c * C), gz = c => r2(-HZ + c * C), gcx = c => r2(-HX + (c + 0.5) * C), gcz = c => r2(-HZ + (c + 0.5) * C);
const OPENT = 'gckw', inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const open = (x, y) => inb(x, y) && OPENT.indexOf(T[y][x]) >= 0;
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
let BASE = Infinity; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (open(x, y)) BASE = Math.min(BASE, LV[y][x]);
const Y = l => r2((l - BASE) * LEVEL), hAt = (x, y) => Y(LV[y][x]);
const D = require('./load-data.js').loadGameData(), CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
const errs = [], count = {};

/* ── THE PLOTS: every plot of the plan named and set in a district ── */
const PL = B.PLOTS.map(p => { const d = DES.plots[p.bx + ',' + p.by]; if (!d) throw new Error('room design: no district for plot ' + p.bx + ',' + p.by);
    if (!DES.districts[d[0]]) throw new Error('room design: district? ' + d[0]); return { bx: p.bx, by: p.by, level: p.level, d: d[0], name: d[1], sx: p.bx * N, sy: p.by * N, id: 'P0' + p.bx + '-0' + p.by }; });
const plotAt = {}; PL.forEach(p => { plotAt[p.bx + ',' + p.by] = p; });
const plotOf = (x, y) => plotAt[Math.floor(x / N) + ',' + Math.floor(y / N)];
const distOf = (x, y) => { const p = plotOf(x, y); return p ? DES.districts[p.d] : null; };
const PX = Math.max.apply(null, PL.map(p => p.bx)) + 1, PY = Math.max.apply(null, PL.map(p => p.by)) + 1;

/* ── the ladders, the found ways and the falls (the plan's own rows) ── */
const pairKey = (a, b) => [a.join(','), b.join(',')].sort().join('|');
const LADDER = new Set((PLAN.stairs || []).map(s => pairKey(s[0], s[1])));
const FEET = new Set();   // the squares a climb stands on (nothing is placed there)
const climbs = [];
function climbRow(lo, hi, look, why) {
    if (!open(lo[0], lo[1]) || !open(hi[0], hi[1])) { errs.push(why + ': a climb off the open squares ' + lo + ' -> ' + hi); return; }
    if (Math.abs(lo[0] - hi[0]) + Math.abs(lo[1] - hi[1]) !== 1) { errs.push(why + ': a climb between squares that do not touch ' + lo + ' ' + hi); return; }
    if (LV[hi[1]][hi[0]] - LV[lo[1]][lo[0]] < 0.6) { errs.push(why + ': a climb up no ledge ' + lo + ' -> ' + hi); return; }
    const dx = hi[0] - lo[0], dy = hi[1] - lo[1];
    climbs.push({ k: 'climb', x: r2(gcx(lo[0]) + dx * (C / 2 - 0.5)), z: r2(gcz(lo[1]) + dy * (C / 2 - 0.5)), face: dx > 0 ? 90 : dx < 0 ? 270 : dy > 0 ? 180 : 0, look });
    FEET.add(lo.join(',')); FEET.add(hi.join(','));
}
(PLAN.stairs || []).forEach(s => { const a = s[0], b = s[1], lo = LV[a[1]][a[0]] < LV[b[1]][b[0]] ? a : b, hi = lo === a ? b : a; climbRow(lo, hi, 'ladder', 'ladder ' + JSON.stringify(s)); });
count.ladders = climbs.length;
const FALLAT = new Set((PLAN.branches || []).filter(b => b.kind === 'drop' && /WATERFALL/.test(b.to)).map(b => b.at.join(',')));
/* a found climb beside a FALL stands on the arm's other square ("up the wet rock beside the fall"): the fall's splash pool sinks the ground under
   the fall's own squares and buried the pipe's foot in the face (thread 9's check, 11-20) */
(PLAN.found || []).forEach(f => { if (LADDER.has(pairKey(f.from, f.to))) return; let lo = f.from, hi = f.to; const wet = FALLAT.has(hi.join(','));
    if (wet) { const dx = hi[0] - lo[0], dy = hi[1] - lo[1]; for (const s of [1, -1]) { const L2 = [lo[0] + (dx ? 0 : s), lo[1] + (dx ? s : 0)], H2 = [hi[0] + (dx ? 0 : s), hi[1] + (dx ? s : 0)];
        if (open(L2[0], L2[1]) && open(H2[0], H2[1]) && LV[L2[1]][L2[0]] === LV[lo[1]][lo[0]] && LV[H2[1]][H2[0]] === LV[hi[1]][hi[0]]) { lo = L2; hi = H2; break; } } }
    climbRow(lo, hi, wet ? 'pipe' : 'chain', 'found way ' + f.name); });
count.foundClimbs = climbs.length - count.ladders;

/* ── THE ROOF: a square's roof is CEIL over the highest open square two steps away or nearer ── */
const ROOF = []; for (let y = 0; y < H; y++) { ROOF.push(new Array(W).fill(0)); for (let x = 0; x < W; x++) { if (!open(x, y)) continue;
    let top = LV[y][x]; const seen = new Set([x + ',' + y]); let fr = [[x, y]];
    for (let s = 0; s < 2; s++) { const nx = []; fr.forEach(([a, b]) => D4.forEach(([dx, dy]) => { const X = a + dx, Y2 = b + dy, k = X + ',' + Y2; if (!open(X, Y2) || seen.has(k)) return; seen.add(k); top = Math.max(top, LV[Y2][X]); nx.push([X, Y2]); })); fr = nx; }
    ROOF[y][x] = r2(Y(top) + CEIL); } }

/* rectangles: greedy, inside one plot, over squares `ok` that `same` the first */
function rects(ok, same, inPlot) { const used = new Uint8Array(W * H), out = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!ok(x, y) || used[y * W + x]) continue; const p = plotOf(x, y), sm = (X, Y2) => ok(X, Y2) && !used[Y2 * W + X] && same(x, y, X, Y2) && (!inPlot || plotOf(X, Y2) === p);
        let w = 1; while (x + w < W && sm(x + w, y)) w++;
        let h = 1; rows: while (y + h < H) { for (let i = 0; i < w; i++) if (!sm(x + i, y + h)) break rows; h++; }
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[(y + j) * W + x + i] = 1; out.push([x, y, w, h]); }
    return out; }

const F = [];
/* ── THE OPEN GROUND ── */
rects(open, () => true, false).forEach(([x, y, w, h]) => F.push({ k: 'space', x: r2(gx(x) + w * C / 2), z: r2(gz(y) + h * C / 2), w: w * C, d: h * C }));
count.spaces = F.length;
/* ── THE LEVELS ── */
rects((x, y) => open(x, y) && LV[y][x] > BASE, (x, y, X, Y2) => LV[y][x] === LV[Y2][X], true).forEach(([x, y, w, h]) => { const l = LV[y][x];
    /* A SUMP'S BRIM (2026-11-22, the soft-lock pass): the field runs down from a floor to a lower one over the node either side of their line, and
       beside a sump that run lay half on the floor: a dry lip a metre deep along the brim and a pocket in its corners (deeper than a jump: a
       trap). A floor runs 0.6 m out over a sump now, so the whole run down lies under the liquid. Beside lower GROUND the line stays a ledge. */
    const side = (xs, ys) => { let sump = false; for (const [a, b] of xs) if (open(a, b) && LV[b][a] < l - 0.01) { if (T[b][a] !== 'w') return 0; sump = true; } return sump ? 0.6 : 0.3; };
    const run = (n, f) => { const o = []; for (let i = 0; i < n; i++) o.push(f(i)); return o; };
    const e0 = side(run(h, j => [x - 1, y + j])), e1 = side(run(h, j => [x + w, y + j])), n0 = side(run(w, i => [x + i, y - 1])), n1 = side(run(w, i => [x + i, y + h]));
    const x0 = gx(x) - e0, x1 = gx(x + w) + e1, z0 = gz(y) - n0, z1 = gz(y + h) + n1;
    F.push({ k: 'plateau', x: r2((x0 + x1) / 2), z: r2((z0 + z1) / 2), w: r2(x1 - x0), d: r2(z1 - z0), h: Y(l), edge: 0.15 }); });
count.plateaus = F.length - count.spaces;

/* ── THE WATER: the sumps (deep, to near their brim), the channels, the falls ── */
const WATER = [], FALLS = [], CHAN = new Set();
rects((x, y) => inb(x, y) && T[y][x] === 'w', (x, y, X, Y2) => LV[y][x] === LV[Y2][X], true).forEach(([x, y, w, h]) => { const l = LV[y][x], horiz = w >= h;
    WATER.push({ k: 'stream', pts: horiz ? [[gx(x), r2(gz(y) + h * C / 2)], [gx(x + w), r2(gz(y) + h * C / 2)]] : [[r2(gx(x) + w * C / 2), gz(y)], [r2(gx(x) + w * C / 2), gz(y + h)]], w: r2((horiz ? h : w) * C - 0.3), y: r2(Y(l) + 1.2), depth: 1.2, key: (distOf(x, y) || {}).sump || 'deep_water', bank: 1.3 }); });   // (`bank`: the bed eases down INSIDE the liquid's squares, so no dry step stands at the brim)
count.sumps = WATER.length;
/* THE CHANNELS: in a district with `channel`, every passage run two squares wide (one level, one plot) carries the channel down the square on
   its north / west side; it starts at a culvert mouth or a grate and ends at a grate, or pours over a weir where the next square is lower */
const runs = rects((x, y) => open(x, y) && T[y][x] === 'g' && !!(distOf(x, y) || {}).channel && LV[y][x] === plotOf(x, y).level && !FEET.has(x + ',' + y), (x, y, X, Y2) => LV[y][x] === LV[Y2][X], true);
const CHRUNS = [];
runs.forEach(([x, y, w, h]) => { const horiz = w > h; if (Math.min(w, h) !== 2 || Math.max(w, h) < 2) return;
    const n = horiz ? w : h, l = LV[y][x], key = distOf(x, y).channel === 'sludge' ? 'sludge' : 'water';
    for (let i = 0; i < n; i++) CHAN.add(horiz ? (x + i) + ',' + y : x + ',' + (y + i));
    /* (a stream's ends are round, half its width past its points, and a stream carves its bank: the points stand that far inside the run, no bank) */
    const row = { k: 'stream', pts: horiz ? [[r2(gx(x) + 1.15), gcz(y)], [r2(gx(x + n) - 1.15), gcz(y)]] : [[gcx(x), r2(gz(y) + 1.15)], [gcx(x), r2(gz(y + n) - 1.15)]], w: 2.2, y: r2(Y(l) - 0.3), depth: 0.5, bank: 0 };
    if (key !== 'water') row.key = key; WATER.push(row);
    CHRUNS.push({ x, y, n, horiz, l, ends: [horiz ? [x - 1, y, -1, 0] : [x, y - 1, 0, -1], horiz ? [x + n, y, 1, 0] : [x, y + n, 0, 1]] }); });
count.channels = CHRUNS.length;
/* a channel's end over a ledge: the weir and a small fall (into the channel or the floor below) */
const WEIRS = [];
/* a splash pool at a fall's foot: a short stream in the square's middle (it never reaches the lip above) */
const splash = (X, Y2, dx, w, depth) => { const a = r2((C - w) / 2); return { k: 'stream', pts: dx ? [[r2(gcx(X) - a), gcz(Y2)], [r2(gcx(X) + a), gcz(Y2)]] : [[gcx(X), r2(gcz(Y2) - a)], [gcx(X), r2(gcz(Y2) + a)]], w, y: r2(hAt(X, Y2) - 0.15), depth, bank: 0 }; };
CHRUNS.forEach(c => c.ends.forEach(([X, Y2, dx, dy]) => { if (!open(X, Y2) || LV[Y2][X] > c.l - 0.6) return; const ex = X - dx, ey = Y2 - dy;
    FALLS.push({ k: 'fall', x: r2(gcx(ex) + dx * C / 2), z: r2(gcz(ey) + dy * C / 2), face: dx > 0 ? 90 : dx < 0 ? 270 : dy > 0 ? 180 : 0, w: 2.0, y0: r2(Y(c.l) - 0.3), y1: r2(hAt(X, Y2) - (CHAN.has(X + ',' + Y2) ? 0.3 : 0)) });
    if (!CHAN.has(X + ',' + Y2) && T[Y2][X] !== 'w') WATER.push(splash(X, Y2, dx, 2.2, 0.35));
    WEIRS.push({ x: ex, y: ey, dx, dy }); }));
/* THE PLAN'S FALLS: a `drop` over a waterfall pours from the lip to the floor below; a splash at its foot */
(PLAN.branches || []).filter(b => b.kind === 'drop' && /WATERFALL/.test(b.to)).forEach(b => { const [x, y] = b.at; let lo = null;
    D4.forEach(([dx, dy]) => { const X = x + dx, Y2 = y + dy; if (open(X, Y2) && LV[Y2][X] < LV[y][x] - 0.6 && (!lo || LV[Y2][X] < LV[lo[1]][lo[0]])) lo = [X, Y2, dx, dy]; });
    if (!lo) { errs.push('a waterfall with no floor below at ' + b.at); return; } const [X, Y2, dx, dy] = lo;
    const wet = CHAN.has(x + ',' + y);
    if (!FALLS.some(f => Math.abs(f.x - r2(gcx(x) + dx * C / 2)) < 0.1 && Math.abs(f.z - r2(gcz(y) + dy * C / 2)) < 0.1))
        FALLS.push({ k: 'fall', x: r2(gcx(x) + dx * C / 2), z: r2(gcz(y) + dy * C / 2), face: dx > 0 ? 90 : dx < 0 ? 270 : dy > 0 ? 180 : 0, w: 2.6, y0: r2(hAt(x, y) - (wet ? 0.3 : -0.05)), y1: r2(hAt(X, Y2) - 0.15) });
    if (!CHAN.has(X + ',' + Y2)) WATER.push(splash(X, Y2, dx, 2.6, 0.4));
    WEIRS.push({ x, y, dx, dy, big: true }); });
count.falls = FALLS.length;

/* ── THE VAULTS + THE GRIME (bake-sewers.js build 4 + the grime pass, a square's own roof): one `arch` row a plot ── */
const VAULT = [], DAMP = [0x7c766a, 0x6a6a58, 0x5c6450, 0x74695a, 0x66604f], grnd = mkRnd(9241), RUST = 'urban:MetalCorrugatedPainted2a';
const PARTS = {}; PL.forEach(p => { PARTS[p.id] = []; });
const partsOf = (x, y) => PARTS[plotOf(x, y).id], pox = p => gx(p.sx) + N * C / 2, poz = p => gz(p.sy) + N * C / 2;
rects(open, (x, y, X, Y2) => ROOF[y][x] === ROOF[Y2][X] && LV[y][x] === LV[Y2][X], true).forEach(([x, y, w, h]) => {
    const p = plotOf(x, y), parts = PARTS[p.id], ox = pox(p), oz = poz(p), top = ROOF[y][x], yf = hAt(x, y), rock = (DES.districts[p.d] || {}).rock;   /* `rock` (a district cut in natural rock: the Cavern's palette, mondo 11-20) */
    const alongX = w >= h, span = (alongX ? h : w) * C + 0.7, len = (alongX ? w : h) * C + 0.1, rise = r2(Math.min(3.5, span / 3)), cx = r2(gx(x) + w * C / 2 - ox), cz = r2(gz(y) + h * C / 2 - oz);
    parts.push({ s: 'box', p: [cx, r2(top + 0.05), cz], size: [r2(w * C + 0.2), 0.2, r2(h * C + 0.2)], sides: false, top: false, under: true, key: 'bricks_2', tint: 0x4a463f });
    parts.push({ s: 'roof', form: 'barrel', p: [cx, r2(top - rise), cz], size: [r2(len), rise, r2(span)], ry: alongX ? 0 : 90, key: rock ? rock.roof : 'bricks_2', tint: rock ? 0xe6e2da : DAMP[Math.floor(grnd() * DAMP.length)], ds: true, ends: false, seg: 8 });
    count.vaults = (count.vaults || 0) + 1;
    /* the grime: a slime line at every wall's foot; a rusted main on brackets along a north / west wall of three squares or more, a downpipe at its end */
    const side = (horiz, at, a0, n, out, pipes) => { let run = 0; for (let i = 0; i <= n; i++) { const X = horiz ? a0 + i : at + out, Y2 = horiz ? at + out : a0 + i, wallHere = i < n && !open(X, Y2) && inb(X, Y2) || (i < n && !inb(X, Y2));
            if (wallHere) { run++; continue; } if (!run) continue;
            const s0 = a0 + i - run, L = run * C, mid = (horiz ? gx(s0) - ox : gz(s0) - oz) + L / 2, edge = (horiz ? gz(at + (out > 0 ? 1 : 0)) - oz : gx(at + (out > 0 ? 1 : 0)) - ox), inw = -out;
            const at3 = (off, yy) => horiz ? [r2(mid), r2(yy), r2(edge + inw * off)] : [r2(edge + inw * off), r2(yy), r2(mid)], sz = (t, hh) => horiz ? [r2(L), hh, t] : [t, hh, r2(L)];
            if (rock) parts.push({ s: 'box', p: at3(0.035, yf - 0.2), size: sz(0.06, r2(top - yf + 0.2)), key: rock.wall, tint: 0xe6e2da, top: false, uv: 3.5 });   // the rock face over the brick wall
            parts.push({ s: 'box', p: at3(0.05, yf), size: sz(0.08, r2(0.45 + grnd() * 0.5)), key: rock ? rock.wall : 'bricks_2', tint: 0x1c2416, top: false });
            if (pipes && run >= 3 && !rock) { const yy = r2(yf + 2.3 + grnd() * 0.5);
                parts.push({ s: 'box', p: at3(0.3, yy), size: sz(0.3, 0.3), key: RUST, tint: 0x6a3f24, under: true }, { s: 'box', p: at3(0.24, yy - 0.42), size: sz(0.12, 0.12), key: RUST, tint: 0x2e3a2e, under: true });
                for (let b = 0.9; b < L; b += 3.5) { const q = horiz ? [r2(mid - L / 2 + b), r2(yy - 0.1), r2(edge + inw * 0.2)] : [r2(edge + inw * 0.2), r2(yy - 0.1), r2(mid - L / 2 + b)]; parts.push({ s: 'box', p: q, size: horiz ? [0.1, 0.5, 0.4] : [0.4, 0.5, 0.1], key: RUST, tint: 0x222222 }); }
                const e = horiz ? [r2(mid + L / 2 - 0.4), yf, r2(edge + inw * 0.3)] : [r2(edge + inw * 0.3), yf, r2(mid + L / 2 - 0.4)]; parts.push({ s: 'cyl', p: e, r: 0.15, h: r2(yy - yf), key: RUST, tint: 0x5a3622, seg: 8 }); count.pipes = (count.pipes || 0) + 1; }
            run = 0; } };
    side(true, y, x, w, -1, true); side(true, y + h - 1, x, w, 1, false); side(false, x, y, h, -1, true); side(false, x + w - 1, y, h, 1, false); });
/* the curtains: where two open squares side by side have roofs at two heights, brick closes the step between the roofs */
{ const lines = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!open(x, y)) continue; for (const [dx, dy] of [[1, 0], [0, 1]]) { const X = x + dx, Y2 = y + dy; if (!open(X, Y2) || Math.abs(ROOF[y][x] - ROOF[Y2][X]) < 0.05) continue;
      const lo = Math.min(ROOF[y][x], ROOF[Y2][X]), hi = Math.max(ROOF[y][x], ROOF[Y2][X]); lines.push({ x, y, dx, lo, hi }); } }
  lines.forEach(l => { const p = plotOf(l.x, l.y), parts = PARTS[p.id], ox = pox(p), oz = poz(p);
      const cx = l.dx ? gx(l.x + 1) - ox : gcx(l.x) - ox, cz = l.dx ? gcz(l.y) - oz : gz(l.y + 1) - oz;
      const floor = Math.max(hAt(l.x, l.y), hAt(l.x + l.dx, l.y + (l.dx ? 0 : 1))), b0 = Math.max(l.lo - 3.6, floor + 3.2);   // (never down into a walker's head room)
      parts.push({ s: 'box', p: [r2(cx), r2(b0), r2(cz)], size: l.dx ? [0.3, r2(l.hi - b0 + 0.2), C + 0.05] : [C + 0.05, r2(l.hi - b0 + 0.2), 0.3], key: 'bricks_2', tint: 0x5e584e, uv: 3.5 }); });
  count.curtains = lines.length; }

/* ── THE DOORS: one a plan door; a door on the room's edge stands in the wall, else it stands free on its square's side ── */
const FACE = { N: 180, S: 0, W: 90, E: 270 }, SIDE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
/* where a way stands: on its square's side `sd` (or the first side that is rock); a side that is open ground moves it to the nearest square of
   the same level with rock on a side (the plan marks a way out at a node's corner, where a passage may run on) */
function wayAt(x, y, sd, name) {
    if (!open(x, y)) throw new Error('way ' + name + ': its square is not open ' + x + ',' + y);
    if (!sd) sd = ['N', 'W', 'E', 'S'].find(q => !open(x + SIDE[q][0], y + SIDE[q][1]));
    if (!sd || open(x + SIDE[sd][0], y + SIDE[sd][1])) { let best = null; for (let r = 1; r <= 3 && !best; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const a = x + dx, b = y + dy; if (best || !open(a, b) || LV[b][a] !== LV[y][x] || FEET.has(a + ',' + b)) continue;
            for (const s2 of [sd, 'N', 'W', 'E', 'S']) if (s2 && !open(a + SIDE[s2][0], b + SIDE[s2][1]) && inb(a + SIDE[s2][0], b + SIDE[s2][1])) { best = [a, b, s2]; break; } }
        if (!best) throw new Error('way ' + name + ': no wall near ' + x + ',' + y); console.log('way ' + name + ': ' + x + ',' + y + ' ' + sd + ' is open ground; it stands at ' + best.join(' ')); [x, y, sd] = best; }
    if (FEET.has(x + ',' + y)) throw new Error('way ' + name + ': its square ' + x + ',' + y + ' is a ladder\'s foot or another way\'s');
    FEET.add(x + ',' + y); const v = SIDE[sd], X = x + v[0], Y2 = y + v[1], e = { sq: [x, y] };
    if (!inb(X, Y2)) { e.wall = sd.toLowerCase(); if (sd === 'N' || sd === 'S') e.x = gcx(x); else e.z = gcz(y); }
    else { e.wall = 'free'; e.x = sd === 'W' ? gx(x) : sd === 'E' ? gx(x + 1) : gcx(x); e.z = sd === 'N' ? gz(y) : sd === 'S' ? gz(y + 1) : gcz(y); e.face = FACE[sd]; }
    e.y = hAt(x, y); return e; }
/* THE WAYS: the plan's doors (in its order), then the design's own `ways` (the old links, each at a dead end of its district). A row with `link`
   is the end of a DOOR_HQ.links row (rewritten in data.js below); a row with `id` is one of the room's own doors. */
const doors = [], LINKENDS = {};
const way = (o, x, y, sd) => { const e = wayAt(x, y, sd, o.link || o.id);
    if (o.link) { LINKENDS[o.link] = e; return; }
    const d = { id: o.id, leaf: o.leaf, wide: o.wide !== false, label: o.label, sub: o.sub, action: o.action, desc: o.desc || '', wall: e.wall };
    ['x', 'z', 'face'].forEach(k => { if (e[k] != null) d[k] = e[k]; }); if (e.wall === 'free') d.passage = { len: 3, deep: 1.2 }; d.y = e.y; if (o.way) d.way = o.way; if (o.minClearance) d.minClearance = o.minClearance; doors.push(d); };
(PLAN.doors || []).forEach((r, i) => { const o = DES.doors[i]; if (!o) throw new Error('room design: no row for the plan\'s door ' + i + ' (' + r[3] + ')'); way(o, r[0], r[1], r[2]); });
(DES.ways || []).forEach(o => way(o, o.sq[0], o.sq[1], o.side));

/* ── THE DRESSING: the design's dress(a) ── */
const props = [], npc = [], DRESS = [], DECALS = [], taken = new Set(), rnd = mkRnd(4721);
const place = (key, x, y, why) => { if (!open(x, y)) { errs.push(why + ' ' + key + ' on a closed square ' + x + ',' + y); return false; } if (T[y][x] === 'w') { errs.push(why + ' ' + key + ' in a sump ' + x + ',' + y); return false; }
    if (FEET.has(x + ',' + y)) { errs.push(why + ' ' + key + ' at a ladder\'s foot / a door ' + x + ',' + y); return false; } return true; };
const A = {
    W, H, N, C, gx, gz, gcx, gcz, r2, open, T, LV, hAt, roof: (x, y) => ROOF[y][x], plotOf, distOf, rnd, CHAN, FEET, PL,
    feat: f => F.push(f),
    /* a blocker on a square's middle (one a square) */
    P(key, x, y, o) { if (!CAT[key]) { errs.push('not in the catalogue: ' + key); return; } if (o && o.near) { const q = A.free(x, y); if (!q) { errs.push(key + ': no free square near ' + x + ',' + y); return; } [x, y] = q; o = Object.assign({}, o); delete o.near; } if (!place(key, x, y, 'P')) return; if (CHAN.has(x + ',' + y)) { errs.push(key + ' stands in a channel ' + x + ',' + y); return; }
        if (taken.has(x + ',' + y)) { errs.push(key + ': square ' + x + ',' + y + ' is taken'); return; } taken.add(x + ',' + y); o = Object.assign({}, o);
        const px = r2(gcx(x) + (o.dx || 0)), pz = r2(gcz(y) + (o.dz || 0)); delete o.dx; delete o.dz; props.push(Object.assign({ key, x: px, z: pz }, o)); },
    /* decor off a square's middle (never blocks) */
    dec(key, x, y, o) { if (!CAT[key]) { errs.push('not in the catalogue: ' + key); return; } if (!place(key, x, y, 'dec')) return;
        /* A COBWEB HANGS IN A CORNER (2026-11-22, mondo: "spiderweb decals standing upright"): the pack's web is one flat card, hung from its
           top corner. On the floor it stood up like a sign. It spans the corner of two walls now, over head height (one wall only: flat on it) */
        if (/cobweb/.test(key)) { const wallsOf = (X, Y2) => [['n', 0, -1], ['e', 1, 0], ['s', 0, 1], ['w', -1, 0]].filter(q => !open(X + q[1], Y2 + q[2]));
            let wl = wallsOf(x, y);
            if (!wl.length) { /* out on open floor: the nearest square of its level that has a wall */
                search: for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const X = x + dx, Y2 = y + dy;
                    if (open(X, Y2) && LV[Y2][X] === LV[y][x] && T[Y2][X] !== 'w' && wallsOf(X, Y2).length) { x = X; y = Y2; wl = wallsOf(X, Y2); break search; } } }
            if (wl.length) { const a = wl[0], b = wl.find(q => q !== a && (q[1] !== -a[1] || q[2] !== -a[2])) || null, hw = 1.75;
                const row = b ? { x: r2(gcx(x) + (a[1] + b[1]) * (hw - 0.5)), z: r2(gcz(y) + (a[2] + b[2]) * (hw - 0.5)), face: ((a[1] + b[1]) * (a[2] + b[2]) > 0) ? 45 : 135 }
                              : { x: r2(gcx(x) + a[1] * (hw - 0.06)), z: r2(gcz(y) + a[2] * (hw - 0.06)), face: a[1] ? 90 : 0 };
                rnd(); rnd(); rnd();   /* (the three draws a floor piece takes: every other piece keeps its place) */
                props.push(Object.assign({ key }, row, { y: r2(hAt(x, y) + 1.9), noSeat: true, noBlock: true }, o || {})); return; } }   /* (a `y` of 1 or more is a height from the room's floor) */
        props.push(Object.assign({ key, x: r2(gcx(x) + (rnd() - 0.5) * 1.6), z: r2(gcz(y) + (rnd() - 0.5) * 1.6), face: Math.round(rnd() * 360), noBlock: true }, o || {})); },
    /* hung from the vault: `y` = its top */
    ceil(key, x, y, drop, o) { if (!CAT[key]) { errs.push('not in the catalogue: ' + key); return; } if (!open(x, y)) { errs.push('ceil ' + key + ' over a closed square ' + x + ',' + y); return; }
        props.push(Object.assign({ key, x: gcx(x), z: gcz(y), ceil: true, y: r2(ROOF[y][x] - (drop || 2.2)), noBlock: true }, o || {})); },
    native(race, x, y, face, say) { if (RACES.indexOf(race) < 0) { errs.push('not a unit: ' + race); return; } { const q = A.free(x, y); if (q) [x, y] = q; } if (!place(race, x, y, 'native')) return; if (CHAN.has(x + ',' + y)) { errs.push(race + ' stands in a channel ' + x + ',' + y); return; }
        if (taken.has(x + ',' + y)) { errs.push(race + ': square taken ' + x + ',' + y); return; } taken.add(x + ',' + y); const n = { x: gcx(x), z: gcz(y), face: face || 0, race }; if (say) n.say = say; npc.push(n); },
    grime(kind, x, y, r) { DECALS.push({ kind, x: r2(gcx(x) + (rnd() - 0.5) * 1.2), z: r2(gcz(y) + (rnd() - 0.5) * 1.2), y: hAt(x, y), r: r || 1.4, rot: Math.round(rnd() * 360) }); },
    /* a drawn part, room coordinates (one `arch` row for the whole dressing) */
    box(x, y, z, w, h, d, key, tint, o) { DRESS.push(Object.assign({ s: 'box', p: [r2(x), r2(y), r2(z)], size: [r2(w), r2(h), r2(d)], key, tint }, o || {})); },
    cyl(x, y, z, r, h, key, tint, o) { DRESS.push(Object.assign({ s: 'cyl', p: [r2(x), r2(y), r2(z)], r, h: r2(h), key, tint, seg: 10 }, o || {})); },
};
/* the nearest free square (open, dry, off the channels, the ladders' feet and the ways, not taken, one level) to x, y, within 3 */
A.free = (x, y) => { const lv = open(x, y) ? LV[y][x] : null; for (let r = 0; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const a = x + dx, b = y + dy;
        if (open(a, b) && T[b][a] !== 'w' && !CHAN.has(a + ',' + b) && !FEET.has(a + ',' + b) && !taken.has(a + ',' + b) && (lv == null || LV[b][a] === lv)) return [a, b]; } return null; };
/* a run of track (rail_section a square + two steel rails, 0.14 m: stepped over, grindable), buffer stops at its ends */
A.rails = (x0, y0, x1, y1, buffers) => { const horiz = y0 === y1, n = horiz ? Math.abs(x1 - x0) + 1 : Math.abs(y1 - y0) + 1, sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
    for (let i = 0; i < n; i++) { const x = x0 + sx * i, y = y0 + sy * i; if (!open(x, y) || CHAN.has(x + ',' + y)) { errs.push('rails over a closed square / a channel ' + x + ',' + y); return; } taken.add(x + ',' + y); props.push({ key: 'track_bed', x: gcx(x), z: gcz(y), face: horiz ? 90 : 0, noBlock: true }, { key: 'rail_section', x: gcx(x), z: gcz(y), face: horiz ? 90 : 0, noBlock: true }); }
    const a = horiz ? [gx(Math.min(x0, x1)), gcz(y0)] : [gcx(x0), gz(Math.min(y0, y1))], b = horiz ? [gx(Math.max(x0, x1) + 1), gcz(y0)] : [gcx(x0), gz(Math.max(y0, y1) + 1)];
    for (const off of [-0.72, 0.72]) F.push(horiz ? { k: 'wall', x0: a[0], z0: r2(a[1] + off), x1: b[0], z1: r2(b[1] + off), h: 0.14, t: 0.12, key: 'metal' } : { k: 'wall', x0: r2(a[0] + off), z0: a[1], x1: r2(b[0] + off), z1: b[1], h: 0.14, t: 0.12, key: 'metal' });
    if (buffers) [[x0, y0, -sx, -sy], [x1, y1, sx, sy]].forEach(([x, y, dx, dy]) => props.push({ key: 'buffer_stop', x: r2(gcx(x) + dx * 1.2), z: r2(gcz(y) + dy * 1.2), face: horiz ? (dx > 0 ? 90 : 270) : (dy > 0 ? 180 : 0), noBlock: true })); };
/* a wall face beside an open square: the side (n s w e) that is rock, or null */
A.wallSide = (x, y) => { for (const [s, v] of [['n', [0, -1]], ['w', [-1, 0]], ['e', [1, 0]], ['s', [0, 1]]]) if (!open(x + v[0], y + v[1])) return s; return null; };
/* THE DISTRICT KIT (the Culverts' first, 11-20; every district since): every square of a district is looked at once, in order: lamps on the
   walls every few squares (the district's own light), a culvert mouth where a channel starts at a wall, a grate where it ends, a weir board and
   a sluice over each fall, a rat under a dead lamp, the district's rubbish in the bends; `timber` = a mine's timber sets on the walls */
A.kit = (letter, st) => { st = Object.assign({ lamp: 0xffc070, lampKey: 'cage_lamp', every: 11, rubbish: ['psx_metal_barrel_mp_2', 'rat', 'psx_cobweb_1', null, 'floor_stain'], timber: false }, st || {});
    const k = { lamps: 0, mouths: 0, grates: 0, weirs: 0, timber: 0 };
    const isW = (x, y) => open(x, y) && plotOf(x, y).d === letter;
    const DIR = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }, FACEOF = { n: 180, s: 0, w: 90, e: 270 };
    /* the channels' two ends */
    /* A GRATE LIES IN THE FLOOR (2026-11-22, mondo: "there are grates standing up right"): the grate's file stands on edge (a wall grate) and it
       stood so in the middle of the channel's last square. `drain_grate_floor` is the same file lying down: as wide as the channel, over the
       channel's last two metres, its top a hand over the walk (the channel's bed is 0.8 m under the walk, the grate 0.45 m thick at this width, so it stands in the water) */
    const grate = (ex, ey, dx, dy) => props.push({ key: 'drain_grate_floor', x: r2(gcx(ex) + dx * 0.6), z: r2(gcz(ey) + dy * 0.6), face: dx ? 90 : 0, span: 2.2, y: 0.24, noSeat: true, noBlock: true });
    CHRUNS.forEach(c => { if (!isW(c.x, c.y)) return; c.ends.forEach(([X, Y2, dx, dy], i) => { const ex = X - dx, ey = Y2 - dy;
        if (!open(X, Y2)) { /* the channel meets a wall: a culvert mouth in it (the start) or a grate (the end) */
            const face = dx > 0 ? 270 : dx < 0 ? 90 : dy > 0 ? 0 : 180;
            if (i === 0) { props.push({ key: 'culvert_mouth', x: r2(gcx(ex) + dx * 1.45), z: r2(gcz(ey) + dy * 1.45), face, noBlock: true, scale: 0.75 }); k.mouths++; }
            else { grate(ex, ey, dx, dy); k.grates++; } }
        else if (LV[Y2][X] > c.l + 0.6 || (LV[Y2][X] === c.l && !CHAN.has(X + ',' + Y2))) { grate(ex, ey, dx, dy); k.grates++; } }); });
    /* the weirs: a concrete board across the lip, a sluice frame over it */
    WEIRS.forEach(w => { if (!isW(w.x, w.y)) return; const cx = gcx(w.x) + w.dx * (C / 2 - 0.15), cz = gcz(w.y) + w.dy * (C / 2 - 0.15), yf = hAt(w.x, w.y), ns = w.dx === 0, span = w.big ? 2.8 : 2.4;
        A.box(cx, yf - 0.45, cz, ns ? span : 0.3, 0.55, ns ? 0.3 : span, 'urban:ConcreteStriped1e', 0x7a7a72);
        for (const s of [-1, 1]) A.box(cx + (ns ? s * span / 2 : 0), yf - 0.4, cz + (ns ? 0 : s * span / 2), 0.12, 2.3, 0.12, null, 0x2c2e30);
        A.box(cx, yf + 1.85, cz, ns ? span + 0.1 : 0.14, 0.14, ns ? 0.14 : span + 0.1, null, 0x2c2e30);
        A.box(cx, yf + 1.3, cz, ns ? span - 0.2 : 0.05, 0.45, ns ? 0.05 : span - 0.2, 'urban:MetalCorrugatedPainted2a', 0x4a4a46);   // the gate, wound up
        A.cyl(cx, yf + 2.05, cz, 0.05, 0.5, RUST, 0x2a2a2a);
        k.weirs++; });
    /* lamps: a cage lamp on a wall face every few squares of passage, the brick round it lit (drawn); a dead one has a rat under it */
    let n = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || FEET.has(x + ',' + y) || T[y][x] === 'w') continue; const s = A.wallSide(x, y); if (!s) continue;
        if (((x * 7 + y * 13) % st.every) !== 0) continue; const v = DIR[s], yf = hAt(x, y), dead = (n++ % 4) === 3;
        props.push({ key: st.lampKey, x: r2(gcx(x) + v[0] * 1.55), z: r2(gcz(y) + v[1] * 1.55), ceil: true, y: r2(yf + 2.7), face: FACEOF[s], noBlock: true }); k.lamps++;
        if (dead) { props.push({ key: 'rat', x: r2(gcx(x) + v[0] * 1.1 + (v[0] ? 0 : 0.7)), z: r2(gcz(y) + v[1] * 1.1 + (v[1] ? 0 : 0.7)), face: (x * 67 + y * 131) % 360, noBlock: true }); continue; }
        const wx = gcx(x) + v[0] * 1.72, wz = gcz(y) + v[1] * 1.72, ns = s === 'n' || s === 's';
        A.box(wx, yf + 2.4, wz, ns ? 0.14 : 0.04, 0.18, ns ? 0.04 : 0.14, null, st.lamp, { glow: 1 });
        [[1.3, 1.5, 0.2], [2.4, 2.6, 0.1]].forEach(([w2, h2, g], i) => A.box(wx - v[0] * (0.01 + i * 0.005), yf + 2.45 - h2 / 2, wz - v[1] * (0.01 + i * 0.005), ns ? w2 : 0.02, h2, ns ? 0.02 : w2, 'bricks_2', 0xd8c49a, { glow: g, top: false, uv: 3.5 }));
        DRESS.push({ s: 'quad', flat: true, p: [r2(gcx(x) + v[0] * 0.9), r2(yf + 0.04), r2(gcz(y) + v[1] * 0.9)], size: [2.0, 2.0], key: 'urban:ConcreteStriped2c', tint: 0xffd8a0, glow: 0.12 }); }
    /* rubbish, stains and the odd rat in the bends (corners: two walls or more) */
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || FEET.has(x + ',' + y) || CHAN.has(x + ',' + y) || T[y][x] !== 'g' || taken.has(x + ',' + y)) continue;
        let walls = 0; D4.forEach(([dx, dy]) => { if (!open(x + dx, y + dy)) walls++; }); if (walls < 2) continue; const r = (x * 31 + y * 17) % 9;
        const pick = st.rubbish[r]; if (r < st.rubbish.length) { if (pick) A.dec(pick, x, y); else A.grime('grime', x, y, 1.6); } }
    /* THE TIMBER SETS (a mine): a post on a wall face every third square, its cap under the vault's spring */
    if (st.timber) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!isW(x, y) || T[y][x] !== 'g' || ((x + y) % 3)) continue; const s = A.wallSide(x, y); if (!s) continue;
        const v = DIR[s], yf = hAt(x, y), ns = s === 'n' || s === 's', px = gcx(x) + v[0] * 1.55, pz = gcz(y) + v[1] * 1.55;
        A.box(px, yf, pz, 0.3, 2.9, 0.3, 'wood_planks', 0x6a5238); A.box(px - v[0] * 0.2, yf + 2.9, pz - v[1] * 0.2, ns ? 3.4 : 0.6, 0.3, ns ? 0.6 : 3.4, 'wood_planks', 0x5a4430); k.timber++; }
    count['kit' + letter] = k; };
A.culverts = () => A.kit('W');
/* the manhole shaft over a door: a ladder up the rock, a grate high in the vault, daylight down it */
A.shaft = (x, y) => { const yf = hAt(x, y), top = ROOF[y][x];
    props.push({ key: 'manhole_ladder', x: gcx(x), z: r2(gz(y) + 0.5), face: 180, noBlock: true });
    props.push({ key: 'light_shaft', x: gcx(x), z: r2(gcz(y) - 0.6), noBlock: true, y: yf, scale: 1 });
    A.cyl(gcx(x), top - 0.3, gz(y) + 0.6, 0.9, 0.25, RUST, 0x2a2a2a);   // the grate's ring
    for (let i = -2; i <= 2; i++) A.box(gcx(x) + i * 0.3, top - 0.05, gz(y) + 0.6, 0.06, 0.06, 1.6, RUST, 0x1a1a1a);
    A.box(gcx(x), top - 0.1, gz(y) + 0.6, 1.4, 0.02, 1.4, null, 0xfff4d8, { glow: 1 }); };
/* a piece standing on the track (a car on its rails: the square is the rails', taken already) */
A.on = (key, x, y, o) => { if (!CAT[key]) { errs.push('not in the catalogue: ' + key); return; } if (!open(x, y)) { errs.push(key + ' off the open squares ' + x + ',' + y); return; } props.push(Object.assign({ key, x: gcx(x), z: gcz(y), noBlock: true }, o || {})); };
/* a torch (a real light: the room has few), on the nearest free square */
A.torch = (x, y) => { A.P('cave_torch', x, y, { near: true }); count.lights = (count.lights || 0) + 1; };
/* a real bulb (the room's few real lights), hung over a square */
A.bulb = (x, y) => { props.push({ key: 'bare_bulb', x: gcx(x), z: gcz(y), ceil: true, y: r2(Math.min(ROOF[y][x] - 1.4, hAt(x, y) + 3.9)), noBlock: true }); count.bulbs = (count.bulbs || 0) + 1; };
/* a name plate on the wall of a square's side: an enamel plate, two lines (drawn sign) */
A.plate = (x, y, s, t1, t2) => { const VV = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }; s = [s, 'n', 'w', 'e', 's'].find(q => !open(x + VV[q][0], y + VV[q][1])); if (!s) { errs.push('plate ' + t1 + ': no wall beside ' + x + ',' + y); return; } const v = VV[s];
    const yf = hAt(x, y), ns = s === 'n' || s === 's', px = gcx(x) + v[0] * 1.7, pz = gcz(y) + v[1] * 1.7;
    A.box(px, yf + 1.75, pz, ns ? 2.2 : 0.05, 0.7, ns ? 0.05 : 2.2, null, 0x1d3a5a);
    const ry = ({ n: 0, s: 180, w: 270, e: 90 })[s], q = (t, yy, h) => DRESS.push({ s: 'quad', p: [r2(px - v[0] * 0.04), r2(yy), r2(pz - v[1] * 0.04)], size: [2.0, h], ry, key: 'txt:' + t + '|#e8e4d8|#1d3a5a|' + r2(2.0 / h) + '||', uv: 'fit', kind: 'wall' });
    q(t1, yf + 1.92, 0.34); if (t2) q(t2, yf + 1.58, 0.22); };
/* the mains: four big pipes across a chamber's vault, on hangers, with a valve gallery under them */
A.mains = (x0, y0, x1, y1) => { const top = ROOF[y0][x0], xa = gx(x0), xb = gx(x1 + 1), zc = (gz(y0) + gz(y1 + 1)) / 2;
    /* (a square chamber's vault runs west-east: the mains run along it, under its crown, where the vault is highest) */
    [-2.6, -0.9, 0.9, 2.6].forEach((off, i) => { const t = 0.9 - (i % 2) * 0.25, py = top - 1.3 - t / 2 - (i % 2) * 0.3, pz = zc + off;
        A.box((xa + xb) / 2, py - t / 2, pz, xb - xa, t, t, RUST, [0x5a3622, 0x3e4a3a, 0x6a4a2a, 0x40403a][i], { uv: 3.5 });
        for (let x = xa + 1; x < xb - 0.5; x += 3.5) A.box(x, py - t / 2 - 0.08, pz, 0.2, t + 0.16, t + 0.16, RUST, 0x2a2420);
        for (let x = xa + 2.5; x < xb - 1; x += 7) A.box(x, py + t / 2, pz, 0.08, top - py, 0.08, RUST, 0x222222); }); };
DES.dress(A);

/* ── the walk check: every plot is reached from the spawn (a step of more than a ledge is crossed only by a climb, or down) ── */
const SP = DES.spawn; if (!open(SP[0], SP[1])) throw new Error('the spawn is not open');
{ const CL = {}; (PLAN.stairs || []).concat((PLAN.found || []).map(f => [f.from, f.to])).forEach(s => { const a = s[0].join(','), b = s[1].join(','); (CL[a] = CL[a] || []).push(s[1]); (CL[b] = CL[b] || []).push(s[0]); });
  const seen = new Uint8Array(W * H), st = [SP]; seen[SP[1] * W + SP[0]] = 1;
  while (st.length) { const [x, y] = st.pop(); const nb = D4.map(([dx, dy]) => [x + dx, y + dy]).filter(([X, Y2]) => open(X, Y2) && LV[Y2][X] <= LV[y][x] + 0.35).concat(CL[x + ',' + y] || []);
      nb.forEach(([X, Y2]) => { if (!seen[Y2 * W + X]) { seen[Y2 * W + X] = 1; st.push([X, Y2]); } }); }
  const cold = PL.filter(p => { for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (seen[(p.sy + j) * W + p.sx + i]) return false; return true; }).map(p => p.name);
  let un = 0, op = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (open(x, y) && T[y][x] !== 'w') { op++; if (!seen[y * W + x]) un++; }
  if (cold.length) errs.push('plots not reached from the spawn: ' + cold.join(', ')); Object.assign(count, { openSquares: op, unreached: un }); }
props.forEach(p => { if (!CAT[p.key]) errs.push('not in the catalogue: ' + p.key); });
if (errs.length) throw new Error('THE LABYRINTH: ' + errs.length + ' problem(s):\n  ' + errs.join('\n  '));

/* ── THE PAINT: one sheet a square ── */
const paint = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!open(x, y)) continue; const d = distOf(x, y); paint[y * W + x] = 1 + (T[y][x] === 'c' ? d.chamber : d.floor); }   // (a paint value k draws pal[k - 1]; 0 = the room's own floor: a district's `floor` / `chamber` index pal itself)

/* ── WRITE ── */
const VROWS = PL.map(p => ({ k: 'arch', id: 'lab:' + DES.part + ':' + p.id, x: r2(pox(p)), z: r2(poz(p)), rot: 0, y: 0, parts: PARTS[p.id] }));
const ROWS = F.concat(WATER, FALLS, climbs, VROWS, DRESS.length ? [{ k: 'arch', id: 'lab:' + DES.part + ':dress', x: 0, z: 0, rot: 0, y: 0, parts: DRESS }] : []);
const TOP = Math.max.apply(null, ROOF.map(r => Math.max.apply(null, r))), SH = Math.ceil(TOP + 3), SPY = hAt(SP[0], SP[1]);
const MK = DES.marker, L = [];
L.push('        /* ' + MK + '-BEGIN — THE UNDERGROUND LABYRINTH (world polish thread 10, 2026-11-20): written by `node bake-labyrinth.js ' + DESF + '` from ' + 'the approved plan + the room design. Never hand-edit between the markers. */');
L.push('        ' + DES.room + ': {');
L.push("            label: '" + DES.label.replace(/'/g, "\\'") + "',");
L.push("            sub: '" + DES.sub.replace(/'/g, "\\'") + "',");
L.push("            kind: 'box', site: '" + DES.site + "', part: '" + DES.part + "',");
if (DES.world) L.push('            world: ' + J(DES.world) + ',');
L.push('            shell: hqSewerShell({ w: ' + W * C + ', d: ' + H * C + ', h: ' + SH + ', wallH: ' + SH + ', plate: { x: ' + gcx(SP[0]) + ', z: ' + gcz(SP[1]) + ', y: ' + r2(SPY + 3.2) + ' },');
L.push('                                  mood: { lamp: 0xbfe8b0, glow: 0x9fd0a0, strip: 0xd8f0c8, light: 0xcfe8c0, ambient: 0.13 }, wallColor: 0x4e4a44, floorColor: 0x6c6e6a }),   // (no fog of its own: THE ONE AIR, mondo 11-20)');
L.push("            parti: '" + DES.parti.replace(/'/g, "\\'") + "',");
L.push("            typology: 'grid',");
L.push('            plots: { cell: ' + C + ', plot: ' + N * C + ', nx: ' + PX + ', nz: ' + PY + ', mask: ' + J(Array.from({ length: PY }, (_, r) => Array.from({ length: PX }, (_, c) => plotAt[c + ',' + r] ? '#' : '.').join(''))) + ', names: ' + J(PL.map(p => [p.id, p.name, p.d, p.level])) + ', districts: ' + J(Object.fromEntries(Object.keys(DES.districts).map(k => [k, DES.districts[k].name]))) + ' },');
L.push('            terrain: {');
L.push("                res: 0.875, floor: '" + DES.pal[0] + "', cliff: 'bricks_2', path: 'urban:RubberNonSlip3a',");
L.push('                noise: { amp: 0, scale: 5 }, crag: false,');
L.push("                waterLook: { water: 'sewer_water', deep_water: 'sewer_deep' },");
L.push("                paint: { pal: " + J(DES.pal) + ", t: 'u8', res: " + C + ', x0: ' + gcx(0) + ', z0: ' + gcz(0) + ', nx: ' + W + ', nz: ' + H + ", d: '" + Buffer.from(paint).toString('base64') + "' },");
L.push('                /* every square that is not a `space` is the wall, brick to the roof */');
L.push("                gen: { kind: 'plan', look: 'walls', wallKey: 'bricks_2', rim: 0, forceGrow: -0.3, noRescue: true },");
L.push('                features: [');
ROWS.forEach(f => L.push('                    ' + J(f) + ','));
L.push('                ],');
L.push('            },');
L.push('            doors: [');
doors.forEach(d => L.push('                ' + J(d) + ','));
L.push('            ],');
L.push('            counters: [],');
L.push('            props: [');
for (let i = 0; i < props.length; i += 4) L.push('                ' + props.slice(i, i + 4).map(J).join(', ') + ',');
L.push('            ],');
L.push('            agents: [],');
L.push('            npcSpots: ' + J(npc) + ',');
L.push('            onlineSpots: [],');
L.push('            lines: ' + J(DES.lines || []) + ',');
L.push('            spawn: { x: ' + gcx(SP[0]) + ', z: ' + gcz(SP[1]) + ', face: ' + (DES.spawnFace || 0) + ' },');
L.push('        },');
L.push('        /* ' + MK + '-END */');
const block = L.join('\n') + '\n';
Object.assign(count, { features: ROWS.length, props: props.length, natives: npc.length, decals: DECALS.length, drawnParts: DRESS.length, roofTop: TOP, levels: [BASE, Math.max.apply(null, PL.map(p => p.level))] });
console.log(DES.room + ': ' + JSON.stringify(count));
if (DRY) process.exit(0);
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const ENDM = '        /* ' + MK + '-END */\n', b0 = src.indexOf('        /* ' + MK + '-BEGIN'), b1 = src.indexOf(ENDM);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + ENDM.length);
else { const a = src.indexOf('        /* SEWERS24-BEGIN'); if (a < 0) throw new Error('anchor (SEWERS24-BEGIN) not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
/* `replaces: '<marker>'`: the room this one takes the place of (same id) is written between that marker's BEGIN / END: it goes, with its decal row */
if (DES.replaces) { const R0 = src.indexOf('        /* ' + DES.replaces + '-BEGIN'), RE = '        /* ' + DES.replaces + '-END */\n', R1 = src.indexOf(RE);
    if (R0 >= 0 && R1 > R0) { src = src.slice(0, R0) + src.slice(R1 + RE.length); console.log('removed the old block ' + DES.replaces); }
    src = src.split('\n').filter(l => l.indexOf(DES.replaces + '-DECALS') < 0).join('\n'); }
/* the link rows' ends in this room: wall / x / z / face / y rewritten in place (the rest of the row, its plate and its verb, stays) */
Object.keys(LINKENDS).forEach(id => { const e = LINKENDS[id], a = src.indexOf("{ id: '" + id + "'"); if (a < 0) throw new Error('data.js: no link row ' + id);
    const tag = "part: '" + DES.part + "', ", k = src.indexOf(tag, a); if (k < 0 || k - a > 1500) throw new Error('data.js: link ' + id + ' has no end in part ' + DES.part);
    const rest = src.slice(k + tag.length), m = /^wall: '[a-z]+'(, x: -?[\d.]+)?(, z: -?[\d.]+)?(, face: -?\d+)?(, y: -?[\d.]+)?/.exec(rest); if (!m) throw new Error('data.js: link ' + id + ': cannot read its end');
    const w = "wall: '" + e.wall + "'" + (e.x != null ? ', x: ' + e.x : '') + (e.z != null ? ', z: ' + e.z : '') + (e.face != null ? ', face: ' + e.face : '') + ', y: ' + e.y;
    src = src.slice(0, k + tag.length) + w + rest.slice(m[0].length); console.log('link ' + id + ': ' + w); });
{ const tag = MK + '-DECALS'; src = src.split('\n').filter(l => l.indexOf(tag) < 0).join('\n');
  const a = src.indexOf('DOOR_HQ.decals = {\n'); if (a < 0) throw new Error('DOOR_HQ.decals not found'); const at = a + 'DOOR_HQ.decals = {\n'.length;
  src = src.slice(0, at) + '    ' + DES.room + ': ' + J(DECALS.slice(0, 60)) + ',   // ' + tag + ': written by bake-labyrinth.js\n' + src.slice(at); }
fs.writeFileSync(file, src);
console.log('wrote ' + DES.room + ' into data.js (' + Math.round(block.length / 1024) + ' KB)');
