#!/usr/bin/env node
/* find-doorways.js — THE DOORWAY CHECK (2026-11-26, repo-only tooling; DOOR HQ 2.0 wave 1, thread 5 of the plan
   https://claude.ai/artifact/69S69c6y5uBALhoQmiYsCY; mondo 11-26: "I am always walking through a door and then someone is standing
   right there in the entrance blocking me from moving", "the table is placed too close in front of the door so when I walk in I'm just
   automatically stuck"). It reads every DOOR HQ room the way the game builds it (data.js after load: the link doors, the cut doors, the
   catalogue's footprints, the three-renderer.js blocker rule copied below) and FAILS any room with something standing inside a door's
   CLEAR SQUARE: one battle square (3.5 m x 3.5 m) on the room side of the door, centred on the opening, starting at the wall.
   "Either side" of a door = the clear square in each of the two rooms it joins: a door is checked from the room it is in, and its far side
   is the far room's own door (checked when that room is). A free-standing door (`wall: 'free'`) has both its squares in one room.

     PROP      a placed prop that blocks the walker (a footprint, or a mesh collider: three-renderer.js _hqPlaceProps / _hqMcWants)
     COUNTER   a standing kiosk (the round hall's directory; every other counter is only a plate in the air)
     STAIR     a rotunda flight (shell stairs, the gallery's flight)
     AGENT     a room agent's post (`agents`), a person sitting / posed there
     POST      a native / roster post (`npcSpots`, `onlineSpots`), a person sitting / posed there
     CAST      a story character's post (data.js DOOR_CAST spots in this room), sitting / posed
               THE CLEAR DOORWAY (three-renderer.js, 11-26): the game stands a STANDING person placed in a square just past it
               (_hqOutOfDoorway), so only a posed / seated one (it stays with its chair) or one with no room past the square
               (a closet-sized room, the 4 m bays) is listed. `--as-placed` lists every post where the data puts it.
     ROUTE     (`--old-route` only) the old walkers' door stop, 1.7 / 2.2 m in, 2-7 s. Since THE CLEAR DOORWAY no walker stops in a
               square: an exit is walked through, a door that leads nowhere is looked at from past its square, every other stop is
               pushed out, an arrival never waits there, paths go round squares, and a walker inside one never blocks the officer.
   A row says `lane` when it stands in the walking line straight in through the opening (the opening's width + a body either side):
   that is a stop in your tracks. `edge` = inside the square but beside the line (a cabinet against the wall next to the frame).
   Both fail: the square is kept clear.

       node find-doorways.js                    every DOOR HQ room (the hand-built ones; retired rooms left out), a table + exit 1 on any fail
       node find-doorways.js <room id> [more]   those rooms, every row
       --json        print the rooms' JSON          --square <m>   the square's side (default 3.5)
       --lane-only   list (and fail on) `lane` rows only            --people-only  only AGENT / POST / CAST rows
       --as-placed   people where the data puts them (no move)      --old-route    the old ROUTE rows (before THE CLEAR DOORWAY)
   x, z are the room's own metres (the F3 line's). The goal is zero rows. Run it on every DOOR HQ room a PR builds or changes.
   Terrain rooms (the zones built on plots) are not read: their doors are find-doors.js's. Notes: docs/notes/hq-building-rooms.md
   "THE DOORWAY CHECK". */
'use strict';
const vm = require('vm');
const ARGS = process.argv.slice(2), flag = n => ARGS.includes(n), opt = (n, d) => { const i = ARGS.indexOf(n); return i >= 0 ? ARGS[i + 1] : d; };
const IDS = ARGS.filter((a, i) => !a.startsWith('--') && !['--square'].includes(ARGS[i - 1]));
const SQ = +opt('--square', 3.5) || 3.5;

const D = require('./load-data.js').loadGameData();
const res = JSON.parse(vm.runInContext(`(() => {
    const SQ = ${SQ}, WANT = ${JSON.stringify(IDS)}, OLD_ROUTE = ${flag('--old-route')}, OLD_PEOPLE = ${flag('--as-placed')};
    const BODY = 0.34, PERSON = 0.4, D2R = Math.PI / 180, r2 = v => Math.round(v * 100) / 100;
    const CAT = DOOR_HQ.catalogue || {}, terr = new Set(hqTerrainRooms()), retired = DOOR_HQ.retired || {};
    const WALLS = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] };
    const SOFT = /grass|flower|fern|weed|vine|moss|leaf|leaves|ivy|cobweb|puddle|rug|carpet|decal|shadow|glow|beam|smoke|fog|cloud|curtain|banner|flag|rope|chain|cable|wire|bush|shrub|reed|mushroom|petal|cattail|lily|kelp|coral|seaweed/i;
    const polar = (deg, r) => { const a = (deg || 0) * D2R; return [Math.sin(a) * r, -Math.cos(a) * r]; };
    const ids = WANT.length ? WANT : Object.keys(DOOR_HQ.rooms).filter(id => !terr.has(id) && !retired[id] && !DOOR_HQ.rooms[id].terrain);
    /* a convex polygon round a footprint: a circle (12 sides) or a rect turned by the three.js yaw */
    const circ = (x, z, r) => { const o = []; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; o.push([x + Math.cos(a) * r, z + Math.sin(a) * r]); } return o; };
    const rect = (x, z, hw, hd, yaw) => { const c = Math.cos(yaw), s = Math.sin(yaw); return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([a, b]) => [x + a * c + b * s, z - a * s + b * c]); };
    /* two convex polygons overlap (separating axes) */
    const axes = P => P.map((p, i) => { const q = P[(i + 1) % P.length]; return [-(q[1] - p[1]), q[0] - p[0]]; });
    const proj = (P, a) => { let lo = Infinity, hi = -Infinity; P.forEach(p => { const v = p[0] * a[0] + p[1] * a[1]; if (v < lo) lo = v; if (v > hi) hi = v; }); return [lo, hi]; };
    const hits = (A, B) => axes(A).concat(axes(B)).every(a => { const [a0, a1] = proj(A, a), [b0, b1] = proj(B, a); return a1 > b0 + 0.01 && b1 > a0 + 0.01; });
    const out = [];
    ids.forEach(id => {
        const room = DOOR_HQ.rooms[id]; if (!room) { out.push({ id, err: 'no such room' }); return; }
        const S = room.shell || {}, kind = room.kind, isBox = kind === 'box', rows = [], doors = [], things = [], notes = [];
        const lvlY = l => l || 0;
        const wallR = (level, side) => kind === 'bay' ? (side === 'in' ? S.rIn : S.rOut) : (level && S.mezz ? S.mezz.outer : S.radius);
        /* ── THE DOORS: the point on the wall, the inward normal, the opening's half width ── */
        (room.doors || []).forEach(d => {
            if (!d || d.hidden || d.sealed) return;
            const op = hqDoorOpening(d), half = (d.way && DOOR_HQ.ways && DOOR_HQ.ways[d.way] && DOOR_HQ.ways[d.way].w) ? DOOR_HQ.ways[d.way].w / 2 : op.ow / 2;
            const level = d.level || 0;
            const push = (x, z, nx, nz, side) => doors.push({ id: d.id, side, x, z, nx, nz, half, level, label: d.label || '', to: (d.action && d.action.room) || null });
            if (isBox) {
                if (d.wall === 'free') { const f = (+d.face || 0) * D2R, nx = Math.sin(f), nz = -Math.cos(f); push(+d.x || 0, +d.z || 0, nx, nz, 'front'); push(+d.x || 0, +d.z || 0, -nx, -nz, 'back'); return; }
                const W = _hqDoorOnWall(room, d); if (!W) return; const n = WALLS[W.wall]; push(W.x, W.z, n[0], n[1], 'in');
            } else if (d.deg != null) {
                const inward = d.side === 'in', R = wallR(level, d.side), p = polar(d.deg, R), L = Math.hypot(p[0], p[1]) || 1;
                push(p[0], p[1], inward ? p[0] / L : -p[0] / L, inward ? p[1] / L : -p[1] / L, 'in');
            }
        });
        /* ── THE THINGS IN THE ROOM ── */
        const at = (o, level) => { if (isBox || o.deg == null) return [+o.x || 0, +o.z || 0]; return polar(o.deg, o.r || 0); };
        (room.props || []).forEach((p, i) => {
            const cat = CAT[p.key]; if (!cat || (!cat.file && !cat.proc && !cat.pack)) return;
            const level = p.level || 0, onCeil = !!(cat.ceil || p.ceil), flip = !!p.flip, mount = (p.mount != null) ? p.mount : (cat.mount || 0);
            if (onCeil || flip || mount || p.y > 0.5 || p.scatter) return;
            const kick = (typeof hqPropKickable === 'function') && hqPropKickable(p.key, cat); if (kick) return;
            const fitSpan = (cat.span != null && cat.h == null) || (p.span != null), fs = fitSpan ? ((p.span && cat.span) ? p.span / cat.span : 1) : ((p.h && cat.h) ? p.h / cat.h : 1);
            const blocker = cat.foot > 0 && !p.noBlock;
            const mesh = !(cat.lay || cat.mesh === false || p.mesh === false || cat.rail || cat.ramp || cat.vehicle || cat.leaf || cat.float || cat.hover) && (blocker || !SOFT.test(String(p.key)));
            if (!blocker && !mesh) return;
            const h = (p.h || cat.h || (cat.span != null ? cat.span * 0.6 : 1)) * (fitSpan ? fs : 1);
            if (!blocker && h <= 0.35) return;   // a mat, a seal, a floor sign: walked over
            /* where it stands: a box wall prop is the wall point pushed in by half its depth; a round room's wall prop hangs on the drum */
            let x, z, yaw;
            if (isBox && typeof p.wall === 'string' && p.wall !== 'free' && WALLS[p.wall]) {
                const n = WALLS[p.wall], dep = cat.depth || (cat.proc ? 0.1 : 0.66), al = (p.wall === 'e' || p.wall === 'w') ? (p.z || 0) : (p.x || 0);
                const wx = p.wall === 'e' ? S.w / 2 : p.wall === 'w' ? -S.w / 2 : al, wz = p.wall === 's' ? S.d / 2 : p.wall === 'n' ? -S.d / 2 : al;
                x = wx + n[0] * (0.02 + dep / 2); z = wz + n[1] * (0.02 + dep / 2); yaw = ({ n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 })[p.wall] - (p.rot || 0) * D2R;
            } else if (!isBox && (cat.wall || p.wall) && p.r == null) {
                const dep = cat.depth || 0.66, R = wallR(level, p.side), q = polar(p.deg, p.side === 'in' ? R + 0.02 + dep / 2 : R - 0.02 - dep / 2); x = q[0]; z = q[1]; yaw = -(p.deg || 0) * D2R + (p.side === 'in' ? Math.PI : 0) - (p.rot || 0) * D2R;
            } else if (isBox) { x = +p.x || 0; z = +p.z || 0; yaw = Math.PI - (p.face || 0) * D2R - (p.rot || 0) * D2R; }
            else { const q = polar(p.deg, p.r || 0); x = q[0]; z = q[1]; yaw = -(p.deg || 0) * D2R - (p.rot || 0) * D2R; }
            let poly, est = false;
            if (blocker && cat.rect && p.rect !== false) poly = rect(x, z, cat.rect.hw * fs, cat.rect.hd * fs, yaw);
            else if (blocker) poly = circ(x, z, cat.foot * fs);
            else { est = true; poly = circ(x, z, Math.max(0.25, ((cat.span || 0.6) * (fitSpan ? fs : 1)) / 2)); }   // a mesh collider: its real shape is only known in the game; half its span
            things.push({ kind: 'PROP', what: p.key + (est ? ' (mesh, size est.)' : ''), i, x, z, level, poly });
        });
        /* a counter is only a plate in the air (three-renderer.js: a box room's counter, a round room's DISPATCH), except the round room's
           DIRECTORY, a standing kiosk with a 0.55 m blocker */
        (isBox ? [] : (room.counters || [])).forEach(c => {
            if (!c || c.proc !== 'directory') return;
            const q = at(c); things.push({ kind: 'COUNTER', what: c.id || c.label || 'counter', x: q[0], z: q[1], level: c.level || 0, poly: circ(q[0], q[1], 0.55) });
        });
        /* the round hall's flights: a band of the drum between two bearings */
        const flight = (st, level, rOut) => { if (!st) return; const a0 = Math.min(st.from, st.to), a1 = Math.max(st.from, st.to), n = Math.max(2, Math.ceil((a1 - a0) / 3));
            for (let k = 0; k < n; k++) { const b0 = a0 + (a1 - a0) * k / n, b1 = a0 + (a1 - a0) * (k + 1) / n, ro = st.rOut || rOut;
                const P = [polar(b0, st.rIn), polar(b1, st.rIn), polar(b1, ro), polar(b0, ro)]; const c = polar((b0 + b1) / 2, (st.rIn + ro) / 2);
                things.push({ kind: 'STAIR', what: st.id || 'stair', x: c[0], z: c[1], level, poly: P }); } };
        if (!isBox && kind === 'rotunda') { (room.stairs || []).forEach(st => flight(st, 0, S.radius)); if (S.ring3 && S.ring3.stair) flight(S.ring3.stair, 1, S.ring3.outer); }
        const person = (kind, list, what) => (list || []).forEach((s, i) => { if (!s) return; const q = at(s); things.push({ kind, what: what(s, i), x: q[0], z: q[1], level: s.level || 0, poly: circ(q[0], q[1], s.rad || PERSON), person: true, posed: !!s.pose }); });
        person('AGENT', room.agents, s => s.label || 'agent');
        person('POST', room.npcSpots, (s, i) => 'npcSpots[' + i + ']' + (s.race ? ' ' + s.race : s.cast ? ' ' + s.cast : ''));
        person('POST', room.onlineSpots, (s, i) => 'onlineSpots[' + i + ']');
        for (const cid in DOOR_CAST) { const m = DOOR_CAST[cid]; if (!m || m.hidden) continue; (m.spots || []).forEach((s, i) => {
            if (!s || hqCastSpotRoom(s) !== id) return; const sp = (hqCastSpotRoom(s) === s.room) ? s : hqRingSpot(s.room.slice(4), s); const q = at(sp);
            things.push({ kind: 'CAST', what: (m.name || cid) + ' (DOOR_CAST.' + cid + '.spots[' + i + ']' + (s.during ? ', a quest stage' : '') + ')', x: q[0], z: q[1], level: sp.level || 0, poly: circ(q[0], q[1], s.rad || PERSON), person: true, posed: !!s.pose }); }); }
        /* ── THE WALKERS: does anybody walk this room's loop? ── */
        const why = [];
        (room.agents || []).forEach(a => { if (a && a.patrol && !a.pose) why.push('patrol agent ' + (a.label || '')); });
        (room.npcSpots || []).forEach((s, si) => { if (s && !s.stay && !s.pose && !s.clone && s.roam !== false && (s.roam === true || HQ_POPULATION_RULES.spotRoamShare > 0)) why.push('npcSpots[' + si + '] may roam'); });
        try { const pop = hqRoomPopulation(id, null, {}); if (pop && pop.draw && pop.draw.length && !room.placed) why.push(pop.draw.length + ' extras (population)'); } catch (e) {}
        /* ── THE CHECK ── */
        const sqOf = d => { const tx = -d.nz, tz = d.nx, hs = SQ / 2; return { d, tx, tz, hs, poly: [[-hs, 0], [hs, 0], [hs, SQ], [-hs, SQ]].map(([a, b]) => [d.x + tx * a + d.nx * b, d.z + tz * a + d.nz * b]) }; };
        const SQS = doors.map(sqOf);
        /* THE CLEAR DOORWAY (three-renderer.js _hqOutOfDoorway, copied): a standing person inside a square is stood past it in the game
           (straight in first, then beside it); a posed or seated one stays. The game asks the floor; here a place counts when it is inside
           the room's walls and on no blocking prop. */
        const PADP = 0.45, inRoom = (x, z) => { if (isBox) return Math.abs(x) < (S.w || 10) / 2 - PADP && Math.abs(z) < (S.d || 10) / 2 - PADP; const r = Math.hypot(x, z);
            if (kind === 'bay') return r > (S.rIn || 0) + PADP && r < (S.rOut || 30) - PADP; return r < (S.radius || 20) - PADP; };
        const inSq = (x, z, level, p) => SQS.find(Q => { if ((Q.d.level || 0) !== (level || 0)) return false; const dx = x - Q.d.x, dz = z - Q.d.z, b = dx * Q.d.nx + dz * Q.d.nz, a = dx * Q.tx + dz * Q.tz; return b > -0.3 && b < SQ + p && Math.abs(a) < Q.hs + p; });
        const props = things.filter(t => t.kind === 'PROP' || t.kind === 'COUNTER' || t.kind === 'STAIR');
        const standPast = t => { const Q = inSq(t.x, t.z, t.level, PADP); if (!Q) return null; const a = (t.x - Q.d.x) * Q.tx + (t.z - Q.d.z) * Q.tz, b = (t.x - Q.d.x) * Q.d.nx + (t.z - Q.d.z) * Q.d.nz;
            const deep = SQ + PADP + 0.1, side = Q.hs + PADP + 0.1, sg = a >= 0 ? 1 : -1;
            for (const [ta, tb] of [[a, deep], [sg * side, Math.max(b, 0.6)], [-sg * side, Math.max(b, 0.6)], [a, deep + 1.2], [sg * side, deep], [-sg * side, deep]]) {
                const x = Q.d.x + Q.tx * ta + Q.d.nx * tb, z = Q.d.z + Q.tz * ta + Q.d.nz * tb;
                if (inSq(x, z, t.level, PADP) || !inRoom(x, z)) continue; const body = circ(x, z, PERSON); if (props.some(o => (o.level || 0) === (t.level || 0) && hits(body, o.poly))) continue;
                return [x, z]; }
            return false; };
        let moved = 0;
        things.forEach(t => { if (!t.person || t.posed || OLD_PEOPLE) return; const to = standPast(t); if (to === null) return; if (to) { moved++; t.x = to[0]; t.z = to[1]; t.poly = circ(to[0], to[1], PERSON); } else t.what += ' (no place past the square)'; });
        SQS.forEach(Q => {
            const d = Q.d, tx = Q.tx, tz = Q.tz, sq = Q.poly;
            const laneH = d.half + BODY;
            const lane = [[-laneH, 0], [laneH, 0], [laneH, SQ], [-laneH, SQ]].map(([a, b]) => [d.x + tx * a + d.nx * b, d.z + tz * a + d.nz * b]);
            things.forEach(t => {
                if ((t.level || 0) !== d.level || !hits(sq, t.poly)) return;
                const dx = t.x - d.x, dz = t.z - d.z, inM = dx * d.nx + dz * d.nz, al = dx * tx + dz * tz;
                rows.push({ door: d.id + (d.side !== 'in' ? ' (' + d.side + ')' : ''), doorLabel: d.label, kind: t.kind, what: t.what + (t.posed ? ' (posed: stays with its seat)' : ''), x: r2(t.x), z: r2(t.z), in: r2(inM), off: r2(al), where: hits(lane, t.poly) ? 'lane' : 'edge', level: d.level });
            });
            /* ROUTE (the old renderer only, --old-route): the walkers' door stop stood 1.7 / 2.2 m in and waited 2-7 s; since THE CLEAR DOORWAY
               an exit is walked through, a door that leads nowhere is looked at from past the square, no other stop is made in one */
            if (OLD_ROUTE && why.length) { const k = isBox ? 1.7 : 2.2; rows.push({ door: d.id + (d.side !== 'in' ? ' (' + d.side + ')' : ''), doorLabel: d.label, kind: 'ROUTE', what: 'walkers stop and wait here (' + why.slice(0, 2).join(', ') + (why.length > 2 ? ', +' + (why.length - 2) : '') + ')', x: r2(d.x + d.nx * k), z: r2(d.z + d.nz * k), in: k, off: 0, where: 'lane', level: d.level }); }
        });
        out.push({ id, label: room.label || id, kind, doors: doors.length, walkers: why.length, moved, rows });
    });
    return JSON.stringify(out);
})()`, D));

let list = res;
list.forEach(r => { if (!r.rows) return; if (flag('--lane-only')) r.rows = r.rows.filter(w => w.where === 'lane'); if (flag('--no-route')) r.rows = r.rows.filter(w => w.kind !== 'ROUTE'); if (flag('--people-only')) r.rows = r.rows.filter(w => /AGENT|POST|CAST|ROUTE/.test(w.kind)); });
if (flag('--json')) { console.log(JSON.stringify(list, null, 1)); process.exit(list.some(r => r.rows && r.rows.length) ? 1 : 0); }
const pad = (s, n) => { s = String(s); return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); };
let bad = 0, nrows = 0, nmoved = 0; const byKind = {};
list.forEach(r => { nmoved += r.moved || 0; });
list.forEach(r => {
    if (r.err) { console.log(`${r.id}: ${r.err}`); bad++; return; }
    if (!r.rows.length) { if (IDS.length) console.log(`OK    ${r.id} (${r.label}) · ${r.doors} doors clear`); return; }
    bad++; nrows += r.rows.length; r.rows.forEach(w => byKind[w.kind] = (byKind[w.kind] || 0) + 1);
    console.log(`\nFAIL  ${r.id} (${r.label}) · ${r.doors} doors · ${r.rows.length} in a clear square${r.walkers ? ' · has walkers' : ''}`);
    r.rows.forEach(w => console.log(`  ${pad(w.door, 26)} ${pad(w.kind, 7)} ${pad(w.where, 4)}  in ${pad(w.in.toFixed(2) + ' m', 7)} off ${pad(w.off.toFixed(2) + ' m', 8)} x ${pad(w.x, 7)} z ${pad(w.z, 7)} ${w.what}`));
});
const ok = list.length - bad;
console.log(`\n[doorways] ${list.length} rooms · ${ok} clear · ${bad} fail · ${nrows} rows${Object.keys(byKind).length ? ' (' + Object.entries(byKind).map(([k, v]) => k + ' ' + v).join(', ') + ')' : ''} · square ${SQ} m · ${nmoved} standing people the game stands past a square (--as-placed: where the data puts them)`);
process.exit(bad ? 1 : 0);
