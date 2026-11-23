#!/usr/bin/env node
/* find-doors.js — THE DOOR FINDER (2026-11-23, repo-only tooling; mondo: "I want every building to have an interior. If there is a door the
   player should be able to walk inside of it (very important for a game called DOOR HQ)"; 16:42: "unreachable doors should just either be
   turned into windows or switched to a side of the building where you would be able to walk out on to walkable ground"). Step 1 of the
   plan of record https://claude.ai/artifact/RVPh8wvd9u6uAPj6QubPnd. It reads every terrain room the way the game builds it (data.js
   hqRoomExpand: the texbuildings, the arch rows, the catalogue buildings, THE CHAIN INSIDES' rows) and the walker's own reach (the ground the
   walker gets to from the doors / the spawn, data.js _hqTReachJump, as find-softlocks.js reads it), and lists:

     OPEN       a walk-in: a hollow texbuilding's doorway (or one of its `gaps`), the ground outside it reached       (the goal: every door)
     WALKIN-X   a walk-in whose doorway nobody reaches (the ground outside it is never walked): move the doorway to a reached side
     DRAWN      a painted door or shutter (an arch part in an `urban:Door*` / `urban:MetalShutter*` sheet) that is no walk-in's doorway
     PACK       a whole catalogue building (city_diner, babel_house_*, outhouse, trailer_home_*, ...) with no inside (HQ_WALK_IN_PROPS opens one)
     SOLID      a texbuilding drawn with its own outside (skin) and no inside: its style paints a door on its front
   Each closed door says `reach yes` (open it: a kit inside, or HQ_WALK_IN_PROPS for a catalogue building) or `reach NO` (mondo's rule: make
   it a window, or move it to a side that opens onto walked ground; `sides` lists the building's reached sides when it knows them).

       node find-doors.js <room id> [more ids]     one room each, every closed door listed
       node find-doors.js --all [--jobs 4]         every terrain room (retired ones left out), a table by zone (+ shots/doors/_summary.md)
       node find-doors.js --zone "DISASTER CITY"   the rooms whose label starts with that zone
       --out <dir>   where each room's JSON goes (default shots/doors)       --json   print the rooms' JSON, no table
       --no-reach    skip the walk (fast: counts only, every door `reach ?`)

   A row's x, z are the room's own metres (the F3 line's). The goal is zero closed doors. Run it on every room a PR builds or changes.
   Notes: docs/notes/areas-complexes.md "THE DOOR FINDER". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ARGS = process.argv.slice(2), flag = n => ARGS.includes(n), opt = (n, d) => { const i = ARGS.indexOf(n); return i >= 0 ? ARGS[i + 1] : d; };
const OUT = path.resolve(opt('--out', path.join(__dirname, 'shots', 'doors')));
const IDS = ARGS.filter((a, i) => !a.startsWith('--') && !['--out', '--jobs', '--zone'].includes(ARGS[i - 1]));
/* the catalogue's whole buildings with a door of their own (a key that opens is in HQ_WALK_IN_PROPS and is left out). Add a new pack building here. */
/* (11-23, THE OPEN DOORS: `thatched_hut` left the list: the Meshy hut has no door, only lattice windows on all four sides, and its floor stands on
   stilts 0.7 m up with 1.2 m under the eaves: nobody walks in, and nothing on it says you should) */
const BUILDING_PROPS = /^(city_(diner|burgerpiz|6twelve|laundry|vhs_shop|house|quequis_house|pizzeria_shut|gas_store_shut)|trailer_home_\d|abandoned_house|stilt_(hut|house|house_wide)|babel_house_\w+|lighthouse(_tall)?|xmas_house|ebd_buildings_bld_\d+|woods_cabin(_shut)?|outhouse(_shut)?|psx_toilet_cabin_mp_1|church_building|italian_building(_2)?)$/;
const DOOR_SHEET = /^urban:(Door|MetalShutter)/;

function scan(D, id, reach) {
    return vm.runInContext(`(() => {
    const id = ${JSON.stringify(id)}, room = DOOR_HQ.rooms[id], t0 = Date.now(), REACH = ${!!reach};
    const BP = new RegExp(${JSON.stringify(BUILDING_PROPS.source)}), DS = new RegExp(${JSON.stringify(DOOR_SHEET.source)});
    const r2 = v => Math.round(v * 100) / 100, D2R = Math.PI / 180;
    const X = hqRoomExpand(room), CAT = DOOR_HQ.catalogue || {};
    /* the walker's reach (find-softlocks.js THE TRAPS' walk): every node reached from the doors' pads, else the spawn */
    let info = null, G = null, reached = 0;
    if (REACH) { try { info = hqTerrainInfo(id); } catch (e) { info = null; }
        if (info) { const R = info.rules, JP = (R.jump != null) ? R.jump : R.climb, NN = info.nx * info.nz; G = new Float32Array(NN).fill(NaN);
            if (!(info.pads || []).length && room.spawn) info.pads = [{ x: room.spawn.x || 0, z: room.spawn.z || 0, r: 1 }];
            const padNodes = (info.pads || []).map(p => [Math.round((p.x - info.x0) / info.res), Math.round((p.z - info.z0) / info.res)]);
            try { _hqTReachJump(info, padNodes, null, _hqTClimbLim(info, JP)).forEach((y, k) => { if (k < NN) { G[k] = y; reached++; } }); } catch (e) { G = null; } } }
    /* is the ground about (x, z) walked? any reached node within 0.9 m. null = not known (no walk) */
    /* (2026-11-23, THE OPEN DOORS: \`y\` = the door's foot when known: the walked ground must be at that height, ±1.3 m, so a door on a roof hut
       or a gallery is not "reached" by the street under it) */
    const walked = (x, z, yy) => { if (!G) return null; const i0 = Math.round((x - info.x0) / info.res), j0 = Math.round((z - info.z0) / info.res), n = Math.max(1, Math.ceil(0.9 / info.res));
        for (let j = j0 - n; j <= j0 + n; j++) for (let i = i0 - n; i <= i0 + n; i++) { if (i < 0 || j < 0 || i >= info.nx || j >= info.nz) continue; const y = G[j * info.nx + i]; if (y === y && (yy == null || Math.abs(y - yy) < 1.3)) return true; } return false; };
    const yes = v => v === null ? '?' : v ? 'yes' : 'NO';
    const lot = (f, lx, lz) => { const q = (+f.rot || 0) * D2R, c = Math.cos(q), s = Math.sin(q); return [f.x + lx * c - lz * s, f.z + lx * s + lz * c]; };
    /* a building's four sides: which open onto walked ground (1.4 m out of the middle of each) */
    const sides = (f, w, d) => { if (!G) return null; const o = []; [['front', 0, d / 2 + 1.4], ['back', 0, -d / 2 - 1.4], ['right', w / 2 + 1.4, 0], ['left', -w / 2 - 1.4, 0]].forEach(([n, lx, lz]) => { const p = lot(f, lx, lz); if (walked(p[0], p[1])) o.push(n); }); return o; };
    const open = [], closed = [], doorways = [];
    /* 1. THE WALK-INS: every hollow texbuilding's doorway and its gaps */
    X.texb.forEach(f => {
        if (!f.hollow || f.doorsOnly || hqTexbPack(f) || hqTexbPrism(f)) return;
        const Dd = hqTexbDoor(f), d = Math.max(2, +f.d || 8), w = Math.max(2, +f.w || 8), list = [[Dd.lx, d / 2, 0, 1, 'front']];
        (f.gaps || []).forEach(g => { const u = +g.u; if (g.side === 'b') list.push([u, -d / 2, 0, -1, 'back gap']); if (g.side === 'f') list.push([u, d / 2, 0, 1, 'front gap']); if (g.side === 'r') list.push([w / 2, u, 1, 0, 'right gap']); if (g.side === 'l') list.push([-w / 2, u, -1, 0, 'left gap']); });
        list.forEach(([lx, lz, nx, nz, nm]) => {
            const at = lot(f, lx, lz), out = lot(f, lx + nx * 1.4, lz + nz * 1.4), inn = lot(f, lx - nx * 1.2, lz - nz * 1.2);
            doorways.push(at);
            /* (2026-11-23) the ground out of the doorway must be at the floor's height (±1.3 m): a door onto a hillside 6 m up is no way in */
            const hAt = (x, z) => { if (!G) return null; const i = Math.round((x - info.x0) / info.res), j = Math.round((z - info.z0) / info.res); if (i < 0 || j < 0 || i >= info.nx || j >= info.nz) return null; const y = G[j * info.nx + i]; return y === y ? y : null; };
            const fl = hAt(inn[0], inn[1]), ri = walked(inn[0], inn[1]), ro = walked(out[0], out[1], fl);
            const row = { kind: ro === false ? 'WALKIN-X' : 'OPEN', id: f.id || '', door: nm, x: r2(at[0]), z: r2(at[1]), reach: yes(ro), inside: yes(ri) };
            if (ro === false) row.sides = sides(f, w, d);
            (ro === false ? closed : open).push(row);
        });
    });
    const nearDoorway = (x, z) => doorways.some(p => Math.hypot(p[0] - x, p[1] - z) < 1.4);
    /* 2. THE PAINTED DOORS: an arch part in a door / shutter sheet that is no walk-in's doorway */
    (X.arch || []).forEach(a => {
        (a.parts || []).forEach((P, k) => {
            if (!P || typeof P.key !== 'string' || !DS.test(P.key) || !Array.isArray(P.p)) return;
            const sz = P.size || [1, 1, 1], at = lot(a, +P.p[0] || 0, +P.p[2] || 0);
            if (nearDoorway(at[0], at[1])) return;
            if (P.s === 'box' && (sz[1] || 0) < 1.2) return;   // a band / a sill in the sheet, not a door
            if (/^urban:MetalShutter/.test(P.key) && (+P.p[1] || 0) >= 0.9) return;   // a window's shutter (the urban decay pass's roller shutters over the old shutter sheet), not a door
            if ((+P.p[1] || 0) >= 0.5 && (+P.p[1] || 0) < 1.5 && (sz[1] || 0) < 2.0) return;   // a hatch, a shop window in a door's glass sheet (a kiosk's serving window): no doorway
            const fy = (typeof a.y === 'number') ? a.y + (+P.p[1] || 0) : null;   // the door's foot in the room's heights (an arch row's \`y\` = its ground)
            /* the door's two sides: across its thin axis (a quad looks along its own +z) */
            const q = ((+a.rot || 0) + (+P.ry || 0)) * D2R, thinX = P.s === 'box' && (sz[0] || 1) < (sz[2] || 1), ax = thinX ? [Math.cos(q), Math.sin(q)] : [-Math.sin(q), Math.cos(q)];
            const half = (P.s === 'box' ? (thinX ? sz[0] : sz[2]) / 2 : 0) + 1.3;
            const r0 = walked(at[0] + ax[0] * half, at[1] + ax[1] * half, fy), r1 = walked(at[0] - ax[0] * half, at[1] - ax[1] * half, fy);
            /* one door = its halves + a shutter's stacked bands: a part within 1.6 m of a door already listed in the same row joins it */
            const aid = a.id || '', twin = closed.find(r => r.kind === 'DRAWN' && r._a === aid && Math.hypot(r._x - at[0], r._z - at[1]) < 1.6);
            const rc = (r0 === null) ? '?' : (r0 || r1) ? 'yes' : 'NO';
            if (twin) { twin.parts++; if (rc === 'yes') twin.reach = 'yes'; return; }
            const nd = doorways.reduce((m, q) => Math.min(m, Math.hypot(q[0] - at[0], q[1] - at[1])), 1e9);
            closed.push({ kind: 'DRAWN', id: aid + '#' + k, walkinNear: nd < 12 ? r2(nd) : null, sheet: P.key.replace('urban:', ''), x: r2(at[0]), z: r2(at[1]), reach: rc, parts: 1, _a: aid, _x: at[0], _z: at[1] });
        });
    });
    /* 3. THE CATALOGUE BUILDINGS with no inside */
    const props = (room.props || []).concat(X.props || []);
    props.forEach((p, i) => {
        if (!p || !BP.test(p.key || '') || (HQ_WALK_IN_PROPS[p.key] && !p.shut)) return;
        const c = CAT[p.key] || {}, hd = (c.rect && c.rect.hd) || ((c.span || 4) / 2), hw = (c.rect && c.rect.hw) || ((c.span || 4) / 2), f = +p.face || 0;
        const fx = Math.sin(f * D2R), fz = -Math.cos(f * D2R), out = [p.x + fx * (hd + 1.4), p.z + fz * (hd + 1.4)], ro = walked(out[0], out[1]);
        const row = { kind: 'PACK', id: p.key + '@' + i, x: r2(p.x), z: r2(p.z), face: f, reach: yes(ro) };
        if (ro === false && G) { const R0 = (f + 180) % 360; row.sides = sides({ x: p.x, z: p.z, rot: R0 }, 2 * hw, 2 * hd); }
        closed.push(row);
    });
    /* 4. THE SOLID BUILDINGS drawn with their own outside: the style paints a door on the front */
    X.texb.forEach(f => {
        if (f.hollow || f.doorsOnly || f.skin === false || f.flat) return;
        const d = Math.max(2, +f.d || 8), w = Math.max(2, +f.w || 8), out = lot(f, 0, d / 2 + 1.4), ro = walked(out[0], out[1]);
        const row = { kind: 'SOLID', id: f.id || '', look: f.key || f.style || 'style', x: r2(f.x), z: r2(f.z), reach: yes(ro) };
        if (ro === false) row.sides = sides(f, w, d);
        closed.push(row);
    });
    closed.forEach(r => { delete r._a; delete r._x; delete r._z; });
    const n = k => closed.filter(r => r.kind === k).length;
    return { id, label: room.label || id, ms: Date.now() - t0, reach: !!G, reached, open: open.length, walkinX: n('WALKIN-X'), drawn: n('DRAWN'), pack: n('PACK'), solid: n('SOLID'),
             unreachable: closed.filter(r => r.reach === 'NO').length, closed, openRows: open };
    })()`, D);
}

const zoneOf = r => String(r.label || r.id).split(' · ')[0].trim();
const nClosed = r => r.walkinX + r.drawn + r.pack + r.solid;
function line(r) { return `${r.id}  [${r.label}]  walk-ins ${r.open}  closed ${nClosed(r)} (drawn ${r.drawn}, pack ${r.pack}, solid ${r.solid}, walk-in unreached ${r.walkinX})  unreachable ${r.reach ? r.unreachable : '?'}  (${(r.ms / 1000).toFixed(1)} s)`; }
function detail(r, n) { return r.closed.slice(0, n).map(t => `    ${t.kind.padEnd(8)} ${t.id}${t.door ? ' ' + t.door : ''}${t.sheet ? ' ' + t.sheet : ''}${t.look ? ' ' + t.look : ''}  x ${t.x} z ${t.z}  reach ${t.reach}${t.sides ? '  sides walked: ' + (t.sides.join(', ') || 'none') : ''}`).join('\n'); }

if (flag('--child')) {
    const D = require('./load-data.js').loadGameData(); let r; try { r = scan(D, IDS[0], !flag('--no-reach')); } catch (e) { r = { id: IDS[0], err: String(e && e.stack || e).slice(0, 400) }; }
    process.stdout.write('\n@@DOORS@@' + JSON.stringify(r) + '\n'); process.exit(0);
}
(async () => {
    const D = require('./load-data.js').loadGameData();
    let ids = IDS.slice();
    if (flag('--all') || opt('--zone')) { const retired = vm.runInContext('Object.keys(DOOR_HQ.retired || {})', D), zn = opt('--zone');
        ids = vm.runInContext('hqTerrainRooms()', D).filter(id => !retired.includes(id));
        if (zn) { const L = JSON.parse(vm.runInContext('JSON.stringify(Object.fromEntries(hqTerrainRooms().map(id => [id, DOOR_HQ.rooms[id].label || id])))', D)); ids = ids.filter(id => String(L[id]).toUpperCase().startsWith(zn.toUpperCase())); } }
    if (!ids.length) { console.log('usage: node find-doors.js <room id…> | --all [--jobs 4] | --zone "<ZONE>"  [--no-reach]'); process.exit(1); }
    fs.mkdirSync(OUT, { recursive: true });
    const jobs = Math.max(1, +opt('--jobs', 4)), res = [], queue = ids.slice();
    const one = id => new Promise(done => { cp.execFile(process.execPath, ['--max-old-space-size=6000', __filename, '--child', id].concat(flag('--no-reach') ? ['--no-reach'] : []), { maxBuffer: 1 << 28 }, (err, so) => {
        const m = /@@DOORS@@(.*)/.exec(so || ''); const r = m ? JSON.parse(m[1]) : { id, err: String(err || 'no answer').slice(0, 300) };
        fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify(r, null, 1)); res.push(r);
        if (!flag('--json')) console.log(r.err ? `${id}  FAILED ${r.err}` : line(r) + ((ids.length <= 6) ? '\n' + detail(r, 400) : '')); done(); }); });
    await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => { while (queue.length) await one(queue.shift()); }));
    if (flag('--json')) { console.log(JSON.stringify(res)); return; }
    if (ids.length > 1) { const Zs = {}; res.filter(r => !r.err).forEach(r => { const z = Zs[zoneOf(r)] = Zs[zoneOf(r)] || { rooms: 0, open: 0, closed: 0, drawn: 0, pack: 0, solid: 0, walkinX: 0, unreachable: 0 };
            z.rooms++; z.open += r.open; z.closed += nClosed(r); z.drawn += r.drawn; z.pack += r.pack; z.solid += r.solid; z.walkinX += r.walkinX; z.unreachable += r.unreachable; });
        const rows = Object.entries(Zs).sort((a, b) => b[1].closed - a[1].closed);
        const T = ['| zone | rooms | walk-ins | closed | drawn | pack | solid | walk-in unreached | unreachable |', '|---|---|---|---|---|---|---|---|---|']
            .concat(rows.map(([z, v]) => `| ${z} | ${v.rooms} | ${v.open} | ${v.closed} | ${v.drawn} | ${v.pack} | ${v.solid} | ${v.walkinX} | ${v.unreachable} |`));
        const failed = res.filter(r => r.err);
        const md = ['# Doors that do not open, by zone (find-doors.js)', '', T.join('\n'), '', failed.length ? 'FAILED: ' + failed.map(r => r.id).join(', ') : '', '', '## By room (only rooms with a closed door)', '']
            .concat(res.filter(r => !r.err && nClosed(r)).sort((a, b) => zoneOf(a).localeCompare(zoneOf(b))).map(r => '### ' + line(r) + '\n```\n' + detail(r, 400) + '\n```')).join('\n');
        fs.writeFileSync(path.join(OUT, '_summary.md'), md); console.log('\n' + T.join('\n') + '\n\n' + path.join(OUT, '_summary.md')); }
})();
