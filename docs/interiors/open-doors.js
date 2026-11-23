/* THE OPEN DOORS (2026-11-23, building-interiors plan step 2; mondo 11-23: "I want every building to have an interior. If there is a door the
   player should be able to walk inside of it (very important for a game called DOOR HQ)"; 16:42: "unreachable doors should just either be turned
   into windows or switched to a side of the building where you would be able to walk out on to walkable ground"). Repo-only tooling, called by a
   zone tool after its district files (bake-disaster-city.js THE OPEN DOORS), before THE KITS. A RULE over the rows, not edits in 160 buildings:

   every painted door on the ground (an `arch` part in an `urban:Door*` / `urban:MetalShutter*` sheet whose foot is under 0.9 m: find-doors.js DRAWN)
   is found on the side of the building row it stands on (the walker's texbuilding, or a walked-roof `plateau`, which becomes a two-storey
   texbuilding as the district files' walk-ins do), and that row OPENS there:
     - a shut row turns so the door's side is its front (`rot` + a quarter / half turn, w and d swapped), goes `hollow`, its doorway at the
       painted door (`doorLx` / `doorW` / `doorH`, metres), gets a kit (docs/interiors/kits.js, by the building's name) and `inH` (one walked
       room, 7 m at most, under a tall building's floors above);
     - every other painted door of the same row is one of its `gaps` (data.js hqTexBuildingRows cuts the walker's wall, three-renderer.js the
       inside wall and the arch parts across it) with its swinging leaf in `inner`;
     - the door picture and its frame are taken out of the arch row (the swinging leaf and the doorway are the door now). A threshold, a step,
       a canopy, the lettering stay.
   A row that is already a walk-in only gains the gaps. What it cannot open is listed (no row under the door, a row it must not touch) and
   left as it was. Upper doors (a roof hut's, a gallery's) and the window shutters (foot 0.9 m and up) are not doors on the ground: not here.
   Notes: docs/notes/areas-complexes.md "THE OPEN DOORS". */
'use strict';
const D2R = Math.PI / 180, r3 = v => Math.round(v * 1000) / 1000;
const DOOR_SHEET = /^urban:(Door|MetalShutter)/;
/* the rows that can never be hollow (data.js HQ_PACK_BUILDINGS + HQ_TEXB_PRISMS): their faces are a model's or a sprite's */
const PACKISH = /^(pack_bld_\d\d|building_\d+|ancient_building|abandoned_building_\d|church_\d|shop)$/;
/* the leaf's turn for a gap on each side (three-renderer.js _hqBuildTexDoors `inner`: 0 = in a wall along the front) */
const LEAF_ROT = { f: 0, b: 180, r: 270, l: 90 };
const WINDOW = 'urban:GlassWindowTall1a-Glow';   // the tall pane a door up the wall becomes (the district files' GT)

/* (x, z) in a row's own frame (x across its front, z toward its front), and back */
const toLocal = (f, x, z) => { const q = (+f.rot || 0) * D2R, c = Math.cos(q), s = Math.sin(q), dx = x - f.x, dz = z - f.z; return [dx * c + dz * s, -dx * s + dz * c]; };
const dirLocal = (f, nx, nz) => { const q = (+f.rot || 0) * D2R, c = Math.cos(q), s = Math.sin(q); return [nx * c + nz * s, -nx * s + nz * c]; };
const toWorld = (f, lx, lz) => { const q = (+f.rot || 0) * D2R, c = Math.cos(q), s = Math.sin(q); return [f.x + lx * c - lz * s, f.z + lx * s + lz * c]; };

/* which side of row f a door at (x, z) looking (nx, nz) stands on: { side, u, half } or null */
function sideOf(f, x, z, nx, nz) {
    const w = Math.max(2, +f.w || 8), d = Math.max(2, +f.d || 8), [lx, lz] = toLocal(f, x, z), [ax, az] = dirLocal(f, nx, nz);
    const cand = [['f', lz - d / 2, lx, w, az], ['b', -lz - d / 2, lx, w, -az], ['r', lx - w / 2, lz, d, ax], ['l', -lx - w / 2, lz, d, -ax]];
    let best = null;
    cand.forEach(([side, off, u, len, face]) => { if (off > 0.75 || off < -1.2 || Math.abs(u) > len / 2 - 0.45) return;   // (a storefront set back up to 1.2 m into its row still opens it) if (face < 0.7) return;
        if (!best || Math.abs(off) < Math.abs(best.off)) best = { side, u, off, len }; });
    return best;
}

module.exports = function openDoors(ctx) {
    const { features, KITS } = ctx, nameOf = ctx.nameOf || (() => ''), skip = ctx.skip || (() => false), say = [], count = { doors: 0, opened: 0, gaps: 0, plateaus: 0, kits: 0, left: 0, pictures: 0, windows: 0 };
    /* the rows a door can open into */
    const hosts = features.filter(f => f && (f.k === 'texbuilding' || f.k === 'plateau') && typeof f.y !== 'number' && !f.doorsOnly && !f.bareIn && !f.open
        && !(typeof f.key === 'string' && PACKISH.test(f.key)) && !/^walkin:/.test(String(f.id || '')) && isFinite(+f.x) && isFinite(+f.z));
    /* 1. every painted door on the ground, with its row and side */
    const doors = [];
    features.forEach(a => {
        if (!a || a.k !== 'arch' || !Array.isArray(a.parts)) return;   // (an arch row's `y` is its ground's height: the foot below is the part's own)
        a.parts.forEach((P, k) => {
            if (!P || typeof P.key !== 'string' || !DOOR_SHEET.test(P.key) || !Array.isArray(P.p)) return;
            const sz = P.size || [1, 1, 1], foot = +P.p[1] || 0, h = +sz[1] || 2;
            if (P.s === 'box' && h < 1.2) return;            // a band, a sill in the sheet
            /* a door up the wall with no floor at it (a roof hut's, an upper landing's: find-doors.js reaches none of them at their height): a window
               (mondo 11-23: "unreachable doors should just either be turned into windows or ...") */
            if (foot >= 3 && /^urban:Door/.test(P.key) && ctx.windows !== false) { P.key = WINDOW; count.windows++; return; }
            if (foot >= 0.9 || h < 1.5) return;              // an upper door, a hatch, a window shutter: not on the ground
            const q = ((+a.rot || 0) + (+P.ry || 0)) * D2R, thinX = P.s === 'box' && (sz[0] || 1) < (sz[2] || 1);
            const wid = P.s === 'quad' ? +sz[0] : Math.max(+sz[0] || 0, +sz[2] || 0);
            const at = toWorld(a, +P.p[0] || 0, +P.p[2] || 0);
            /* a door whose ground outside is not at the floor's height (find-doors.js WALKIN-X: a step of 1.3 m or more, a yard on another level, a
               district's furniture against it inside): a window, mondo's rule. ctx.windowsAt = [[x, z], ...] from the finder's run */
            if ((ctx.windowsAt || []).some(q => Math.hypot(q[0] - at[0], q[1] - at[1]) < 1.6)) { P.key = WINDOW; count.windows++; return; }
            let n = thinX ? [Math.cos(q), Math.sin(q)] : [-Math.sin(q), Math.cos(q)];
            /* the row it stands on: the door's face looks out of that row's side (both ways for a box: the sheet is on both faces) */
            let host = null, hs = null;
            for (const f of hosts) { for (const sg of (P.s === 'box' ? [1, -1] : [1])) { const s0 = sideOf(f, at[0], at[1], n[0] * sg, n[1] * sg); if (s0 && (!hs || Math.abs(s0.off) < Math.abs(hs.off))) { host = f; hs = s0; if (sg < 0) n = [-n[0], -n[1]]; } } }
            count.doors++;
            doors.push({ a, k, P, at, n, wid, h, host, id: a.id + '#' + k, sheet: P.key.replace(/^urban:/, '') });
        });
    });
    /* 2. per row: a door's halves (two leaves side by side) are one doorway */
    const byHost = new Map();
    /* a door with no building row behind it (a stadium's arch, a hut drawn in parts, a porch's door off its house): a window (mondo's rule,
       11-23: "any door that can't open becomes a window or moves to a walkable side"); ctx.orphans === 'keep' leaves it */
    doors.forEach(D => { if (!D.host) { if (ctx.orphans !== 'keep') { D.P.key = WINDOW; count.windows++; say.push('WINDOW ' + D.id + ' ' + D.sheet + ' at ' + r3(D.at[0]) + ', ' + r3(D.at[1]) + ': no building row under it'); return; }
            count.left++; say.push('LEFT ' + D.id + ' ' + D.sheet + ' at ' + r3(D.at[0]) + ', ' + r3(D.at[1]) + ': no building row under it'); return; }
        if (skip(D.host, D)) { count.left++; say.push('SKIP ' + D.id + ' (' + D.host.id + ')'); return; }
        (byHost.get(D.host) || byHost.set(D.host, []).get(D.host)).push(D); });
    const drop = new Map();   // arch row -> part indexes to take out
    const dropPart = (a, k) => { (drop.get(a) || drop.set(a, new Set()).get(a)).add(k); };
    byHost.forEach((list, f0) => {
        let f = f0;
        /* a walked-roof plateau becomes the walker's two-storey texbuilding (its 7 m roof slab walked as before), as the district files' walk-ins do */
        if (f.k === 'plateau') { const st = Math.round((+f.h || 7) / 3.5); if (Math.abs(st * 3.5 - (+f.h || 7)) > 0.05 || st < 1) { list.forEach(D => { count.left++; say.push('LEFT ' + D.id + ': plateau ' + f.id + ' h ' + f.h + ' is no whole storey'); }); return; }
            const nr = { k: 'texbuilding', id: f.id, x: f.x, z: f.z, w: f.w, d: f.d, rot: +f.rot || 0, storeys: st, seed: (f.bld && f.bld.seed) || 0, style: (f.bld && f.bld.style) || 'office', skin: false };
            features[features.indexOf(f)] = nr; f = nr; count.plateaus++; }
        /* the doorways: halves within 1.6 m of each other on one side join */
        const waysOf = () => { const ways = [];
            list.map(D => Object.assign(D, { s0: sideOf(f, D.at[0], D.at[1], D.n[0], D.n[1]) })).filter(D => D.s0).sort((p, q) => p.s0.side < q.s0.side ? -1 : p.s0.side > q.s0.side ? 1 : p.s0.u - q.s0.u)
                .forEach(D => { const last = ways[ways.length - 1], u0 = D.s0.u - D.wid / 2, u1 = D.s0.u + D.wid / 2;
                    if (last && last.side === D.s0.side && u0 < last.u1 + 0.25 && (u1 - last.u0) < 3.2) { last.u0 = Math.min(last.u0, u0); last.u1 = Math.max(last.u1, u1); last.h = Math.max(last.h, D.h); last.parts.push(D); }
                    else ways.push({ side: D.s0.side, u0, u1, h: D.h, parts: [D] }); });
            return ways; };
        let ways = waysOf();
        if (!ways.length) return;
        const wasHollow = !!f.hollow, name = nameOf(f);
        if (!wasHollow) {
            /* the front: the door on the row's front if there is one, else the first; the row turns so that side is its front */
            const main0 = ways.find(w => w.side === 'f') || ways[0], key = main0.parts[0], turn = { f: 0, b: 180, r: -90, l: 90 }[main0.side];
            if (turn) { f.rot = ((((+f.rot || 0) + turn) % 360) + 360) % 360; if (Math.abs(turn) === 90) { const w0 = f.w; f.w = f.d; f.d = w0; } ways = waysOf(); }
            const m = ways.find(w => w.parts.indexOf(key) >= 0);
            if (!m || m.side !== 'f') { list.forEach(D => { count.left++; say.push('LEFT ' + D.id + ': ' + f.id + ' would not turn'); }); return; }
            f.hollow = true; delete f.door;
            const shutM = m.parts.every(D => /^MetalShutter/.test(D.sheet));   // a roller shutter: the whole opening, no swinging leaf (a garage stands open)
            f.doorLx = r3((m.u0 + m.u1) / 2); f.doorW = r3(Math.min(shutM ? 5.4 : 2.6, Math.max(1.0, m.u1 - m.u0 + 0.08))); if (shutM) f.leaf = 'none'; else if (f.doorW > 1.8) f.leafDouble = true;   // a pair of halves = a double door f.doorH = r3(Math.min(3.0, Math.max(2.2, m.h + 0.05)));
            if ((+f.storeys || 2) > 2) f.inH = 6.68;   // one walked room under the floors above (two storeys high, as a 7 m walk-in is)
            m.main = true;
            if (!f.kit) { f.kit = KITS.kitFor(name); f.kitSeed = f.id; count.kits++; }
            count.opened++;
        }
        /* the front doorway of a walk-in that already was one: a painted door on it stays where it is (find-doors.js never lists it) */
        const D0 = (() => { const L = Math.max(2, +f.w || 8) - 0.12, n = Math.max(1, Math.round(L / 1.75)), cw = L / n; if (isFinite(+f.doorLx)) return { lx: +f.doorLx, cw: +f.doorW || cw };
            let c = Math.floor((n - 1) / 2); if (f.door >= 1) c = Math.min(n - 1, Math.round(f.door) - 1); return { lx: -L / 2 + (c + 0.5) * cw, cw }; })();
        const gaps = Array.isArray(f.gaps) ? f.gaps.slice() : [], inner = Array.isArray(f.inner) ? f.inner.slice() : [];
        const w = Math.max(2, +f.w || 8), d = Math.max(2, +f.d || 8), sideLen = { f: w, b: w, r: d, l: d };
        ways.forEach(W => {
            const shut = W.parts.every(D => /^MetalShutter/.test(D.sheet)), ctr = (W.u0 + W.u1) / 2, wid = Math.min(shut ? 5.4 : 2.6, Math.max(1.0, W.u1 - W.u0 + 0.08)), hh = Math.min(shut ? 4.0 : 3.0, Math.max(2.2, W.h + 0.05));
            if (!W.main) {
                if (W.side === 'f' && Math.abs(ctr - D0.lx) < (D0.cw + wid) / 2 + 0.3) { W.parts.forEach(D => dropPart(D.a, D.k)); return; }   // it IS the doorway
                if (Math.abs(ctr) > sideLen[W.side] / 2 - wid / 2 - 0.3) { W.parts.forEach(D => { count.left++; say.push('LEFT ' + D.id + ': at the corner of ' + f.id); }); return; }
                if (gaps.some(g => g.side === W.side && Math.abs(+g.u - ctr) < (+g.w + wid) / 2 + 0.3)) { W.parts.forEach(D => dropPart(D.a, D.k)); return; }
                gaps.push({ side: W.side, u: r3(ctr), w: r3(wid), h: r3(hh) });
                const lz = { f: (d - 0.12) / 2 - 0.12, b: -((d - 0.12) / 2 - 0.12) }, lx = { r: (w - 0.12) / 2 - 0.12, l: -((w - 0.12) / 2 - 0.12) };
                if (!shut) inner.push(W.side === 'f' || W.side === 'b' ? { x: r3(ctr), z: r3(lz[W.side]), rot: LEAF_ROT[W.side], w: r3(wid), h: r3(hh), double: wid > 1.8 } : { x: r3(lx[W.side]), z: r3(ctr), rot: LEAF_ROT[W.side], w: r3(wid), h: r3(hh), double: wid > 1.8 });
                count.gaps++;
            }
            W.parts.forEach(D => dropPart(D.a, D.k));
            say.push((W.main ? 'OPEN ' : 'GAP  ') + f.id + ' ' + W.side + ' u ' + r3(ctr) + ' w ' + r3(wid) + ' (' + W.parts.map(D => D.sheet).join(' + ') + ')' + (W.main ? ' kit ' + f.kit + ' · ' + name : ''));
        });
        if (gaps.length) f.gaps = gaps; if (inner.length) f.inner = inner;
        /* the door's frame: a dark panel behind the picture (a service door's), about its size, on its face */
        ways.forEach(W => W.parts.forEach(D => { const a = D.a, q0 = ((+a.rot || 0) + (+D.P.ry || 0)) % 180;
            a.parts.forEach((P, k) => { if (k === D.k || !P || !Array.isArray(P.p) || (typeof P.key === 'string' && (/^txt:/.test(P.key) || DOOR_SHEET.test(P.key)))) return;
                if (P.s !== 'box' && P.s !== 'quad') return; const sz = P.size || [1, 1, 1], foot = +P.p[1] || 0, h = +sz[1] || 0;
                if (foot > 0.25 || h < 1.7 || h > 3.2) return;
                const thin = P.s === 'quad' ? 0 : Math.min(+sz[0] || 0, +sz[2] || 0), wide = P.s === 'quad' ? +sz[0] : Math.max(+sz[0] || 0, +sz[2] || 0); if (thin > 0.3 || wide > D.wid + 0.9 || wide < D.wid * 0.6) return;
                const at = toWorld(a, +P.p[0] || 0, +P.p[2] || 0), off = Math.hypot(at[0] - D.at[0], at[1] - D.at[1]); if (off > 0.45) return;
                dropPart(a, k); count.pictures++; }); }));
    });
    drop.forEach((set, a) => { a.parts = a.parts.filter((P, k) => !set.has(k)); });
    return { count, say };
};
module.exports.DOOR_SHEET = DOOR_SHEET;
