#!/usr/bin/env node
// grow-room.js — THE BIG SQUARES (2026-10-28, mondo: "2x everywhere"): blows a site's arena room up K times (default 2) so every
// arena size fits on HQ_ARENA_RULES.squareDefault squares (3.5 m = 2 × the 1.75 m battle tile) with the same squares as before.
//
// It rewrites the NUMBERS in data.js in place (every comment and every other character stays): the room's layout grows about its
// centre — the room's w / d, every space / hall / path / tier / flight / span / rail / wall line / pool / hill / dip / grove / board
// position and its footprint, the doors, the props', the people's, the counters' and the spawn's x / z, the plaza, the entry door,
// the link doors on its walls (`{ site, part, wall, x | z }`), its marker (HQ_AREA_MARKERS) and its find spots (DOOR_HQ.findSpots).
// What stays REAL SIZE: every height (h, h0 / h1, y, depth — a battle level stays 1.75 m of the room, THE TIER RULE), a tier's edge
// blend, a thin wall's thickness (< 1 m; a wall a square thick — the Dutchman's crate blocks — grows with its square), a tree's
// trunk, a prop's own size, the scatter / grove counts, a ladder's width. A `rooms` floor plan (the generator's clearings and rows)
// gets `gen.grow: K` — the generator lays the same plan with the same dice and draws it grown (data.js _hqTGenerate). The spec is
// stamped `grown: K` and the tool refuses a stamped room. The site's HQ_ROOM_HOLES row is dropped (rerun bake-holes.js for the
// room) and its arena picks stand until bake-arenas.js re-cuts them.
//
// After writing, it reloads data.js and checks the grown room equals the old room grown by the same rules (the derived rows
// hqAreaRoom adds — the bay door's track, the default spawn and plate — are the only differences allowed) and prints the 3.5 m
// lattice of the grown room against the 1.75 m lattice of the old one (cells that changed: walkable, level).
//
//   node grow-room.js prebuilt_lodge [prebuilt_saturn …] [--k 2] [--dry-run]
//   then: node bake-holes.js <roomId…>   and   node bake-arenas.js [--size N] <sites…>
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadGameData } = require('./load-data.js');

const DATA = path.join(__dirname, 'data.js');
const DRY = process.argv.includes('--dry-run');
const argAfter = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const K = +(argAfter('--k') || 2);
const TARGETS = process.argv.slice(2).filter(a => /^(prebuilt_|site_prebuilt_)/.test(a));
if (!TARGETS.length || !(K > 0)) { console.error('usage: node grow-room.js <prebuilt_site | site room id…> [--k 2] [--dry-run]'); process.exit(1); }

/* ── a tiny parser for the data literal subset (objects, arrays, numbers, strings, identifiers, calls) — keeps every offset ── */
function parseAt(src, at) {
    let i = at;
    const ws = () => {
        for (;;) {
            while (i < src.length && /\s/.test(src[i])) i++;
            if (src.startsWith('//', i)) { while (i < src.length && src[i] !== '\n') i++; continue; }
            if (src.startsWith('/*', i)) { const e = src.indexOf('*/', i + 2); if (e < 0) throw new Error('open comment at ' + i); i = e + 2; continue; }
            return;
        }
    };
    const fail = (m) => { throw new Error(m + ' at ' + i + ': ' + JSON.stringify(src.slice(i, i + 60))); };
    const value = () => {
        ws();
        const c = src[i], s0 = i;
        if (c === '{') {
            i++; const props = [];
            for (;;) {
                ws(); if (src[i] === '}') { i++; break; }
                let key;
                if (src[i] === "'" || src[i] === '"') key = str().value;
                else { const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(i, i + 80)); if (!m) fail('key'); key = m[0]; i += key.length; }
                ws(); if (src[i] !== ':') fail('colon'); i++;
                const v = value(); props.push({ key, value: v });
                ws(); if (src[i] === ',') { i++; continue; } if (src[i] === '}') { i++; break; } fail('object');
            }
            return { type: 'obj', props, start: s0, end: i };
        }
        if (c === '[') {
            i++; const items = [];
            for (;;) {
                ws(); if (src[i] === ']') { i++; break; }
                items.push(value());
                ws(); if (src[i] === ',') { i++; continue; } if (src[i] === ']') { i++; break; } fail('array');
            }
            return { type: 'arr', items, start: s0, end: i };
        }
        if (c === "'" || c === '"' || c === '`') return str();
        const m = /^-?(0x[0-9a-fA-F]+|\d+\.?\d*(e[-+]?\d+)?|\.\d+)/.exec(src.slice(i, i + 40));
        if (m) { i += m[0].length; return { type: 'num', value: Number(m[0]), start: s0, end: i }; }
        const id = /^[A-Za-z_$][\w$.]*/.exec(src.slice(i, i + 80));
        if (id) {
            i += id[0].length; ws();
            if (src[i] === '(') {
                i++; const args = [];
                for (;;) { ws(); if (src[i] === ')') { i++; break; } args.push(value()); ws(); if (src[i] === ',') { i++; continue; } if (src[i] === ')') { i++; break; } fail('call'); }
                return { type: 'call', callee: id[0], args, start: s0, end: i };
            }
            return { type: 'id', name: id[0], start: s0, end: i };
        }
        fail('value');
    };
    const str = () => {
        const q = src[i], s0 = i; i++;
        let out = '';
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') { out += src[i + 1]; i += 2; } else out += src[i++]; }
        i++; return { type: 'str', value: out, start: s0, end: i };
    };
    return value();
}
const prop = (o, k) => (o && o.type === 'obj') ? (o.props.find(p => p.key === k) || null) : null;

/* ── THE RULES: which numbers grow (one table, read by the text rewrite and by the check) ── */
const XZ = new Set(['x', 'z', 'x0', 'z0', 'x1', 'z1']);
const FEAT_SIZE = new Set(['w', 'd', 'r', 'rz', 'cell', 'bank']);
const SPOT_LISTS = new Set(['npcSpots', 'counters', 'doors', 'agents', 'onlineSpots']);
/* ctx + key → 'k' (grow), a child ctx ('@ctx' an object, '[]ctx' a list of objects), 'pts', or null (stays) */
function rule(ctx, key, feat) {
    switch (ctx) {
        case 'room':
            if (key === 'w' || key === 'd' || key === 'plazaR') return 'k';
            if (key === 'plaza' || key === 'marker' || key === 'spawn') return '@spot';
            if (key === 'features') return '[]feature';
            if (key === 'props') return '[]prop';
            if (SPOT_LISTS.has(key)) return '[]spot';
            if (key === 'variants') return '{}variant';
            if (key === 'gen') return '@gen';
            if (key === 'shell') return '@shell';
            if (key === 'terrain') return '@room';
            if (key === 'float') return '@float';
            return null;
        case 'shell': if (key === 'w' || key === 'd') return 'k'; if (key === 'plate') return '@spot'; return null;
        case 'variant': if (key === 'add') return '[]prop'; if (key === 'npcSpots') return '[]spot'; return null;
        case 'prop': return (key === 'x' || key === 'z') ? 'place' : null;   // THE PROPS: placed by placeProps (a group moves as one, a prop at a wall keeps its gap)
        case 'spot': return XZ.has(key) ? 'k' : null;
        case 'gen': if (key === 'open' || key === 'solid') return '[]disc'; return null;
        case 'disc': return (XZ.has(key) || key === 'r' || key === 'w') ? 'k' : null;
        case 'float': return key === 'hull' ? '@hull' : null;
        case 'hull': return (key === 'bow' || key === 'stern') ? 'k' : null;
        case 'arc': return (key === 'x' || key === 'z' || key === 'r') ? 'k' : null;
        case 'feature': {
            const k = feat && feat.k;
            if (XZ.has(key)) return 'k';
            if (key === 'pts') return 'pts';
            if (key === 'arc') return '@arc';
            if (key === 'gaps') return 'gaps';
            if (key === 't') return (k === 'wall' && feat.t >= 1) ? 'k' : null;   // a wall a square thick (a crate block) grows with its square
            if (FEAT_SIZE.has(key)) { if (k === 'tree' || k === 'climb') return null; return 'k'; }
            return null;
        }
    }
    return null;
}

/* ── THE PROPS: a prop is real size, so its place is not simply ×K — a GROUP (props within `link` m of each other at one height, or a
   thing standing on a table) moves as one piece (a table keeps its candle, a rail run its posts, a pile its boxes), and a group with a
   prop at a wall, a tier's edge or a drop (within `hug` m of it, per axis) keeps that prop's gap to it while the wall moves out ── */
const LINK = 1.3, HUG = 1.0;
const PLACE = new Map();   // tag (roomId|list path) → [[x, z] | null per prop]
function placeProps(tag, list, room, info) {
    const S = room.shell || {}, box = !info;
    const items = (list || []).map((p, i) => ({ i, p, x: +p.x, z: +p.z, y: +p.y || 0 })).filter(o => typeof o.p.x === 'number' && typeof o.p.z === 'number' && !o.p.wall && !o.p.ceil);
    /* the groups (union-find) */
    const par = items.map((_, i) => i), find = (i) => par[i] === i ? i : (par[i] = find(par[i]));
    for (let a = 0; a < items.length; a++) for (let b = a + 1; b < items.length; b++) {
        const A = items[a], B = items[b];
        if (Math.hypot(A.x - B.x, A.z - B.z) <= LINK && Math.abs(A.y - B.y) <= 0.3) par[find(a)] = find(b);
    }
    /* a thing standing on a table / a counter / a crate rides with the nearest one under it (within 2.5 m, 0.3..1.6 m lower) */
    items.forEach((A, a) => {
        let best = -1, bd = 2.5;
        items.forEach((B, b) => { const dy = A.y - B.y, d = Math.hypot(A.x - B.x, A.z - B.z); if (b !== a && dy >= 0.3 && dy <= 1.6 && d <= bd) { bd = d; best = b; } });
        if (best >= 0) par[find(a)] = find(best);
    });
    /* the gap to the nearest wall / edge / drop along ±x and ±z (box room: the shell's walls; terrain: the walker's ground) */
    const gapOf = (o) => {
        const g = { px: Infinity, nx: Infinity, pz: Infinity, nz: Infinity };
        if (box) { g.px = S.w / 2 - o.x; g.nx = S.w / 2 + o.x; g.pz = S.d / 2 - o.z; g.nz = S.d / 2 + o.z; return g; }
        const y0 = sbFn('hqTerrainHeight')(info, o.x, o.z);
        const blocked = (x, z) => { const f = sbFn('hqTerrainFeet')(info, x, z, null); if (f == null) return true; return Math.abs(sbFn('hqTerrainHeight')(info, x, z) - y0) > 0.4; };
        if (blocked(o.x, o.z)) return g;   // a prop standing in the solid (a wall shelf's box, a prop on a wall): no gap rule
        for (const [k, dx, dz] of [['px', 1, 0], ['nx', -1, 0], ['pz', 0, 1], ['nz', 0, -1]]) for (let d = 0.05; d <= HUG + 1e-6; d += 0.05) if (blocked(o.x + dx * d, o.z + dz * d)) { g[k] = d - 0.025; break; }
        return g;
    };
    const out = (list || []).map(p => (typeof p.x === 'number' && typeof p.z === 'number') ? [r4(p.x * K), r4(p.z * K)] : null);
    const groups = new Map();
    items.forEach((o, j) => { const r = find(j); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(o); });
    for (const G of groups.values()) {
        G.forEach(o => { o.g = gapOf(o); });
        const cx = G.reduce((a, o) => a + o.x, 0) / G.length, cz = G.reduce((a, o) => a + o.z, 0) / G.length;
        /* per axis: the member nearest a wall on that axis (within HUG) sets the move, else the group's centre grows ×K */
        const axis = (pk, nk, key, c) => {
            let best = null;
            for (const o of G) for (const [k, s] of [[pk, 1], [nk, -1]]) if (o.g[k] <= HUG && (!best || o.g[k] < best.gap)) best = { gap: o.g[k], s, v: o[key] };
            if (!best) return (K - 1) * c;
            const wall = best.v + best.s * best.gap;   // the wall's point, then the wall grown, then back off by the same gap
            return (K * wall - best.s * best.gap) - best.v;
        };
        const dx = axis('px', 'nx', 'x', cx), dz = axis('pz', 'nz', 'z', cz);
        G.forEach(o => { out[o.i] = [r4(o.x + dx), r4(o.z + dz)]; });
    }
    PLACE.set(tag, out);
    return out;
}
let sbFn = null;

/* ── the check's side: grow an evaluated room by the same rules ── */
const r4 = v => Math.round(v * 10000) / 10000;
function growObj(o, ctx, tag) {
    if (!o || typeof o !== 'object') return o;
    const out = Array.isArray(o) ? o.slice() : Object.assign({}, o);
    for (const key of Object.keys(out)) {
        const R = rule(ctx, key, o), v = out[key];
        if (!R) continue;
        if (R === 'k' && typeof v === 'number') out[key] = r4(v * K);
        else if (R === 'place') { /* set by the list below */ }
        else if (R === 'pts' && Array.isArray(v)) out[key] = v.map(p => Array.isArray(p) ? [r4(p[0] * K), r4(p[1] * K)].concat(p.slice(2)) : p);
        else if (R === 'gaps' && Array.isArray(v)) out[key] = v.map(g => Array.isArray(g) ? g.map(n => r4(n * K)) : g);
        else if (R[0] === '@') out[key] = growObj(v, R.slice(1), tag + '.' + key);
        else if (R.startsWith('{}') && v && typeof v === 'object') { const o2 = {}; Object.keys(v).forEach(n => { o2[n] = growObj(v[n], R.slice(2), tag + '.' + key + '.' + n); }); out[key] = o2; }
        else if (R.startsWith('[]') && Array.isArray(v)) {
            const pl = (R === '[]prop') ? PLACE.get(tag + '.' + key) : null;
            out[key] = v.map((e, i) => { const g = growObj(e, R.slice(2), tag + '.' + key + '.' + i); if (pl && pl[i]) { g.x = pl[i][0]; g.z = pl[i][1]; } return g; });
        }
    }
    if (ctx === 'gen' && out.kind === 'rooms') out.grow = r4((+o.grow || 1) * K);
    return out;
}

/* ── the text side: every number edit for a parsed node ── */
function editsOf(node, ctx, src, edits, tag) {
    if (!node) return;
    if (node.type === 'call') {
        if (node.callee === 'hqRingPts' && ctx === 'pts') { node.args.slice(0, 3).forEach(a => numEdit(a, src, edits)); return; }
        if ((node.callee === 'hqRanchShell' || node.callee === 'hqAstralShell') && node.args[0]) { editsOf(node.args[0], 'shell', src, edits, tag); return; }
        throw new Error('a call the tool does not know: ' + node.callee + ' (' + ctx + ')');
    }
    if (ctx === 'pts') {
        if (node.type !== 'arr') throw new Error('pts that are not a list at ' + node.start);
        node.items.forEach(p => { if (p.type !== 'arr') throw new Error('a point that is not [x, z] at ' + p.start); numEdit(p.items[0], src, edits); numEdit(p.items[1], src, edits); });
        return;
    }
    if (ctx === 'gaps') { node.items.forEach(g => g.items.forEach(n => numEdit(n, src, edits))); return; }
    if (node.type !== 'obj') return;
    const plain = {};   // the row's own plain values (k, t) for the rule
    node.props.forEach(p => { if (p.value.type === 'str') plain[p.key] = p.value.value; else if (p.value.type === 'num') plain[p.key] = p.value.value; });
    node.props.forEach(p => {
        const R = rule(ctx, p.key, plain);
        if (!R) return;
        if (R === 'k') numEdit(p.value, src, edits);
        else if (R === 'place') { /* the list sets it */ }
        else if (R === 'pts') editsOf(p.value, 'pts', src, edits, tag);
        else if (R === 'gaps') editsOf(p.value, 'gaps', src, edits, tag);
        else if (R[0] === '@') editsOf(p.value, R.slice(1), src, edits, tag + '.' + p.key);
        else if (R.startsWith('{}')) { if (p.value.type === 'obj') p.value.props.forEach(q => editsOf(q.value, R.slice(2), src, edits, tag + '.' + p.key + '.' + q.key)); }
        else if (R.startsWith('[]')) {
            if (p.value.type !== 'arr') throw new Error(p.key + ' is not a list');
            const pl = (R === '[]prop') ? PLACE.get(tag + '.' + p.key) : null;
            if (R === '[]prop' && !pl) throw new Error('no placement for ' + tag + '.' + p.key);
            p.value.items.forEach((e, i) => {
                editsOf(e, R.slice(2), src, edits, tag + '.' + p.key + '.' + i);
                if (pl && pl[i] && e.type === 'obj') ['x', 'z'].forEach((k, a) => { const q = prop(e, k); if (!q || q.value.type !== 'num') throw new Error('a prop with no number ' + k); edits.push({ at: q.value.start, del: q.value.end - q.value.start, text: String(pl[i][a]) }); });
            });
        }
    });
    if (ctx === 'gen' && plain.kind === 'rooms') {
        const g = prop(node, 'grow');
        if (g) numEdit(g.value, src, edits); else edits.push({ at: lastPropEnd(node), del: 0, text: ', grow: ' + K });
    }
}
function numEdit(n, src, edits) {
    if (!n || n.type !== 'num') throw new Error('a number the tool cannot grow at ' + (n && n.start) + ': ' + (n ? JSON.stringify(src.slice(n.start, n.end)) : 'missing'));
    const v = r4(n.value * K);
    edits.push({ at: n.start, del: n.end - n.start, text: String(v) });
}
function lastPropEnd(obj) { const p = obj.props[obj.props.length - 1]; return p.value.end; }

/* ── the run ── */
let src = fs.readFileSync(DATA, 'utf8');
const sb0 = loadGameData({ quiet: true });
const ev0 = (s) => vm.runInContext(s, sb0);
sbFn = (n) => sb0[n];
const SPECS = ev0('HQ_AREA_SPECS'), ENTRY = ev0('DOOR_HQ.siteRooms.entry'), ROOMS0 = ev0('DOOR_HQ.rooms');
const edits = [];
const before = {};
const findLine = (re, from, to) => { re.lastIndex = from || 0; const m = re.exec(src); return (m && (to == null || m.index < to)) ? m : null; };
const blockOf = (name) => { const a = src.indexOf(name); if (a < 0) throw new Error('no ' + name); return a; };

for (const target of TARGETS) {
    const isRoom = !!ROOMS0[target] && !ENTRY[target];
    const roomId = isRoom ? target : (ENTRY[target] && ENTRY[target].room);
    if (!roomId) throw new Error(target + ': no entry room');
    const room = ROOMS0[roomId], site = room && room.site;
    if (!room) throw new Error(target + ': no room ' + roomId);
    before[roomId] = { target, room: JSON.parse(JSON.stringify(room)) };
    /* the room's source: the area spec (HQ_AREA_SPECS.<site>, the entry part) or the hand-written box room (DOOR_HQ.rooms.<roomId>) */
    let node = null, isSpec = false;
    const specAt = blockOf('const HQ_AREA_SPECS = {');
    const mBox = findLine(new RegExp('^        ' + roomId + ': \\{', 'gm'));
    if (mBox && mBox.index < specAt) node = parseAt(src, mBox.index + mBox[0].length - 1);
    else {
        const mSpec = findLine(new RegExp('^    ' + site + ': \\{ part:', 'gm'), specAt);
        if (mSpec && SPECS[site] && SPECS[site].part === room.part) { node = parseAt(src, mSpec.index + mSpec[0].length - '{ part:'.length); isSpec = true; }
    }
    if (!node) throw new Error(target + ': no source for ' + roomId);
    if (prop(node, 'grown')) { console.error(roomId + ': already grown (grown: ' + src.slice(prop(node, 'grown').value.start, prop(node, 'grown').value.end) + ') — refused'); process.exit(1); }
    /* the props' places, from the room as it stands (its compiled ground for a terrain room) */
    const info = room.terrain ? sb0.hqTerrainInfo(roomId) : null;
    placeProps(roomId + '.props', room.props, room, info);
    Object.keys(room.variants || {}).forEach(n => { const v = room.variants[n]; if (v && v.add) placeProps(roomId + '.variants.' + n + '.add', v.add, room, info); });
    const n0 = edits.length;
    editsOf(node, 'room', src, edits, roomId);
    /* an area spec without a plaza radius: the plaza's open disc grows too (HQ_AREA_RULES.plazaR) */
    if (isSpec && !prop(node, 'plazaR') && prop(node, 'plaza')) edits.push({ at: prop(node, 'plaza').value.end, del: 0, text: ', plazaR: ' + r4(ev0('HQ_AREA_RULES.plazaR') * K) });
    edits.push({ at: node.start + 1, del: 0, text: ' grown: ' + K + ',' });   // the stamp (THE BIG SQUARES)
    /* the entry door (DOOR_HQ.siteRooms.entry.<site>.door) */
    let ent = false;
    if (ENTRY[site] && ENTRY[site].room === roomId) {
        const mEnt = findLine(new RegExp("^ +" + site + ": +\\{ room: '" + roomId + "'", 'gm'), blockOf('siteRooms: {'));
        if (!mEnt) throw new Error(roomId + ': no entry row');
        editsOf(prop(parseAt(src, src.indexOf('{', mEnt.index)), 'door').value, 'spot', src, edits, '');
        ent = true;
    }
    /* the link doors on its walls: { site: '<site>', part: '<part>', … } */
    const reLink = new RegExp("\\{ site: '" + site + "', part: '" + room.part + "'", 'g'); let m, links = 0;
    while ((m = reLink.exec(src))) { editsOf(parseAt(src, m.index), 'spot', src, edits, ''); links++; }
    /* its marker (HQ_AREA_MARKERS) and its find spots (DOOR_HQ.findSpots) */
    const mkAt = blockOf('const HQ_AREA_MARKERS = {');
    const mk = findLine(new RegExp('^    ' + roomId + ': \\{', 'gm'), mkAt, mkAt + 20000);
    if (mk) editsOf(parseAt(src, src.indexOf('{', mk.index)), 'spot', src, edits, '');
    const fsAt = blockOf('DOOR_HQ.findSpots = {');
    const mf = findLine(new RegExp('^    ' + roomId + ': +\\{', 'gm'), fsAt, fsAt + 40000);
    if (mf) { const fN = parseAt(src, src.indexOf('{', mf.index)); fN.props.forEach(p => editsOf(p.value, 'spot', src, edits, '')); }
    /* its baked gaps (HQ_ROOM_HOLES, on the old squares): dropped — bake-holes.js <roomId> rebakes them */
    const mh = findLine(new RegExp('^    "' + roomId + '": \\[.*\\n', 'gm'), blockOf('<ROOM HOLES>'));
    if (mh) edits.push({ at: mh.index, del: mh[0].length, text: '' });
    console.log(roomId + ': ' + (edits.length - n0) + ' edits' + (ent ? ', entry door' : '') + ', ' + links + ' link door(s)' + (mk ? ', marker' : '') + (mf ? ', find spots' : '') + (mh ? ', gaps dropped' : ''));
}

/* apply (back to front; no two edits may overlap) */
edits.sort((a, b) => b.at - a.at);
for (let j = 1; j < edits.length; j++) if (edits[j].at + edits[j].del > edits[j - 1].at && edits[j].del) throw new Error('overlapping edits at ' + edits[j].at);
for (const e of edits) src = src.slice(0, e.at) + e.text + src.slice(e.at + e.del);
if (DRY) { console.log('dry run: nothing written'); process.exit(0); }
fs.writeFileSync(DATA, src);

/* ── the check ── */
const sb1 = loadGameData({ quiet: true });
const ev1 = (s) => vm.runInContext(s, sb1);
const DERIVED = (path) => /^terrain\.features\.0\./.test(path) || /^spawn\./.test(path) || /^shell\.plate\./.test(path) || /^counters\.\d+\.(radius|plateY)$/.test(path) || path === 'grown';
function diff(a, b, p, out) {
    if (typeof a === 'number' && typeof b === 'number') { if (Math.abs(a - b) > 0.011) out.push(p + ': ' + a + ' ≠ ' + b); return; }
    if (a && b && typeof a === 'object' && typeof b === 'object') { for (const k of new Set(Object.keys(a).concat(Object.keys(b)))) { if (k[0] === '_') continue; diff(a[k], b[k], p ? p + '.' + k : k, out); } return; }
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push(p + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b));
}
let bad = 0;
for (const roomId of Object.keys(before)) {
    const { room } = before[roomId];
    const want = growObj(room, 'room', roomId), got = JSON.parse(JSON.stringify(ev1('DOOR_HQ.rooms')[roomId]));
    const out = []; diff(want, got, '', out);
    const real = out.filter(l => !DERIVED(l.split(':')[0]));
    console.log('\n' + roomId + ': the grown room ' + (real.length ? 'DIFFERS from the rules in ' + real.length + ' place(s)' : 'matches the rules') + (out.length - real.length ? ' (' + (out.length - real.length) + ' derived row(s) differ, allowed)' : ''));
    real.slice(0, 30).forEach(l => console.log('   ' + l));
    bad += real.length;
    const moved = (PLACE.get(roomId + '.props') || []).filter((q, i) => q && room.props[i] && (Math.abs(q[0] - room.props[i].x * K) > 0.01 || Math.abs(q[1] - room.props[i].z * K) > 0.01)).length;
    console.log('   props: ' + moved + ' of ' + (room.props || []).length + ' kept with their group or their wall (the rest ×' + K + ')');
    /* the lattice: the grown room on K × 1.75 m squares against the old room on 1.75 m squares */
    const C = 1.75;
    const L0 = sb0.hqFieldLattice(roomId, false, C), L1 = sb1.hqFieldLattice(roomId, false, C * K);
    if (!L0 || !L1 || !L0.info.cells || !L1.info.cells) { console.log('   (no lattice to compare)'); continue; }
    const ox = Math.round((L0.x0 * K - L1.x0) / (C * K)), oz = Math.round((L0.z0 * K - L1.z0) / (C * K));
    const sig = (L, x, y) => { const c = L.info.cells[y] && L.info.cells[y][x]; if (!c || c.hole) return '#';
        return c.in ? 'L' + Math.round((c.top || 0) / 1.75) + (c.deck ? 'd' : '') + (c.fluid ? 'w' : '') : (c.hazard ? 'H' + c.fluid : '#'); };
    let same = 0, walk = 0, lvl = 0; const bads = [];
    for (let y = 0; y < L0.h; y++) for (let x = 0; x < L0.w; x++) {
        const x1 = x + ox, y1 = y + oz; if (x1 < 0 || y1 < 0 || x1 >= L1.w || y1 >= L1.h) continue;
        const a = sig(L0, x, y), b = sig(L1, x1, y1);
        if (a === b) same++; else { if ((a[0] === 'L') !== (b[0] === 'L')) walk++; else lvl++; if (bads.length < 12) bads.push(x1 + ',' + y1 + ' ' + a + '→' + b); }
    }
    console.log('   lattice ' + L0.w + '×' + L0.h + ' @1.75 → ' + L1.w + '×' + L1.h + ' @' + (C * K) + ': ' + same + ' squares the same, ' + walk + ' walkable changed, ' + lvl + ' level / kind changed');
    if (bads.length) console.log('   e.g. ' + bads.join('  '));
}
console.log(bad ? '\n' + bad + ' difference(s) — read them before baking' : '\nnext: node bake-holes.js <roomId…>, then node bake-arenas.js [--size N] <sites…>');
