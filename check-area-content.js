#!/usr/bin/env node
// check-area-content.js — THE CONTENT AUDIT (AREA_CONTENT_PLAN.md §2 / §3, 2026-09-19; D1 grew R2 / R3 / R5 / R6 / R8):
// how much of a box / terrain room is CLIMB, how far the eye is ever from a PULL, how EXPOSED its doors are, which exits
// are EARNED and whether each is TEASED, its parti + typology, and how dense its content is. Read-only; prints a table per
// room, the offenders per rule and the family averages the plan's rules are set against. area-content.test.js holds the
// rules as WARNINGS (a printed list, never a red) until D3 brings the areas up to them. Usage:
//   node check-area-content.js [--json] [--all] [--rules] [roomId …]     (default: the explorable parts — rooms with a site)
'use strict';
const { loadGameData } = require('./load-data');

/* THE RULES' NUMBERS (AREA_CONTENT_PLAN §3 — the user's decision 2026-09-19: the cave's numbers stand; warnings until D3) */
const RULES = {
    R1: { per100Open: 0.6, per100Closed: 0.8, kinds: 3, rangeOpen: 6, rangeClosed: 4 },
    R2: { pull: 50 },                       // no reachable node farther than this (m) from a pull
    R3: { exposed: 1, gap: 12, onWall: 3 },  // other doors in a clear line from a landing; two doors on a wall ≥ 12 m apart; never three
    R4: { earned: 1, share: 1 / 3 },
    R5: { tease: true },
    R7: { city: [200, 160], open: [60, 50] },
    R8: { per: 60 },                        // ≥ 1 prop / native per 60 m² of open floor
};
const CLIMB = ['ramp', 'plateau', 'deck', 'wall', 'climb'];
const EYE = 1.6, TALL = 3.0;

function loadOnce() { if (!loadOnce.D) loadOnce.D = loadGameData(); return loadOnce.D; }

/* a straight line at eye height over a terrain field: blocked by the ground, a wall's top, a plan's mass, a tree */
function losTerrain(D, info, ax, az, ay, bx, bz, by) {
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); if (L < 0.01) return true;
    const n = Math.max(2, Math.ceil(L / 0.5));
    for (let i = 1; i < n; i++) {
        const t = i / n, x = ax + dx * t, z = az + dz * t, y = ay + (by - ay) * t;
        if (D.hqTerrainHeight(info, x, z) > y) return false;
        const w = D.hqTerrainWallAt(info, x, z, 0); if (w && w.top > y) return false;
        if (D.hqTerrainSolidAt(info, x, z, 0) && D.hqTerrainSolidTop(info, x, z) > y) return false;
        for (const tr of info.trees) if (Math.hypot(tr.x - x, tr.z - z) < (tr.r || 0.4) + 0.3 && (tr.y || 0) + (tr.h || 2.6) > y) return false;
        for (const tr of info.thicket || []) if (Math.hypot(tr.x - x, tr.z - z) < (tr.r || 0.42) + 0.3 && (tr.y || 0) + (tr.h || 2.6) > y) return false;
    }
    return true;
}
/* a straight line at eye height across a box room: blocked by a blocking prop's footprint under its top */
function losBox(HQ, room, ax, az, ay, bx, bz, by) {
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); if (L < 0.01) return true;
    const n = Math.max(2, Math.ceil(L / 0.5));
    const blk = (room.props || []).map(p => { const c = HQ.catalogue[p.key]; if (!c || p.wall || p.ceil) return null; const top = (p.y || 0) + (c.h || 1); const r = c.rect ? null : (c.foot || 0); if (!c.rect && !(r > 0)) return null; return { x: p.x || 0, z: p.z || 0, y: p.y || 0, top, r, rect: c.rect || null, face: p.face || 0 }; }).filter(Boolean);
    for (let i = 1; i < n; i++) {
        const t = i / n, x = ax + dx * t, z = az + dz * t, y = ay + (by - ay) * t;
        for (const b of blk) {
            if (y < b.y || y > b.top) continue;
            if (b.rect) { const f = b.face * Math.PI / 180, ox = x - b.x, oz = z - b.z, lx = ox * Math.cos(f) - oz * Math.sin(f), lz = ox * Math.sin(f) + oz * Math.cos(f); if (Math.abs(lx) <= b.rect.hw && Math.abs(lz) <= b.rect.hd) return false; }
            else if (Math.hypot(x - b.x, z - b.z) <= b.r) return false;
        }
    }
    return true;
}
function boxLanding(room, d) {
    const S = room.shell || {}; let x, z;
    if (d.wall === 'free') { const f = (d.face || 0) * Math.PI / 180; x = (d.x || 0) + Math.sin(f) * 2.4; z = (d.z || 0) - Math.cos(f) * 2.4; }
    else if (d.wall === 'n') { x = d.x || 0; z = -S.d / 2 + 2.4; } else if (d.wall === 's') { x = d.x || 0; z = S.d / 2 - 2.4; }
    else if (d.wall === 'e') { x = S.w / 2 - 2.4; z = d.z || 0; } else if (d.wall === 'w') { x = -S.w / 2 + 2.4; z = d.z || 0; } else return null;
    return { x, z, y: (typeof d.y === 'number') ? d.y : 0 };
}

function auditRoom(D, id, r) {
    const HQ = D.DOOR_HQ;
    const sh = r.shell || {}; const w = sh.w || r.w || 0, d = sh.d || r.d || 0, h = sh.h || r.h || 0;
    const doors = (r.doors || []).filter(x => x && !x.level);
    const byWall = {};
    for (const dr of doors) (byWall[dr.wall || '?'] ||= []).push(dr);
    let minGap = Infinity, close = 0;
    for (const [wall, ds] of Object.entries(byWall)) {
        if (wall === 'free' || wall === '?') continue;
        const pos = ds.map(x => (wall === 'n' || wall === 's') ? x.x : x.z).filter(v => typeof v === 'number').sort((a, b) => a - b);
        for (let i = 1; i < pos.length; i++) { const g = pos[i] - pos[i - 1]; if (g < minGap) minGap = g; if (g < RULES.R3.gap) close++; }
    }
    const maxOnWall = Math.max(0, ...Object.values(byWall).map(a => a.length));
    const hidden = doors.filter(x => x.secret || x.way).length;
    const gen = r.terrain ? (r.terrain.gen || null) : null;
    const rec = { id, label: r.label || '', site: r.site || '', part: r.part || '', family: r.terrain ? ((gen || {}).kind || 'field') : 'box', open: !!sh.open,
                  w, d, h, area: Math.round(w * d), openArea: Math.round(w * d), doors: doors.length, maxOnWall, minGap: minGap === Infinity ? null : +minGap.toFixed(1), close, hidden,
                  props: (r.props || []).length, counters: (r.counters || []).length, npcs: (r.npcSpots || []).length, scatter: 0,
                  range: null, climb: 0, kinds: 0, per100: null, floats: 0, climbs: 0,
                  pullMax: null, pulls: 0, exposed: null, exposedBy: [], earned: 0, earnedIds: [], teased: [], unteased: [], parti: r.parti || null, typology: r.typology || null, per60: null, warn: [] };
    let info = null, landings = [];
    if (r.terrain) {
        try {
            info = D.hqTerrainInfo(id);
            let hi = -1e9, lo = 1e9; for (const v of info.H) { if (v > hi) hi = v; if (v < lo) lo = v; }
            const feats = r.terrain.features || [];
            const cl = feats.filter(f => CLIMB.includes(f.k));
            rec.range = +(hi - lo).toFixed(1); rec.climb = cl.length; rec.kinds = new Set(cl.map(f => f.k === 'ramp' && f.stairs ? 'stairs' : f.k)).size;
            rec.floats = feats.filter(f => f.float).length; rec.climbs = (info.climbs || []).length; rec.scatter = (info.scatter || []).length + (info.trees || []).length;
            /* the OPEN floor: the mask's share when a plan stands, else the whole box */
            if (info.maskD && info.maskD.length) { let n = 0; for (let k = 0; k < info.maskD.length; k++) if (info.maskD[k] > 0) n++; rec.openArea = Math.round(n * info.res * info.res); }
            rec.per100 = +(cl.length / Math.max(1, rec.openArea / 100)).toFixed(2);
            landings = doors.map(dr => Object.assign({ door: dr }, D.hqTerrainDoorLanding(r, dr)));
        } catch (e) { rec.err = e.message.slice(0, 80); }
    } else landings = doors.map(dr => { const L = boxLanding(r, dr); return L ? Object.assign({ door: dr }, L) : null; }).filter(Boolean);
    const los = (a, b) => info ? losTerrain(D, info, a.x, a.z, a.y + EYE, b.x, b.z, b.y + EYE) : losBox(HQ, r, a.x, a.z, a.y + EYE, b.x, b.z, b.y + EYE);
    /* R3 EXPOSURE: from each landing, the other landings in a clear line at eye height */
    if (landings.length > 1) {
        let mx = 0, by = [];
        for (const a of landings) { let n = 0; for (const b of landings) { if (a === b) continue; if (los(a, b)) n++; } if (n > mx) { mx = n; by = [a.door.id]; } else if (n === mx && n > 0) by.push(a.door.id); }
        rec.exposed = mx; rec.exposedBy = by;
    } else rec.exposed = 0;
    /* R4 THE EARNED EXIT: a draught, a way, a door on a tier (its sill ≥ 1.5 m over the lowest sill), a door under the water */
    const lowest = landings.length ? Math.min(...landings.map(L => L.y)) : 0;
    const earned = landings.filter(L => { const dr = L.door; if (dr.secret || dr.way) return true; if (L.y - lowest >= 1.5) return true; if (info && info.sea && !info.sea.under && info.sea.y - D.hqTerrainHeight(info, L.x, L.z) > info.rules.wadeMax) return true; return false; });
    rec.earned = earned.length; rec.earnedIds = earned.map(L => L.door.id);
    /* R2 THE PULL + R5 THE TEASE need the reach graph (terrain rooms only) */
    if (info && landings.length) {
        try {
            const reach = D.hqTerrainReach(info, landings[0].x, landings[0].z);
            const nodes = []; let k = 0;
            for (const [key, y] of reach) { if ((k++ % 7) !== 0) continue; const [i, j] = key.split(',').map(Number); nodes.push({ x: info.x0 + i * info.res, z: info.z0 + j * info.res, y }); }
            /* the pulls: a sky landmark (an open room: seen everywhere → the pull is 0), a tall tier, a tall prop, the battle marker, a find on a pinnacle */
            const pulls = [];
            const feats = r.terrain.features || [];
            for (const f of feats) if (f.k === 'plateau' && f.h >= TALL) pulls.push({ x: f.x, z: f.z, why: 'tier ' + f.h + ' m' });
            for (const p of r.props || []) { const c = HQ.catalogue[p.key]; if (c && !p.wall && !p.ceil && ((c.h || 0) + (p.y || 0)) >= TALL) pulls.push({ x: p.x || 0, z: p.z || 0, why: p.key }); }
            for (const c of r.counters || []) if (c.proc === 'battle_marker') pulls.push({ x: c.x, z: c.z, why: 'the marker' });
            const sky = sh.open && sh.sky && Array.isArray(sh.sky.landmarks) && sh.sky.landmarks.length;
            rec.pulls = pulls.length + (sky ? 1 : 0);
            if (sky) rec.pullMax = 0;
            else if (!pulls.length) rec.pullMax = Infinity;
            else { let mx = 0; for (const n of nodes) { let best = Infinity; for (const p of pulls) { const dd = Math.hypot(p.x - n.x, p.z - n.z); if (dd < best) best = dd; } if (best > mx) mx = best; } rec.pullMax = +mx.toFixed(1); }
            /* the tease: an earned exit that is not a draught is SEEN from a reachable node ≥ 6 m off, ≥ 0.8 m below / above it, or across water */
            for (const L of earned) {
                if (L.door.secret) continue;
                let seen = false;
                for (const n of nodes) {
                    const dist = Math.hypot(n.x - L.x, n.z - L.z); if (dist < 6 || dist > 45) continue;
                    if (Math.abs(n.y - L.y) < 0.8 && !(info.sea && !info.sea.under)) continue;
                    if (los({ x: n.x, z: n.z, y: n.y }, { x: L.x, z: L.z, y: L.y - 0.4 })) { seen = true; break; }
                }
                (seen ? rec.teased : rec.unteased).push(L.door.id);
            }
        } catch (e) { rec.err2 = e.message.slice(0, 80); }
    }
    /* R8 CONTENT DENSITY: props + natives + the compiler's scatter per 60 m² of open floor */
    const items = rec.props + rec.npcs + rec.scatter + (r.agents || []).length;
    rec.per60 = +(items / Math.max(1, rec.openArea / 60)).toFixed(2);
    /* THE WARNINGS */
    const prefab = !r.terrain;
    if (!prefab && rec.per100 != null) {
        const need = sh.open ? RULES.R1.per100Open : RULES.R1.per100Closed, needR = sh.open ? RULES.R1.rangeOpen : RULES.R1.rangeClosed;
        if (rec.per100 < need) rec.warn.push('R1 climb ' + rec.per100 + ' / 100 m² < ' + need);
        if (rec.kinds < RULES.R1.kinds) rec.warn.push('R1 kinds ' + rec.kinds + ' < ' + RULES.R1.kinds);
        if (rec.range != null && rec.range < needR) rec.warn.push('R1 range ' + rec.range + ' m < ' + needR);
        if (rec.pullMax != null && rec.pullMax > RULES.R2.pull) rec.warn.push('R2 pull ' + (rec.pullMax === Infinity ? 'none' : rec.pullMax + ' m') + ' > ' + RULES.R2.pull);
    }
    if (rec.exposed != null && rec.exposed > RULES.R3.exposed) rec.warn.push('R3 exposed ' + rec.exposed + ' from ' + rec.exposedBy.join('/'));
    if (rec.close > 0) rec.warn.push('R3 two doors ' + rec.minGap + ' m apart on one wall');
    if (rec.maxOnWall >= RULES.R3.onWall) rec.warn.push('R3 ' + rec.maxOnWall + ' doors on one wall');
    if (doors.length > 1 && rec.earned < RULES.R4.earned) rec.warn.push('R4 no earned exit');
    else if (doors.length > 1 && rec.earned / doors.length < RULES.R4.share) rec.warn.push('R4 earned ' + rec.earned + ' of ' + doors.length);
    if (rec.unteased.length) rec.warn.push('R5 unteased ' + rec.unteased.join('/'));
    if (!prefab && (!rec.parti || !rec.typology)) rec.warn.push('R6 no parti / typology');
    if (rec.family === 'city' && (w < RULES.R7.city[0] || d < RULES.R7.city[1])) rec.warn.push('R7 city ' + w + '×' + d);
    else if (!prefab && sh.open && r.site && (w < RULES.R7.open[0] || d < RULES.R7.open[1])) rec.warn.push('R7 open ' + w + '×' + d);
    if (rec.per60 < 1) rec.warn.push('R8 density ' + rec.per60 + ' per 60 m²');
    return rec;
}

function audit(opts) {
    opts = opts || {};
    const D = loadOnce(), HQ = D.DOOR_HQ, pick = opts.pick || [], all = !!opts.all;
    const rows = [];
    for (const [id, r] of Object.entries(HQ.rooms)) {
        if (r.kind !== 'box') continue;
        if (pick.length ? !pick.includes(id) : (!all && !r.site)) continue;
        rows.push(auditRoom(D, id, r));
    }
    rows.sort((a, b) => b.area - a.area);
    return rows;
}
module.exports = { audit, auditRoom, RULES, CLIMB };

if (require.main === module) {
    const args = process.argv.slice(2), json = args.includes('--json'), all = args.includes('--all'), rulesOnly = args.includes('--rules');
    const pick = args.filter(a => !a.startsWith('--'));
    const rows = audit({ pick, all });
    if (json) { console.log(JSON.stringify(rows, null, 1)); }
    else {
        const pad = (s, n) => String(s ?? '-').padEnd(n);
        if (!rulesOnly) {
            console.log(pad('room', 42) + pad('family', 7) + pad('size', 13) + pad('doors', 6) + pad('mxW', 4) + pad('gap', 6) + pad('exp', 4) + pad('earn', 5) + pad('rng', 6) + pad('clmb', 5) + pad('knd', 4) + pad('/100', 6) + pad('pull', 6) + pad('/60', 6) + 'typology');
            for (const r of rows) console.log(pad(r.id, 42) + pad(r.family, 7) + pad(`${r.w}x${r.d}x${r.h}`, 13) + pad(r.doors, 6) + pad(r.maxOnWall, 4) + pad(r.minGap, 6) + pad(r.exposed, 4) + pad(r.earned, 5) + pad(r.range, 6) + pad(r.climb, 5) + pad(r.kinds, 4) + pad(r.per100, 6) + pad(r.pullMax === Infinity ? '∞' : r.pullMax, 6) + pad(r.per60, 6) + (r.typology || '-'));
        }
        const fam = {};
        for (const r of rows) { const f = fam[r.family] ||= { n: 0, area: 0, per100: 0, range: 0, hidden: 0, earned: 0, t: 0 }; f.n++; f.area += r.area; f.hidden += r.hidden ? 1 : 0; f.earned += r.earned ? 1 : 0; if (r.per100 != null) { f.t++; f.per100 += r.per100; f.range += r.range; } }
        console.log('\nFAMILY        rooms  avg m²   climb/100m²  avg height range  hidden exit  earned exit');
        for (const [k, f] of Object.entries(fam)) console.log(pad(k, 14) + pad(f.n, 7) + pad(Math.round(f.area / f.n), 9) + pad(f.t ? (f.per100 / f.t).toFixed(2) : '-', 13) + pad(f.t ? (f.range / f.t).toFixed(1) + ' m' : '-', 18) + pad(f.hidden + ' / ' + f.n, 13) + f.earned + ' / ' + f.n);
        console.log('\nTHE RULES (warnings — AREA_CONTENT_PLAN §3; hard after D3):');
        for (const R of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8']) { const off = rows.filter(r => r.warn.some(w => w.startsWith(R + ' '))); console.log('  ' + R + ': ' + off.length + ' / ' + rows.length + (off.length ? ' — ' + off.slice(0, 12).map(r => r.id.replace(/^site_prebuilt_/, '') + ' (' + r.warn.filter(w => w.startsWith(R + ' ')).map(w => w.slice(3)).join('; ') + ')').join(', ') + (off.length > 12 ? ' …' : '') : '')); }
        console.log('\nrooms with no hidden exit (no secret door, no way): ' + rows.filter(r => !r.hidden).length + ' / ' + rows.length);
        console.log('rooms with no earned exit: ' + rows.filter(r => r.doors > 1 && !r.earned).length + ' / ' + rows.length);
        console.log('terrain rooms under 0.4 climb features / 100 m²: ' + rows.filter(r => r.per100 != null && r.per100 < 0.4).length + ' / ' + rows.filter(r => r.per100 != null).length);
    }
}
