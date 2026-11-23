#!/usr/bin/env node
/* bake-hero-tower.js — THE SUPERHERO TOWER, ITS FLOORS (2026-11-23, step 1 of mondo's plan "Every door opens + a bigger Disaster City",
   https://claude.ai/artifact/RVPh8wvd9u6uAPj6QubPnd, picture 4; his go-ahead 11-23 16:42).
   Writes ONE room, `site_prebuilt_hero_tower` (site prebuilt_downtown, part `hero_tower`), into data.js between HERO-TOWER-BEGIN / END.
   `--dry-run` prints the counts and the walk check. Never hand-edit between the markers; edit this tool and rerun.
   THE BUILDING: the tower's lobby (G) stays in the city room, walked in from Hero Plaza (districts/H.js IN['P06-04-B1']). Its three lift doors
   (H.js `heroLifts`, written by the city's tool) open THE LIFT PANEL; a floor picked there loads this room once. In here every floor has one
   lift door and the same panel: a floor in this room is reached with a short fade and no loading (map.js THE TOWER LIFT, three-renderer.js
   `liftHop`); G goes back to the lobby.
   THE ROOM is the tower's own footprint, 8 x 8 squares of 3.5 m, the city's compass (a place here = the city place minus (21, -63)); squares
   are (u west to east, v north to south). EIGHT LEVELS, 5.25 m apart: FLOOR 1 at 0 (the field) up to FLOOR 7 at 31.5, THE ROOF at 36.75.
   Floor 1 stands one lobby (7 m) over the plaza, so the city outside the glass is drawn 22.75 m down (THE VIEW OUT: the city's own rows).
   HOW IT STANDS (the castle's rules, bake-camelot-castle.js, whose kit this tool carries): every floor over floor 1 is a `bridge` slab; an
   upper wall carries `y0`, its own foot; a prop / a native on a floor carries `y` = that floor's height. There is no stair: the lift is the
   way between floors (a stair may not stand over a walked room), so nothing is ever walked under a flight.
   Notes: docs/notes/areas-complexes.md "THE SUPERHERO TOWER, THE FLOORS". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run'), C = 3.5, T = 0.3, DW = 1.75, DH = 2.2;
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData({ quiet: true });
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
const ID = 'site_prebuilt_hero_tower', CITY = 'site_prebuilt_downtown_streets';
const CX = 21, CZ = -63, GROUND = 15.75, LOBBY = 7, DOWN = GROUND + LOBBY;   // the tower's middle in the city, the plaza's height there, the lobby's height
const U = n => 'urban:' + n;
const MARBLE = 'marble_light', CHECK = U('TileMarble1a'), ALU = 'aluminium', METAL = 'metal', WOOD = 'wood_planks', GOLD = 'gold', TAR = U('RubberNonSlip1a'), TILE = U('TileGeneric1a');
const PLASTER = U('PlasterWallPainted1a'), CONC = U('ConcreteStriped2a'), HAZ = U('SignHazard1a');
const CREAM = 0xf4efe4, DARK = 0x3a3d42, STEEL = 0xc8ccd0, NAVY = 0x22304a, RED = 0xc8303a, BLUE = 0x2f5fb8, GILT = 0xd8b050;

/* ── THE KIT: one room on its squares (bake-camelot-castle.js mk, trimmed) ── */
const NU = 8, NV = 8, W = NU * C, DD = NV * C, X = u => r2(-W / 2 + u * C), Z = v => r2(-DD / 2 + v * C);
const R = { F: [], P: [], props: [], doors: [], npc: [], inner: [], block: {}, must: [], stops: [], lvl: 0 };
const sq = (u, v) => Math.floor(u) + ',' + Math.floor(v) + '@' + R.lvl;
let wn = 0;
/* a wall on a square line: axis 'u' = west-east on the line v = at; 'v' = north-south on the line u = at; a..b squares.
   o: h, y0, key / tint / glow, doors [[middle, leaf]], gaps [[from, to]], draw: false, walk: false, glass (a see-through pane with mullions) */
function wall(axis, at, a, b, o) { o = o || {}; const h = o.h || 4.9, y0 = o.y0 || 0, k = (++wn % 9) * 0.003; a += k; b -= k;   // (two wall rows with the very same ends are ONE wall to the engine)
    const seg = (s0, s1) => { if (s1 - s0 < 0.02) return; const m = (s0 + s1) / 2, L = (s1 - s0) * C, px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m);
        if (o.draw !== false && o.glass) pane(axis, px, pz, s0, s1, y0, h, o.mull);
        else if (o.draw !== false) { const p = { s: 'box', p: [r2(px), r2(y0), r2(pz)], size: axis === 'u' ? [r2(L), h, T] : [T, h, r2(L)], uv: [3.5, 1.75] }; if (o.key) p.key = o.key; if (o.tint != null) p.tint = o.tint; if (o.glow) p.glow = o.glow; R.P.push(p); }
        if (o.walk !== false) { const e = Math.min(0.15, L / 2 - 0.01), row = Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(s0) + e), z0: r2(pz), x1: r2(X(s1) - e), z1: r2(pz) } : { x0: r2(px), z0: r2(Z(s0) + e), x1: r2(px), z1: r2(Z(s1) - e) }, { t: T, ghost: true, rail: false });
            row.h = h; row.y = r2(y0 + h); if (y0 > 0) row.y0 = r2(y0); R.F.push(row); } };
    const cuts = (o.doors || []).map(d => ({ a: d[0] - DW / 2 / C, b: d[0] + DW / 2 / C, d })).concat((o.gaps || []).map(g => ({ a: g[0], b: g[1] }))).sort((p, q) => p.a - q.a);
    let cur = a;
    cuts.forEach(c => { seg(cur, c.a); cur = c.b; if (!c.d) return;
        const m = c.d[0], px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m), fr = o.frame != null ? o.frame : 0xd6dade;
        if (h > DH + 0.05) { if (o.glass) pane(axis, px, pz, m - DW / 2 / C, m + DW / 2 / C, y0 + DH, h - DH, o.mull); else { const p = { s: 'box', p: [r2(px), r2(y0 + DH), r2(pz)], size: axis === 'u' ? [DW, r2(h - DH), T] : [T, r2(h - DH), DW], uv: [3.5, 1.75], under: true }; if (o.key) p.key = o.key; if (o.tint != null) p.tint = o.tint; R.P.push(p); } }
        [-1, 1].forEach(sd => R.P.push({ s: 'box', p: axis === 'u' ? [r2(px + sd * (DW / 2 + 0.06)), r2(y0), r2(pz)] : [r2(px), r2(y0), r2(pz + sd * (DW / 2 + 0.06))], size: axis === 'u' ? [0.12, DH + 0.1, T + 0.08] : [T + 0.08, DH + 0.1, 0.12], tint: fr }));
        R.P.push({ s: 'box', p: [r2(px), r2(y0 + DH), r2(pz)], size: axis === 'u' ? [DW + 0.24, 0.12, T + 0.08] : [T + 0.08, 0.12, DW + 0.24], tint: fr });
        if (c.d[1] && c.d[1] !== 'none') { const r = { x: r2(px), z: r2(pz), rot: axis === 'u' ? 0 : 90, w: DW - 0.2, leaf: c.d[1] }; if (y0 > 0) r.y = r2(y0); R.inner.push(r); }
        if (axis === 'u') R.must.push(sq(m, at - 0.5), sq(m, at + 0.5)); else R.must.push(sq(at - 0.5, m), sq(at + 0.5, m)); });
    seg(cur, b); }
/* a see-through glass wall (three-renderer.js arch `kind: 'clear'`, the mall's): the pane, mullions every `mull` squares (half a square), a transom */
function pane(axis, px, pz, s0, s1, y0, h, mull) { const L = (s1 - s0) * C; if (L < 0.05) return; const st = mull || 0.5;
    R.P.push({ s: 'box', p: [r2(px), r2(y0), r2(pz)], size: axis === 'u' ? [r2(L), h, 0.04] : [0.04, h, r2(L)], tint: 0xcfe4f4, kind: 'clear', glow: 0.1 });
    const bar = (m, y, bh, bl) => R.P.push({ s: 'box', p: axis === 'u' ? [r2(X(m)), r2(y), r2(pz)] : [r2(px), r2(y), r2(Z(m))], size: axis === 'u' ? [r2(bl), bh, 0.12] : [0.12, bh, r2(bl)], key: ALU, tint: 0x8e959c });
    for (let s = Math.ceil(s0 / st - 0.01) * st; s <= s1 + 0.001; s += st) bar(s, y0, h, 0.1);
    bar((s0 + s1) / 2, y0, 0.12, L); bar((s0 + s1) / 2, r2(y0 + 0.9), 0.08, L); }
/* a floor over walked ground: a slab the walker stands on (a `bridge` row), whole squares */
const deck = (u0, v0, u1, v1, y, key) => { const ew = (u1 - u0) >= (v1 - v0);
    R.F.push(ew ? { k: 'bridge', x0: X(u0), z0: Z((v0 + v1) / 2), x1: X(u1), z1: Z((v0 + v1) / 2), w: r2((v1 - v0) * C), y, key, rails: false, plain: true }
                : { k: 'bridge', x0: X((u0 + u1) / 2), z0: Z(v0), x1: X((u0 + u1) / 2), z1: Z(v1), w: r2((u1 - u0) * C), y, key, rails: false, plain: true }); };
/* a drawn ceiling: squares u0..u1 x v0..v1, its underside at y (lit from inside: the mall's gain + glow) */
const ceil = (u0, v0, u1, v1, y, tint) => R.P.push({ s: 'box', p: [X((u0 + u1) / 2), r2(y), Z((v0 + v1) / 2)], size: [r2((u1 - u0) * C), 0.14, r2((v1 - v0) * C)], under: true, uv: 3.5, key: PLASTER, tint: tint != null ? tint : 0xf6f4ee, gain: 2.2, glow: 0.4 });
const box = (u, y, v, w, h, d, key, tint, x) => { const p = Object.assign({ s: 'box', p: [X(u), r2(y), Z(v)], size: [w, h, d] }, x || {}); if (key) p.key = key; if (tint != null) p.tint = tint; R.P.push(p); return p; };
const cyl = (u, y, v, r, h, key, tint, x) => { const p = Object.assign({ s: 'cyl', p: [X(u), r2(y), Z(v)], r, h, seg: 16 }, x || {}); if (key) p.key = key; if (tint != null) p.tint = tint; R.P.push(p); return p; };
/* a ghost blocker over squares u0..u1 x v0..v1 (a counter, a stage, the lift core), from the floor up h */
const ghost = (u0, v0, u1, v1, L, h) => { const ew = (u1 - u0) >= (v1 - v0), m = ew ? Z((v0 + v1) / 2) : X((u0 + u1) / 2);
    R.F.push(Object.assign({ k: 'wall' }, ew ? { x0: r2(X(u0) + 0.1), z0: m, x1: r2(X(u1) - 0.1), z1: m, t: r2((v1 - v0) * C - 0.2) } : { x0: m, z0: r2(Z(v0) + 0.1), x1: m, z1: r2(Z(v1) - 0.1), t: r2((u1 - u0) * C - 0.2) }, { ghost: true, rail: false, h, y: r2(L + h) }, L > 0 ? { y0: L } : {}));
    for (let u = Math.floor(u0); u < u1; u++) for (let v = Math.floor(v0); v < v1; v++) R.block[u + ',' + v + '@' + L] = 'block'; };
/* a model. B = it blocks: on the middle of square (u, v) or filling nu x nv squares from it; dec = decor at any spot. Both on floor L */
const B = (key, u, v, face, L, x) => { R.lvl = L; const nu = (x && x.nu) || 1, nv = (x && x.nv) || 1; for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) R.block[sq(u + i, v + j)] = key;
    const o = Object.assign({ key, x: X(u + nu / 2), z: Z(v + nv / 2) }, face != null ? { face } : {}, x || {}); delete o.nu; delete o.nv; if (L > 0) o.y = r2(L + (o.y || 0)); R.props.push(o); return o; };
const dec = (key, u, v, face, L, x) => { const o = Object.assign({ key, x: X(u), z: Z(v) }, face != null ? { face } : {}, x || {}); if (L > 0) o.y = r2(L + (o.y || 0)); else if (!o.y) delete o.y;
    if (CAT[key] && CAT[key].wall && o.y != null) { o.mount = o.y; delete o.y; } R.props.push(o); return o; };
const lamp = (u, v, L) => R.props.push({ key: 'psx_ceiling_lamp_4_on', x: X(u), z: Z(v), ceil: true, y: r2(L + SH - 0.36) });
const bulb = (u, v, L) => R.props.push({ key: 'bare_bulb', x: X(u), z: Z(v), ceil: true, y: r2(L + SH - 0.36) });   // a REAL light (three-renderer.js HQ_PROP_LIGHT_MAX = 10 a room): one a floor
const who = (race, u, v, face, L, gender) => { const n = { x: X(u), z: Z(v), face: face || 0, race }; if (gender) n.gender = gender; if (L > 0) n.y = L; R.npc.push(n); };
const sign = (words, u, v, y, w, h, ry, fg, bg, font) => R.P.push({ s: 'quad', p: [X(u), r2(y), Z(v)], size: [w, h], ry: ry || 0, key: 'txt:' + words + '|' + (fg || '#f0f0f0') + '|' + (bg || '') + '|' + r2(w / h) + '||' + (font || 'stencil'), uv: 'fit', kind: bg ? 'wall' : 'over' });
const stop = (u, v, L) => R.stops.push([u, v, L]);

/* ════ THE TOWER ════ */
const SH = 5.25, WH = 4.9, LEVELS = [0, 1, 2, 3, 4, 5, 6].map(i => r2(i * SH)), ROOF = r2(7 * SH);
const FLOORS = [
    { n: '1', name: 'SECURITY', sub: 'THE LIFT HALL · THE CHECKPOINT', floor: CHECK },
    { n: '2', name: 'PRESS + FAN MAIL', sub: 'THE BRIEFING ROOM · THE MAIL ROOM', floor: 'terrazzo' },
    { n: '3', name: 'COSTUME DEPARTMENT', sub: 'THE RACKS · THE LOCKERS', floor: U('WoodFlooring1a') },
    { n: '4', name: 'TRAINING FLOOR', sub: 'THE RING · THE WEIGHTS', floor: TAR },
    { n: '5', name: 'THE LAB', sub: 'THE BENCHES · THE CLEAN ROOM', floor: TILE },
    { n: '6', name: 'MONITOR ROOM', sub: 'THE CITY ON SCREENS', floor: U('TileGeneric3a') },
    { n: '7', name: 'PENTHOUSE', sub: 'THE BOARDROOM', floor: U('WoodFlooring1a') },
    { n: 'R', name: 'THE ROOF', sub: 'THE HELIPAD · THE VIEW', floor: CONC },
];
const HALL = [3, 6, 6, 7];   // the lift hall in front of the doors: squares u 3..5, v 6 stay clear on every floor (the arrival)
const LIFT_U = 4.5;          // the lift door's middle (square 4, on the core's north face)

/* every floor: the slab (over floor 1), the ceiling, the glass all round, the lift core with its door, the lights, the floor sign */
function shell(i) {
    const L = i < 7 ? LEVELS[i] : ROOF, top = L + SH, F = FLOORS[i];
    R.lvl = L;
    if (i > 0) deck(0, 0, 8, 8, L, F.floor);
    liftDoor(i, L, F);
    if (i === 7) return;
    ceil(0, 0, 8, 8, r2(top - 0.34), i === 5 ? 0xd8e0e8 : i === 6 ? 0xf0e6d4 : null);
    /* THE GLASS: four faces, corner piers, a slab edge band outside; the core's back is solid */
    const G = { glass: true, y0: L, h: WH, mull: 0.5 };
    wall('u', 0, 0, 8, G); wall('v', 0, 0, 8, G); wall('v', 8, 0, 8, G);
    wall('u', 8, 0, 2, G); wall('u', 8, 6, 8, G); wall('u', 8, 2, 6, { y0: L, h: WH, key: MARBLE, tint: CREAM });
    for (const c of [[0, 0], [8, 0], [0, 8], [8, 8]]) box(c[0], L, c[1], 0.7, WH, 0.7, MARBLE, 0xe8e2d6);
    for (const q of [[4, 0, 28.6, 0.5], [4, 8, 28.6, 0.5], [0, 4, 0.5, 28.6], [8, 4, 0.5, 28.6]]) box(q[0], L + WH - 0.05, q[1], q[2], 0.45, q[3], ALU, 0x5a6068);   // the band at the slab's edge
    /* THE CORE: the lift shaft's casing (squares 2..5 on the south row), the door in square 4, a call panel and an indicator */
    box(4, L, 7.46, 13.8, WH, 3.1, MARBLE, CREAM); ghost(2, 7, 6, 8, L, WH);
    box(4, L + WH - 0.4, 7.02, 14, 0.2, 0.1, ALU, 0xd6dade);
    /* lights: one real bulb over the lift hall, glowing panels over the rest */
    bulb(4, 5.5, L); for (const q of [[2, 2], [6, 2], [2, 5], [6, 5], [4, 3.5]]) lamp(q[0], q[1], L);
}
/* the lift door on the core's north face, its call button, its floor sign; the lift hall in front of it stays clear */
function liftDoor(i, L, F) {
    dec('psx_elevator_call_button_1', 5.25, 6.98, 0, L, { y: 1.2 }); dec('psx_elevator_screen_1', LIFT_U, 6.98, 0, L, { y: 2.65 });
    sign(F.n === 'R' ? 'ROOF' : 'FLOOR ' + F.n, 2.9, 6.97, L + 2.1, 2.4, 0.5, 0, '#f4f0e6', '#22304a');
    sign(F.name, 2.9, 6.97, L + 1.55, 2.4, 0.4, 0, '#22304a', '#f4efe4', 'sans');
    R.must.push(...[3, 4, 5].map(u => u + ',6@' + L));
    const d = { id: 'lift_' + F.n.toLowerCase(), wall: 'free', x: X(LIFT_U), z: r2(Z(7) - 0.02), face: 0, leaf: null, proc: 'elevator', lift: ID,
        label: 'THE LIFT', sub: (F.n === 'R' ? 'THE ROOF' : 'FLOOR ' + F.n) + ' · ' + F.name, action: { room: CITY, at: 'hero_lift_a' } };   // (action: the map's way back to the lobby; the door itself opens the panel)
    if (L > 0) { d.y = L; d.onDeck = true; }
    R.doors.push(d);
}
for (let i = 0; i < 8; i++) shell(i);

/* ── FLOOR 1 (0 m): SECURITY + THE LIFT HALL ── */
{ const L = LEVELS[0];
  /* the checkpoint across v 4: turnstiles, the arch, the x-ray belt; the guard's desk east of the hall */
  for (const u of [0, 1, 2, 5, 6, 7]) B('turnstile', u, 4, 0, L);
  dec('metal_detector', 3.5, 4.5, 0, L); dec('metal_detector', 4.5, 4.5, 0, L);   // the two arches are the way through (walked)
  B('booking_desk', 6, 5, 270, L); B('computer_chair_grey', 7, 5, 270, L); who('police officer', 7.3, 5.9, 270, L);
  B('riot_gear_rack', 7, 6, 270, L); dec('key_rack', 7.85, 4.6, 270, L, { y: 1.5 });
  /* the waiting side, west of the hall */
  B('curved_couch', 1, 6, 90, L); dec('coffee_table', 1.6, 5.4, 0, L); dec('potted_plant', 0.5, 7.5, 0, L); dec('water_cooler', 2.2, 7.6, 180, L);
  /* north of the line: the screens, the lockers, the camera bank */
  B('monitor_stack', 3, 0, 180, L); B('monitor_stack', 4, 0, 180, L); B('tanker_desk', 3, 1, 180, L); B('tanker_desk', 4, 1, 180, L);
  dec('computer_chair_blue', 3.5, 2.4, 0, L); dec('computer_chair_blue', 4.5, 2.4, 0, L);
  for (const v of [0, 1, 2]) B('office_locker', 7, v, 270, L);
  B('filing_cabinet', 0, 0, 90, L); B('filing_cabinet', 0, 1, 90, L); dec('notice_board', 0.08, 2.5, 90, L, { y: 1.2 });
  dec('security_camera', 0.3, 0.3, 135, L); dec('security_camera', 7.7, 7.2, 315, L);
  dec('rug_office', 4, 2.9, 0, L); dec('office_plant', 6.5, 0.5, 0, L);
  stop(4, 6, L); stop(4, 2.5, L); stop(1, 2.5, L); stop(6.5, 3, L); stop(0.5, 5.5, L);
}
/* ── FLOOR 2 (5.25 m): PRESS + FAN MAIL ── */
{ const L = LEVELS[1];
  /* the briefing room (west): a stage on the north wall, a backdrop, the podium, four rows of chairs, two cameras */
  box(1.75, L, 0.6, 12.2, 0.4, 3.9, WOOD, 0xb08a5c); ghost(0, 0, 3.5, 1.15, L, 0.4);
  box(1.75, L + 0.4, 0.12, 12.2, 3.2, 0.12, null, 0x2a4a8a); sign('THE SUPERHERO TOWER', 1.75, 0.2, L + 2.6, 6, 0.8, 0, '#ffffff', '');
  sign('PRESS BRIEFING', 1.75, 0.2, L + 1.95, 4, 0.45, 0, '#f2c200', '', 'sans');
  dec('church_podium', 1.75, 0.9, 180, L, { y: 0.4 }); dec('pa_speaker', 0.4, 0.5, 160, L, { y: 0.4 }); dec('pa_speaker', 3.1, 0.5, 200, L, { y: 0.4 });
  for (const v of [2, 2.8]) for (const u of [0.5, 1.2, 2.3, 3.0]) dec('folding_chair', u, v, 0, L);
  B('studio_camera', 0, 4, 0, L); B('studio_light', 2, 4, 330, L); dec('directors_chair', 1.2, 5.3, 20, L);
  /* the partition: the mail room behind a glass wall with a door */
  wall('v', 4, 0, 5, { y0: L, h: WH, glass: true, doors: [[4.5, 'leaf_glass']] });
  /* the mail room (east): the boxes, the sorting tables, the sacks */
  B('mailbox_bank', 7, 0, 270, L); B('mailbox_bank', 7, 1, 270, L); B('photocopier', 7, 3, 270, L);
  B('tanker_desk', 5, 1, 0, L); B('tanker_desk', 5, 2, 180, L); dec('newspaper_rack', 4.5, 0.35, 180, L);
  for (const q of [[6.3, 2.5], [6.7, 2.8], [6.1, 3.0], [4.6, 3.6], [5.0, 3.9]]) dec('meshy_burlap_sack', q[0], q[1], q[0] * 40 % 360, L);
  dec('cardboard_boxes', 7.4, 4.4, 0, L); dec('cardboard_boxes', 6.6, 4.6, 30, L);
  who('cameraman', 1.5, 3.6, 0, L); who('delivery boy', 6.3, 1.6, 270, L);
  dec('potted_plant', 0.5, 7.5, 0, L); dec('potted_plant', 7.5, 7.5, 0, L); dec('water_cooler', 6.6, 7.6, 180, L);
  stop(4, 6, L); stop(1.5, 3.5, L); stop(6, 4.5, L);
}
/* ── FLOOR 3 (10.5 m): THE COSTUME DEPARTMENT + THE LOCKERS ── */
{ const L = LEVELS[2];
  for (const u of [0, 2]) for (const v of [0, 2]) B('costume_rack', u, v, 90, L);
  B('steel_table', 1, 4, 0, L); dec('item_hand_mirror', 1.3, 4.4, 0, L, { y: 0.78 });
  /* the fitting corner: a low round stage, three mirrors */
  cyl(1, L, 6.4, 1.2, 0.2, MARBLE, 0xe8dcc8); dec('cheval_mirror', 0.35, 6.4, 90, L); dec('cheval_mirror', 1, 7.6, 180, L); dec('cheval_mirror', 2.0, 7.3, 220, L);
  /* the locker room (east) behind a wall with a swinging door */
  wall('v', 5, 0, 5, { y0: L, h: WH, key: PLASTER, tint: 0xdde4ea, doors: [[4.5, 'leaf_shabby_wood']] });
  for (const v of [0, 1, 2, 3]) B('office_locker', 7, v, 270, L);
  B('locker_bench', 6, 1, 90, L); B('locker_bench', 6, 2, 90, L);
  B('hazmat_suit', 5, 0, 180, L); dec('boxing_gloves', 5.9, 3.6, 30, L, { y: 0.45 });
  B('costume_rack', 3, 4, 0, L);
  who('sidekick', 3.6, 2.5, 270, L);
  dec('rug_round', 1.5, 1.5, 0, L); dec('potted_plant', 7.5, 7.5, 0, L);
  stop(4, 6, L); stop(1.5, 1.5, L); stop(6, 3.5, L); stop(1, 5.4, L);
}
/* ── FLOOR 4 (15.75 m): THE TRAINING FLOOR ── */
{ const L = LEVELS[3];
  B('boxing_ring', 3, 1, 0, L, { nu: 2, nv: 2 });
  B('punching_bag', 0, 1, 0, L); B('punching_bag', 0, 3, 0, L); B('weight_bench', 6, 1, 90, L); B('squat_rack', 6, 3, 90, L);
  B('dumbbell_rack', 7, 2, 270, L); B('medicine_ball_rack', 7, 4, 270, L); B('dojo_weapon_rack', 0, 5, 90, L); B('treadmill', 1, 7, 0, L);
  for (const q of [[2, 0.4], [5.6, 0.4]]) dec('boxing_gloves', q[0], q[1], 0, L);
  box(4, L, 4, 13.8, 0.02, 3.4, HAZ, 0xffffff); box(4, L, 4, 13.8, 0.03, 3.0, TAR, 0x3a6aa8);   // the sparring mat in front of the ring
  sign('TRAIN HARD · SAVE EVERYONE', 4, 0.18, L + 3.5, 7, 0.7, 0, '#ffffff', '#c8303a');
  who('antihero', 3.6, 2.2, 90, L); who('superhero', 0.6, 2.4, 90, L, 'female');
  stop(4, 6, L); stop(4, 4, L); stop(1, 2, L); stop(6.5, 5.5, L);
}
/* ── FLOOR 5 (21 m): THE LAB ── */
{ const L = LEVELS[4];
  for (const q of [[1, 1], [2, 1], [1, 3], [2, 3]]) B('steel_table', q[0], q[1], 0, L);
  dec('lab_glassware', 1.4, 1.5, 0, L, { y: 0.78 }); dec('microscope', 2.6, 1.4, 200, L, { y: 0.78 }); dec('lab_glassware', 2.4, 3.5, 90, L, { y: 0.78 }); dec('microscope', 1.5, 3.6, 30, L, { y: 0.78 });
  dec('specimen_shelf', 1, 0.3, 180, L); dec('specimen_shelf', 2.4, 0.3, 180, L); dec('radiation_sign', 0.08, 2.5, 90, L, { y: 1.7 });
  B('server_rack', 0, 5, 90, L); B('server_rack', 0, 6, 90, L); B('eeg_rack', 2, 5, 0, L);
  /* the clean room (north-east) behind glass, with its own door */
  wall('v', 4, 0, 4, { y0: L, h: WH, glass: true, doors: [[3.5, 'leaf_glass']] }); wall('u', 4, 4, 8, { y0: L, h: WH, glass: true });
  B('robot_arm', 6, 1, 180, L); B('meshy_molten_cryo_tube', 7, 0, 225, L); B('meshy_molten_cryo_tube', 7, 2, 270, L); B('iso_tank', 5, 2, 90, L);
  B('hazmat_suit', 7, 5, 270, L); B('autopsy_table', 6, 5, 0, L);
  box(6, L, 1.5, 6.8, 0.01, 6.8, HAZ, 0xffffff, { glow: 0.1 });
  stop(4, 6, L); stop(1.5, 2, L); stop(5.5, 3.5, L); stop(6, 6.5, L);
}
/* ── FLOOR 6 (26.25 m): THE MONITOR ROOM ── */
{ const L = LEVELS[5];
  for (const u of [1, 2, 3, 4, 5, 6]) B('monitor_stack', u, 0, 180, L);
  for (const u of [1.5, 3.5, 5.5]) box(u + 0.5, L + 2.4, 0.18, 6.6, 1.9, 0.08, null, 0x0a1a2a, { glow: 0.5 });   // the wall of screens over the stacks
  sign('CITY WATCH', 4, 0.25, L + 4.35, 4, 0.45, 0, '#7fe0ff', '', 'sans');
  for (const u of [2, 3, 4, 5]) { B('tanker_desk', u, 2, 180, L); dec('computer_chair_grey', u + 0.5, 3.15, 0, L); }
  B('map_table', 3, 4, 0, L, { nu: 2, nv: 1 });
  B('server_rack', 7, 3, 270, L); B('server_rack', 7, 4, 270, L); dec('world_clocks', 7.92, 1.5, 270, L, { y: 2.05 }); dec('evidence_board', 0.12, 3, 90, L, { y: 1.3 });
  dec('psx_monitoring_screen_mp_1', 2.5, 2.3, 180, L, { y: 0.77 }); dec('psx_monitoring_screen_mp_1', 4.5, 2.3, 180, L, { y: 0.77 });
  who('eagleman', 3.9, 3.4, 0, L);
  dec('water_cooler', 0.5, 7.5, 180, L); dec('office_plant', 7.5, 7.5, 0, L);
  stop(4, 6, L); stop(1, 5, L); stop(6.5, 2, L);
}
/* ── FLOOR 7 (31.5 m): THE PENTHOUSE BOARDROOM ── */
{ const L = LEVELS[6];
  B('conference_table', 2, 2, 90, L, { nu: 2, nv: 1 });
  for (const q of [[2.3, 1.5, 180], [3.0, 1.5, 180], [3.7, 1.5, 180], [2.3, 3.5, 0], [3.0, 3.5, 0], [3.7, 3.5, 0], [1.4, 2.5, 90], [4.6, 2.5, 270]]) dec('exec_chair', q[0], q[1], q[2], L);
  dec('rug_round', 3, 2.5, 0, L);
  B('exec_desk', 6, 1, 180, L); dec('exec_chair', 6.5, 0.6, 180, L); dec('globe_lamp', 7.5, 0.5, 0, L); B('trophy_case', 7, 3, 270, L);
  dec('arms_trophy', 0.1, 1.5, 90, L, { y: 2.2 }); dec('painting_landscape', 0.1, 4, 90, L, { y: 1.6 });
  B('chesterfield_sofa', 1, 5, 90, L); dec('coffee_table', 1.6, 5.5, 0, L); B('mobius_bar', 6, 5, 270, L); dec('bar_stool', 5.6, 5.4, 90, L); dec('bar_stool', 5.6, 5.9, 90, L); B('mini_fridge', 7, 5, 270, L);
  dec('potted_plant', 0.5, 0.5, 0, L); dec('potted_plant', 7.5, 7.5, 0, L);
  who('superhero', 6.5, 1.8, 180, L, 'male');
  stop(4, 6, L); stop(3, 4.5, L); stop(5, 3.5, L); stop(0.5, 6.5, L);
}
/* ── THE ROOF (36.75 m): THE HELIPAD, THE MASTS, THE VIEW ── */
{ const L = ROOF; R.lvl = L;
  /* the parapet all round (a low wall under a coping) */
  for (const q of [['u', 0, 0, 8], ['u', 8, 0, 2], ['u', 8, 6, 8], ['v', 0, 0, 8], ['v', 8, 0, 8]]) { const ax = q[0], at = q[1], a = q[2], b = q[3], m = (a + b) / 2, Ln = (b - a) * C;
      box(ax === 'u' ? m : at, L, ax === 'u' ? at : m, ax === 'u' ? Ln : 0.45, 1.0, ax === 'u' ? 0.45 : Ln, CONC, 0xb8b4ac); box(ax === 'u' ? m : at, L + 1.0, ax === 'u' ? at : m, ax === 'u' ? Ln + 0.1 : 0.6, 0.12, ax === 'u' ? 0.6 : Ln + 0.1, ALU, 0x9aa0a6);
      R.F.push(Object.assign({ k: 'wall' }, ax === 'u' ? { x0: r2(X(a) + 0.15), z0: Z(at), x1: r2(X(b) - 0.15), z1: Z(at) } : { x0: X(at), z0: r2(Z(a) + 0.15), x1: X(at), z1: r2(Z(b) - 0.15) }, { t: T, ghost: true, rail: false, y: r2(L + 1.15), y0: L })); }
  /* the lift's machine room over the core (the door to the lift on its north face), a beacon mast on it */
  box(4, L, 7.46, 13.8, 3.6, 3.1, MARBLE, CREAM); box(4, L + 3.6, 7.5, 14.2, 0.25, 3.3, ALU, 0x9aa0a6); ghost(2, 7, 6, 8, L, 3.6);
  cyl(5.6, L + 3.85, 7.6, 0.1, 6, METAL, 0x3a3d42, { seg: 6 }); box(5.6, L + 9.85, 7.6, 0.4, 0.4, 0.4, null, 0xff2a20, { glow: 1 });
  /* THE HELIPAD: a dark disc, the yellow ring, the white H, the helicopter on it */
  cyl(4, L + 0.01, 3.5, 5.6, 0.05, CONC, 0x3a3d42, { seg: 32 }); cyl(4, L + 0.06, 3.5, 5.3, 0.02, null, 0xf2c200, { seg: 32, ri: 4.9 });
  box(3.55, L + 0.06, 3.5, 0.45, 0.02, 4.2, null, 0xffffff); box(4.45, L + 0.06, 3.5, 0.45, 0.02, 4.2, null, 0xffffff); box(4, L + 0.06, 3.5, 3.6, 0.02, 0.45, null, 0xffffff);
  B('helicopter', 3, 3, 90, L, { nu: 2, nv: 1 });
  for (const a of [0, 45, 90, 135, 180, 225, 270, 315]) { const rr = 5.45 / C; box(4 + Math.sin(a * Math.PI / 180) * rr, L + 0.06, 3.5 - Math.cos(a * Math.PI / 180) * rr, 0.25, 0.12, 0.25, null, 0x8fff9a, { glow: 1 }); }   // the pad's lights
  /* the masts, the dishes, the plant */
  B('radar_antenna', 0, 0, 135, L); B('antenna_dish', 7, 0, 225, L); B('antenna_dish', 7, 2, 270, L); B('flag_pole', 0, 6, 0, L);
  for (const q of [[0.6, 3.2], [0.6, 4.4], [7.4, 4.6], [7.4, 5.8]]) dec('ind_vent', q[0], q[1], 0, L);
  who('superhero', 1.4, 6.2, 315, L, 'female');
  stop(4, 6, L); stop(4, 3.5, L); stop(0.5, 2.5, L); stop(7.5, 6.5, L);
}

/* ── THE VIEW OUT: the city round the tower, as the city's own drawn rows (never an inside), set down 22.75 m, and the streets ── */
const VIEW = { rows: [], parts: 0 };
{ const city = JSON.parse(vm.runInContext('JSON.stringify(DOOR_HQ.rooms.' + CITY + '.terrain)', D)), RAD = +(process.env.TOWER_VIEW || 72);
  const pt = f => typeof f.x === 'number' ? [f.x, f.z] : typeof f.x0 === 'number' ? [(f.x0 + f.x1) / 2, (f.z0 + f.z1) / 2] : null;
  const want = city.features.filter(f => { const q = pt(f); if (!q || !(f.k === 'arch' || (f.k === 'texbuilding' && f.skin !== false))) return false;
      if (/P06-04-B1/.test(f.id || '') || /:in(:|$)/.test(f.id || '') || /^arch:H:beds/.test(f.id || '')) return false;
      return Math.max(Math.abs(q[0] - CX), Math.abs(q[1] - CZ)) < RAD; });
  /* a row with no height of its own stands on the city's ground there: read it off the city's compiled field (a minute) */
  let hAt = null; if (want.some(f => typeof f.y !== 'number')) { const info = vm.runInContext("hqTerrainInfo('" + CITY + "')", D); hAt = (x, z) => vm.runInContext('hqTerrainHeight', D)(info, x, z); }
  want.forEach(f => { const r = JSON.parse(JSON.stringify(f)); ['hollow', 'door', 'leaf', 'inner', 'keyIn', 'floorIn'].forEach(k => delete r[k]);
      const y = typeof f.y === 'number' ? f.y : hAt(pt(f)[0], pt(f)[1]);
      if (typeof r.x === 'number') { r.x = r2(r.x - CX); r.z = r2(r.z - CZ); } else { r.x0 = r2(r.x0 - CX); r.x1 = r2(r.x1 - CX); r.z0 = r2(r.z0 - CZ); r.z1 = r2(r.z1 - CZ); }
      r.y = r2(y - DOWN); r.id = 'tower:view:' + (f.id || VIEW.rows.length); VIEW.parts += (r.parts || []).length; VIEW.rows.push(r); });
  /* the streets: one sheet of the city's road under it all, the plaza's stone round the tower's foot */
  VIEW.rows.push({ k: 'arch', id: 'tower:view:ground', x: 0, z: 0, y: 0, parts: [
      { s: 'box', p: [0, r2(-DOWN - 0.6), 0], size: [600, 0.4, 600], key: U('AsphaltRoad1a'), tint: 0x8a8a88, uv: 7 },
      { s: 'box', p: [0, r2(GROUND - DOWN - 0.3), 0], size: [42, 0.3, 42], key: U('TileGeneric1a'), tint: 0xc8c4bc, uv: 3.5 },
      { s: 'box', p: [0, r2(-DOWN - 0.3), 0], size: [28.2, r2(DOWN - 0.4), 28.2], key: MARBLE, tint: 0xe0dace } ] });   // (the tower's own shaft under floor 1, seen from the roof's edge)
}

/* ── the room's text ── */
R.spawn = { x: X(LIFT_U), z: r2(Z(6.4)), face: 0 };
const check = () => { R.props.forEach(p => { if (!CAT[p.key]) throw new Error('not in the catalogue: ' + p.key); }); R.npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error('not a unit: ' + n.race); });
    const bad = R.must.filter(k => R.block[k]).map(k => R.block[k] + ' @ ' + k); if (bad.length) throw new Error('a blocker stands in a doorway or the lift hall: ' + bad.join(' · ')); };
check();
const STOPS = [{ id: 'G', label: 'THE LOBBY', sub: 'HERO PLAZA · THE WAY OUT', room: CITY, at: 'hero_lift_a' }].concat(FLOORS.map(F => ({ id: F.n, label: F.name, sub: F.sub, room: ID, at: 'lift_' + F.n.toLowerCase() })));
const rows = R.F.concat([{ k: 'arch', id: 'tower:in', x: 0, z: 0, y: 0, parts: R.P }], VIEW.rows);
if (R.inner.length) rows.push({ k: 'texbuilding', id: 'tower:doors', x: 0, z: 0, w: 2, d: 2, rot: 0, storeys: 1, skin: false, doorsOnly: true, leaf: 'leaf_glass', inner: R.inner });
const SKY = vm.runInContext('JSON.stringify(DOOR_HQ.rooms.' + CITY + '.shell.sky)', D);
const M = [];
M.push("        /* HERO-TOWER-BEGIN — THE SUPERHERO TOWER, ITS FLOORS (2026-11-23): written by `node bake-hero-tower.js` (mondo's plan, picture 4). Never hand-edit between the markers; edit the tool and rerun. */");
M.push('        ' + ID + ': {');
["label: 'DISASTER CITY · THE SUPERHERO TOWER',", "sub: 'SECURITY · PRESS · COSTUMES · TRAINING · THE LAB · THE MONITOR ROOM · THE PENTHOUSE · THE ROOF',", "kind: 'box', site: 'prebuilt_downtown', part: 'hero_tower',",
 "shell: {", "    w: " + W + ", d: " + DD + ", h: 40, wallH: 40, dadoH: 1.2, open: true, edge: 'open',",
 "    floor: '" + CHECK + "', wall: '" + PLASTER + "', dado: 'urban:TileMarble2d', trim: 'metal', ceiling: 'ceiling', apron: 'urban_street', skirt: 'concrete',",
 "    apronColor: 0xc9c6bd, floorColor: 0xffffff, wallColor: 0xf4f2ec, dadoColor: 0xdcd8d0, ceilColor: 0xf6f4ee,",
 "    pipes: false, strips: false, lights: [], sunShadow: false,   // no sun shadow: the floors would stand in the slabs' shadow (three-renderer.js _hqShadowArm)",
 "    mood: { light: 0xfff4e0, ambient: 0.8 },", "    sky: " + J(JSON.parse(SKY)) + ",   // the city's own sky: it is the same afternoon outside the glass",
 "    plate: { x: " + R.spawn.x + ", z: 0, y: 3.4 },", "},",
 "parti: 'The tower over its lobby: seven floors and the roof stacked on the tower’s own 8 x 8 squares, glass all round, the lift core on the south side; the lift is the only way between floors.',",
 "liftStops: " + J(STOPS) + ",   // THE TOWER LIFT (map.js): the panel's buttons, G first; a stop in this room is a hop with no loading",
].forEach(l => M.push('            ' + l));
M.push('            terrain: {'); M.push("                res: 0.4375, floor: '" + CHECK + "', cliff: '" + PLASTER + "', path: 'urban:TileMarble2d',"); M.push("                noise: { amp: 0, scale: 6 }, outer: false,   // no outer ground of the field's own: the room draws its own view (THE VIEW OUT)");
M.push('                features: ['); rows.forEach(f => M.push('                    ' + J(f) + ',')); M.push('                ],'); M.push('            },');
M.push('            doors: ['); R.doors.forEach(d => M.push('                ' + J(d) + ',')); M.push('            ],');
M.push('            counters: [],'); M.push('            props: ['); for (let i = 0; i < R.props.length; i += 4) M.push('                ' + R.props.slice(i, i + 4).map(J).join(', ') + ',');
M.push('            ],'); M.push('            agents: [],'); M.push('            npcSpots: ' + J(R.npc) + ','); M.push('            onlineSpots: [],');
M.push('            lines: [],'); M.push('            spawn: ' + J(R.spawn) + ','); M.push('        },'); M.push('        /* HERO-TOWER-END */');
const block = M.join('\n') + '\n';
console.log(JSON.stringify({ rows: R.F.length, parts: R.P.length, props: R.props.length, leaves: R.inner.length, natives: R.npc.length, doors: R.doors.length, view: VIEW.rows.length, viewParts: VIEW.parts, bytes: block.length }));

/* ── write, then walk it: compile the room from the written data.js; from each floor's lift door reach that floor's stops on the walker's own rule ── */
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* HERO-TOWER-END */\n', b0 = src.indexOf('        /* HERO-TOWER-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else { const a = src.indexOf('        /* BAYSIDE-MALL-BEGIN'); if (a < 0) throw new Error('the mall block was not found in data.js'); src = src.slice(0, a) + block + src.slice(a); }
const tmp = path.join(require('os').tmpdir(), 'ew-tower-' + process.pid + '.js'); fs.writeFileSync(tmp, src);
let bad = 0;
try {
    const D2 = require('./load-data.js').loadGameData({ quiet: true, file: tmp });
    const starts = R.doors.map(d => [d.x, r2(d.z - 1.4), d.y || 0]);
    const res = JSON.parse(vm.runInContext(`(function () { var info = hqTerrainInfo('${ID}'), R = info.rules, st = 0.4375, seen = {}, out = { floors: [], n: 0 };
        var key = function (x, z, y) { return Math.round(x / st) + ',' + Math.round(z / st) + ',' + Math.round(y / 1.75); };
        ${JSON.stringify(starts)}.forEach(function (S) { var y0 = hqTerrainFeet(info, S[0], S[1], S[2]); out.floors.push(y0); if (y0 == null || Math.abs(y0 - S[2]) > 0.3) return;
            var q = [[S[0], S[1], y0]]; seen[key(S[0], S[1], y0)] = 1;
            while (q.length) { var c = q.pop(); out.n++; [[st, 0], [-st, 0], [0, st], [0, -st]].forEach(function (d) { var x = c[0] + d[0], z = c[1] + d[1], y = hqTerrainFeet(info, x, z, c[2]);
                if (y == null || y - c[2] > R.climb + 0.01) return; var k = key(x, z, y); if (seen[k]) return; seen[k] = 1; q.push([x, z, y]); }); } });
        var near = function (p) { for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) if (seen[key(p[0] + i * st, p[1] + j * st, p[2])]) return true; return false; };
        out.stops = ${JSON.stringify(R.stops.map(s => [X(s[0]), Z(s[1]), s[2]]))}.map(near);
        var low = 0; for (var k in seen) { if (+k.split(',')[2] < 0) low++; } out.low = low;
        var nan = 0; (info.walls || []).concat(info.bridges || []).forEach(function (r) { for (var k in r) if (typeof r[k] === 'number' && !isFinite(r[k])) nan++; }); out.nan = nan;
        return JSON.stringify(out); })()`, D2));
    const miss = R.stops.filter((s, i) => !res.stops[i]), badFloors = res.floors.map((y, i) => [FLOORS[i].n, y]).filter((q, i) => q[1] == null || Math.abs(q[1] - (starts[i][2])) > 0.3);
    console.log(ID + ': floors at ' + JSON.stringify(res.floors) + ' · walked ' + res.n + ' spots, ' + (R.stops.length - miss.length) + '/' + R.stops.length + ' stops' + (miss.length ? ' · NOT REACHED ' + JSON.stringify(miss) : '') + (badFloors.length ? ' · LIFT DOOR NOT ON ITS FLOOR ' + JSON.stringify(badFloors) : '') + ' · under floor 1 ' + res.low + ' · NaN ' + res.nan);
    bad += miss.length + badFloors.length + res.nan + res.low;
} finally { fs.unlinkSync(tmp); }
if (bad && !process.env.TOWER_FORCE) { console.error('the walk check failed (' + bad + ')'); process.exit(1); }
if (DRY) { fs.writeFileSync(path.join(require("os").tmpdir(), "ew-tower-dry.js"), src); process.exit(0); }
fs.writeFileSync(file, src);
console.log('data.js: ' + ID + ' written (' + block.length + ' bytes)');
