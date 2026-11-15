#!/usr/bin/env node
/* bake-desert-insides.js — THE DESERT'S INSIDES (2026-11-15, mondo's OK on docs/plans/desert/insides_plan.png). Three rooms behind the
   Desert's doors, each laid on whole 3.5 m squares exactly as the plan draws them (docs/plans/desert/draw-insides.py holds the rectangles):
     site_prebuilt_area51_hangar  HANGAR 18                  22 x 14 squares, 14 m to the roof, mezzanine + catwalk 3.5 m up
     site_prebuilt_area51_ward    THE WHITE ROOMS            16 x 12 squares, two floors, the observation floor looks down through glass
     site_prebuilt_giza_pyramid   INSIDE THE GREAT PYRAMID   14 x 14 squares, three levels (the Pit, the Queen's Chamber, the King's Chamber)
   `node bake-desert-insides.js` writes them into data.js between DESERT-INSIDES-BEGIN / DESERT-INSIDES-END (the first run replaces the old
   hangar + ward literals); `--dry-run` prints the counts and the walk check. Never hand-edit between the markers.
   Squares are (u 0..NU west to east, v 0..NV north to south). A wall stands on a square LINE, a doorway is 1.75 m in the middle of one
   square's edge with a swinging leaf (three-renderer.js _hqBuildTexDoors, the `doorsOnly` carrier row), a blocker stands on a square's
   middle, decor stands off it. Notes: docs/notes/areas-complexes.md "THE DESERT'S INSIDES". */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = __dirname, DRY = process.argv.includes('--dry-run'), C = 3.5, T = 0.3, DW = 1.75, DH = 2.2;
const r2 = v => Math.round(v * 100) / 100;
const J = v => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:').replace(/'/g, "\\'").replace(/"/g, "'");
const D = require('./load-data.js').loadGameData();
const CAT = vm.runInContext('DOOR_HQ.catalogue', D), RACES = vm.runInContext('AVAILABLE_RACES', D);
const U = n => 'urban:' + n, GLS = U('GlassWindowTall1a'), CHAIN = U('MetalFenceChainlink1'), GRILL = U('MetalSubwayGrill1a'), STEEL = U('MetalCorrugatedPainted2a'),
    RIB = U('MetalWallRibbed1a'), PLAS = U('PlasterWallPainted1a'), TILE = U('TileGeneric1a'), FIB = U('FibreCeilingTile1a'), CONC = U('ConcretePanels1a'), STONE = 'bricks_1';

/* ── THE KIT: one room on its squares ── */
function mk(NU, NV, pre) {
    const W = NU * C, Dd = NV * C, X = u => r2(-W / 2 + u * C), Z = v => r2(-Dd / 2 + v * C);
    const R = { NU, NV, W, D: Dd, X, Z, F: [], P: [], props: [], doors: [], npc: [], inner: [], block: {}, free: {}, must: [] };
    const sq = (u, v) => Math.floor(u) + ',' + Math.floor(v);
    /* a wall on a square line. axis 'u' = it runs west-east on the line v = at; 'v' = north-south on the line u = at; from a to b (squares).
       o: h (its height), y0 (its foot: an upper floor's wall hangs over the walker below), key / tint, glass, doors [[middle, leaf, double]]
       (leaf 'none' = the bare doorway), gaps [[from, to]] (a plain opening, whole squares), draw: false (walked only), walk: false (drawn only) */
    R.wall = (axis, at, a, b, o) => { o = o || {}; const h = o.h || 3.5, y0 = o.y0 || 0, base = o.base || 0;
        const seg = (s0, s1) => { if (s1 - s0 < 0.02) return; const m = (s0 + s1) / 2, L = (s1 - s0) * C, px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m);
            if (o.draw !== false) { const p = { s: 'box', p: [px, r2(base + y0), pz], size: axis === 'u' ? [r2(L), h, T] : [T, h, r2(L)], uv: [3.5, 1.75] }; if (o.key) p.key = o.key; if (o.tint != null) p.tint = o.tint; if (o.glass) { p.kind = 'glass'; p.uv = 7; } R.P.push(p); }
            if (o.walk !== false) { const e = Math.min(0.15, L / 2 - 0.01), row = Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(s0) + e), z0: pz, x1: r2(X(s1) - e), z1: pz } : { x0: px, z0: r2(Z(s0) + e), x1: px, z1: r2(Z(s1) - e) }, { t: T, ghost: true, rail: false });
                row.h = h; row.y = r2(base + y0 + h); if (y0 > 0) row.y0 = r2(base + y0); R.F.push(row); } };   // `y` = its top, `y0` = an upper floor wall's own foot (absolute: a stair under the line never lifts it)
        const cuts = (o.doors || []).map(d => ({ a: d[0] - DW / 2 / C, b: d[0] + DW / 2 / C, d })).concat((o.gaps || []).map(g => ({ a: g[0], b: g[1] }))).sort((p, q) => p.a - q.a);
        let cur = a;
        cuts.forEach(c => { seg(cur, c.a); cur = c.b; if (!c.d) return;
            const m = c.d[0], px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m), yb = r2(base + y0), fr = o.frame != null ? o.frame : 0x3a3d42;
            if (h > DH + 0.05) { const p = { s: 'box', p: [px, r2(yb + DH), pz], size: axis === 'u' ? [DW, r2(h - DH), T] : [T, r2(h - DH), DW], uv: [3.5, 1.75], under: true }; if (o.key) p.key = o.key; if (o.tint != null) p.tint = o.tint; if (o.glass) { p.kind = 'glass'; p.uv = 7; } R.P.push(p); }
            [-1, 1].forEach(sd => R.P.push({ s: 'box', p: axis === 'u' ? [r2(px + sd * (DW / 2 + 0.06)), yb, pz] : [px, yb, r2(pz + sd * (DW / 2 + 0.06))], size: axis === 'u' ? [0.12, DH + 0.1, T + 0.08] : [T + 0.08, DH + 0.1, 0.12], tint: fr }));
            R.P.push({ s: 'box', p: [px, r2(yb + DH), pz], size: axis === 'u' ? [DW + 0.24, 0.12, T + 0.08] : [T + 0.08, 0.12, DW + 0.24], tint: fr });
            if (c.d[1] && c.d[1] !== 'none') { const r = { x: px, z: pz, rot: axis === 'u' ? 0 : 90, w: DW - 0.2, leaf: c.d[1] }; if (c.d[2]) r.double = true; if (yb > 0) r.y = yb; R.inner.push(r); }
            /* the squares either side of a doorway stay clear of blockers */
            if (axis === 'u') { R.must.push(sq(m, at - 0.5), sq(m, at + 0.5)); } else { R.must.push(sq(at - 0.5, m), sq(at + 0.5, m)); } });
        seg(cur, b); };
    /* a drawn slab (a ceiling, a roof of a low room): squares u0..u1 x v0..v1, its underside at y */
    R.ceil = (u0, v0, u1, v1, y, key, tint) => { const p = { s: 'box', p: [X((u0 + u1) / 2), y, Z((v0 + v1) / 2)], size: [r2((u1 - u0) * C), 0.14, r2((v1 - v0) * C)], under: true, uv: 3.5 }; if (key) p.key = key; if (tint != null) p.tint = tint; R.P.push(p); };
    /* an upper floor over walked ground: a slab the walker stands on (a bridge row), whole squares */
    R.deck = (u0, v0, u1, v1, y, key) => { const ew = (u1 - u0) >= (v1 - v0);
        R.F.push(ew ? { k: 'bridge', x0: X(u0), z0: Z((v0 + v1) / 2), x1: X(u1), z1: Z((v0 + v1) / 2), w: r2((v1 - v0) * C), y, key, rails: false, plain: true }
                    : { k: 'bridge', x0: X((u0 + u1) / 2), z0: Z(v0), x1: X((u0 + u1) / 2), z1: Z(v1), w: r2((u1 - u0) * C), y, key, rails: false, plain: true }); };
    /* a guard rail on an upper floor's edge: posts + two bars, and a low wall nobody on the floor walks through (the walker below passes under) */
    R.guard = (axis, at, a, b, y, tint) => { const m = (a + b) / 2, L = (b - a) * C, px = axis === 'u' ? X(m) : X(at), pz = axis === 'u' ? Z(at) : Z(m), tn = tint != null ? tint : 0x4a4f56;
        for (const yy of [0.55, 1.05]) R.P.push({ s: 'box', p: [px, r2(y + yy), pz], size: axis === 'u' ? [r2(L), 0.06, 0.06] : [0.06, 0.06, r2(L)], tint: tn });
        for (let s = a; s <= b + 0.001; s += 0.5) R.P.push({ s: 'box', p: axis === 'u' ? [X(s), y, pz] : [px, y, Z(s)], size: [0.07, 1.08, 0.07], tint: tn });
        R.F.push(Object.assign({ k: 'wall' }, axis === 'u' ? { x0: r2(X(a) + 0.15), z0: pz, x1: r2(X(b) - 0.15), z1: pz } : { x0: px, z0: r2(Z(a) + 0.15), x1: px, z1: r2(Z(b) - 0.15) }, { t: T, ghost: true, rail: false, y: r2(y + 1.1), y0: y })); };
    /* a flight of stairs, whole squares wide: from the middle of edge (u0, v0) up to (u1, v1); the head runs 0.4 m into the floor it meets */
    R.stair = (u0, v0, u1, v1, w, h0, h1, model) => { const dx = Math.sign(u1 - u0), dz = Math.sign(v1 - v0);
        R.F.push({ k: 'ramp', x0: X(u0), z0: Z(v0), x1: r2(X(u1) + dx * 0.4), z1: r2(Z(v1) + dz * 0.4), w: r2(w * C), h0, h1, stairs: true, model: model || 'steel', edge: 0.15 });
        for (let u = Math.min(u0, u1); u < Math.max(u0, u1) || u === u0 && u === u1; u++) { for (let v = Math.min(v0, v1); v < Math.max(v0, v1) || v === v0 && v === v1; v++) { R.block[sq(u, v)] = 'stair'; if (v0 === v1) break; } if (u0 === u1) break; } };
    /* a model. `B` = it blocks: it stands on the middle of square (u, v) (whole numbers) or fills nu x nv squares from it; decor takes any spot */
    R.B = (key, u, v, face, x) => { const nu = (x && x.nu) || 1, nv = (x && x.nv) || 1; for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) R.block[sq(u + i, v + j)] = key;
        const o = Object.assign({ key, x: X(u + nu / 2), z: Z(v + nv / 2) }, face != null ? { face } : {}, x || {}); delete o.nu; delete o.nv; R.props.push(o); return o; };
    /* (a catalogue WALL piece stands free at its spot: its `y` is its mount height on the wall beside it) */
    R.dec = (key, u, v, face, x) => { const o = Object.assign({ key, x: X(u), z: Z(v) }, face != null ? { face } : {}, x || {}); if (CAT[key] && CAT[key].wall && o.y != null) { o.mount = o.y; delete o.y; } R.props.push(o); return o; };
    /* a bulb under a ceiling at y (a real light: three-renderer.js HQ_PROP_LIGHT_MAX = 10 a room, so at most eight of these) */
    R.bulb = (u, v, y) => R.props.push({ key: 'bare_bulb', x: X(u), z: Z(v), ceil: true, y });
    R.who = (race, u, v, face, say) => { const n = { x: X(u), z: Z(v), face: face || 0, race }; if (say) n.say = say; R.npc.push(n); R.block[sq(u, v)] = R.block[sq(u, v)] || null; };
    R.lamp = (u, v, y) => R.P.push({ s: 'box', p: [X(u), r2(y - 0.5), Z(v)], size: [0.04, 0.5, 0.04], tint: 0x2a2c30 }, { s: 'cyl', p: [X(u), r2(y - 0.72), Z(v)], r: 0.42, r2: 0.16, h: 0.22, seg: 10, tint: 0x2a2c30 }, { s: 'cyl', p: [X(u), r2(y - 0.78), Z(v)], r: 0.3, h: 0.06, seg: 10, tint: 0xfff4d8, glow: 1 });
    R.sign = (words, u, v, y, w, h, ry, fg, bg, font) => R.P.push({ s: 'quad', p: [X(u), y, Z(v)], size: [w, h], ry: ry || 0, key: 'txt:' + words + '|' + (fg || '#f0f0f0') + '|' + (bg || '') + '|' + r2(w / h) + '||' + (font || 'stencil'), uv: 'fit', kind: bg ? 'wall' : 'over' });
    R.box = (u, v, y, w, h, d, key, tint, x) => { const p = Object.assign({ s: 'box', p: [X(u), y, Z(v)], size: [w, h, d] }, x || {}); if (key) p.key = key; if (tint != null) p.tint = tint; R.P.push(p); return p; };
    return R;
}
const check = (name, R) => { R.props.forEach(p => { if (!CAT[p.key]) throw new Error(name + ': not in the catalogue: ' + p.key); }); R.npc.forEach(n => { if (RACES.indexOf(n.race) < 0) throw new Error(name + ': not a unit: ' + n.race); });
    const bad = R.must.filter(k => R.block[k]).map(k => R.block[k] + ' @ ' + k);
    if (process.env.INS_DUMP) { console.log(name); for (let v = 0; v < R.NV; v++) { let l = ''; for (let u = 0; u < R.NU; u++) { const k = u + ',' + v; l += R.block[k] ? (R.must.indexOf(k) >= 0 ? '!' : 'X') : R.must.indexOf(k) >= 0 ? 'o' : '.'; } console.log(l); } }
    if (bad.length) throw new Error(name + ': a blocker stands in a doorway square: ' + bad.join(' · ')); };

/* ════ HANGAR 18 (22 x 14) ════ */
const HG = mk(22, 14);
{ const R = HG, G = 0x9aa2aa, DARK = 0x5a6268, WH = 0xe4e6e8, sh = { key: STEEL, tint: G }, wh = { key: PLAS, tint: WH };
  /* the west shops, the east bays (the crash tender and the crates stand open on the floor), the floor lift */
  R.wall('v', 4, 0, 4, Object.assign({ doors: [[2.5, 'leaf_security']] }, sh));                                       // ENGINE SHOP
  R.wall('v', 4, 4, 7, { key: CHAIN, tint: 0xc8ccd0, h: 3.5, doors: [[5.5, 'leaf_security']] });                       // PARTS CAGE (chain-link)
  R.wall('v', 4, 7, 10, Object.assign({ doors: [[8.5, 'leaf_security']] }, sh));                                      // FUEL STORE
  R.wall('u', 4, 0, 4, sh); R.wall('u', 7, 0, 4, { key: CHAIN, tint: 0xc8ccd0 });
  R.wall('u', 4, 18, 22, sh); R.wall('u', 7, 18, 22, sh);
  R.wall('v', 18, 0, 4, Object.assign({ gaps: [[1, 3]] }, sh));                                                       // CRASH TENDER: the truck's own two-square mouth
  R.wall('v', 18, 4, 7, Object.assign({ gaps: [[5, 6]] }, sh));                                                       // CRATES
  R.wall('v', 18, 7, 10, Object.assign({ doors: [[8.5, 'leaf_security', 1]] }, sh, { tint: DARK }));                  // FLOOR LIFT
  /* the south row: lockers, briefing, office, lab, the white door's room */
  R.wall('u', 10, 0, 22, Object.assign({ doors: [[6.5, 'leaf_office'], [12.5, 'leaf_office'], [15.5, 'leaf_frosted_single'], [20.5, 'leaf_hospital']] }, wh));
  R.wall('v', 4, 10, 14, Object.assign({ doors: [[12.5, 'leaf_office']] }, wh)); R.wall('v', 9, 10, 14, Object.assign({ doors: [[12.5, 'leaf_office']] }, wh));
  R.wall('v', 13, 10, 14, Object.assign({ doors: [[12.5, 'leaf_frosted_single']] }, wh)); R.wall('v', 18, 10, 14, Object.assign({ doors: [[12.5, 'leaf_hospital']] }, wh));
  /* the low rooms' roofs (3.5 m): the hall goes on up to the trusses over them */
  [[0, 0, 4, 4], [0, 4, 4, 7], [0, 7, 4, 10], [18, 0, 22, 4], [18, 4, 22, 7], [18, 7, 22, 10], [0, 10, 22, 14]].forEach(q => R.ceil(q[0], q[1], q[2], q[3], 3.5, CONC, 0xb0b4b8));
  /* THE SAUCER on its rig, the tape ring on the floor round it. The game draws `saucer_rig` as the landing-gear saucer, 6 m across and
     under 3 m tall, so it stands on the floor and the 3.5 m catwalk crosses over it (seen in the browser 11-15: a pit hid it). */
  R.props.push({ key: 'saucer_rig', x: R.X(11), z: R.Z(5), face: 0 }); for (let u = 10; u < 12; u++) for (let v = 4; v < 6; v++) R.block[u + ',' + v] = 'saucer_rig';
  [[8.5, 2.5, 0], [13.5, 2.5, 0], [8.5, 7.5, 0], [13.5, 7.5, 0], [8.5, 5, 90], [13.5, 5, 90], [11, 2.5, 0], [11, 7.5, 0]].forEach(q => R.dec('warning_tape', q[0], q[1], q[2], { y: 0.01 }));
  /* THE UPPER FLOOR (3.5 m): the catwalk over the saucer, the mezzanine along the south side, the control room in glass at its east end */
  R.deck(10, 1, 12, 8.2, 3.5, GRILL); R.deck(10, 8, 18, 10, 3.5, GRILL);                                                    // (the catwalk runs 0.7 m on over the mezzanine: two slabs that only touch leave a seam the walker falls through)
  R.stair(7, 9.5, 10, 9.5, 1, 0, 3.5, 'steel');                                                                         // up from the floor along the south wall
  R.guard('v', 10, 1, 8, 3.5); R.guard('v', 12, 1, 8, 3.5); R.guard('u', 1, 10, 12, 3.5);
  R.guard('u', 8, 12, 14, 3.5); R.guard('v', 10, 8, 9, 3.5); R.guard('u', 10, 7, 14, 3.5);                             // (the south rail runs on beside the stair: nobody steps off it onto a wall's top)
  const gl = { glass: true, key: GLS, tint: 0x24323a, y0: 3.5, h: 2.8, frame: 0x2a2c30 };
  R.wall('u', 8, 14, 18, gl); R.wall('u', 10, 14, 18, gl); R.wall('v', 18, 8, 10, gl); R.wall('v', 14, 8, 10, Object.assign({ doors: [[9.5, 'leaf_glass']] }, gl));
  R.ceil(14, 8, 18, 10, 6.3, CONC, 0x8a9096);
  R.dec('monitor_stack', 17.2, 8.5, 270, { y: 3.5 }); R.dec('steel_table', 16, 8.45, 0, { y: 3.5 }); R.dec('crt_terminal', 16, 8.45, 0, { y: 4.26 }); R.dec('computer_chair_grey', 16, 9.1, 0, { y: 3.5 });
  R.dec('psx_monitoring_screen_mp_1', 15, 8.4, 0, { y: 4.3 }); R.dec('clipboard_flat', 16.4, 8.5, 20, { y: 4.26 });
  /* the crane hook over the floor (the tape's), the lamps under the trusses, the trusses */
  R.box(15.5, 4, 8.0, 0.1, 6, 0.1, null, 0x2a2c30); R.box(15.5, 4, 7.4, 0.5, 0.6, 0.3, null, 0xd8b020);
  for (let v = 1; v < 14; v += 3) { R.box(11, v, 12.6, 77, 0.5, 0.3, RIB, 0x5a6268); R.box(11, v, 11.2, 77, 0.12, 0.12, RIB, 0x5a6268); }
  [[6, 3], [6, 7], [16, 2], [16, 6], [11, 9]].forEach(q => R.lamp(q[0], q[1], 11.2));
  R.sign('18', 11, 0.06, 7.2, 5.6, 3.6, 0, '#e8eaec'); R.sign('CONTROL', 16, 7.82, 6.0, 3.2, 0.5, 180, '#e8eaec', '#23262b');
  /* ENGINE SHOP */
  R.B('jet_engine_stand', 1, 1, 0); R.B('engine_hoist', 2, 2, 200); R.B('tool_chest', 0, 3, 90); R.dec('tool_pegboard', 0.3, 1.5, 90, { y: 1.2 }); R.dec('psx_metal_barrel_mp_1', 3.4, 0.5, 0); R.dec('cable_drum', 3.3, 3.4, 30);
  /* PARTS CAGE */
  R.B('psx_shelf_mp_2', 0, 4, 90); R.B('psx_shelf_mp_3', 0, 6, 90); R.B('wrapped_pallet', 2, 5, 0); R.dec('psx_supply_crate_1', 1.5, 6.5, 20); R.dec('cardboard_boxes', 3.3, 4.5, 60);
  /* FUEL STORE (the vent behind the tanks) */
  R.B('iso_tank', 0, 7, 90); R.B('iso_tank', 0, 9, 90); R.B('gas_cylinder_rack', 2, 9, 0); R.dec('psx_metal_barrel_mp_2', 1.5, 7.4, 0); R.dec('psx_metal_barrel_mp_3', 2.4, 7.5, 0); R.dec('radiation_sign', 3.6, 9.5, 270, { y: 1.3 });
  /* CRASH TENDER: the fire truck on two squares' width, nose out */
  R.props.push({ key: 'fire_truck', x: R.X(20), z: R.Z(2), face: 270 }); for (let u = 19; u < 22; u++) for (let v = 1; v < 3; v++) R.block[u + ',' + v] = 'fire_truck';
  R.B('hose_rack', 21, 0, 180); R.B('turnout_gear_rack', 19, 3, 0); R.dec('traffic_cone', 18.5, 0.5); R.dec('traffic_cone', 18.5, 3.5);
  /* CRATES: stacks, a way through them */
  R.B('psx_supply_crate_1', 19, 4, 0); R.B('psx_supply_crate_1_2', 21, 4, 90); R.B('wrapped_pallet', 21, 6, 0); R.B('psx_wooden_crate_2', 19, 6, 0); R.dec('psx_wooden_crate_3', 19.5, 4.5, 30, { y: 1.0 }); R.dec('pallet_jack', 20.5, 5.4, 140);
  /* THE FLOOR LIFT: the freight platform under its frame; the tunnel's door is in the east wall (data.js links.area51_dumb) */
  R.box(20, 8.5, 0, 6.4, 0.12, 6.4, GRILL, 0x8a9096); for (const q of [[18.3, 7.3], [21.7, 7.3], [18.3, 9.7], [21.7, 9.7]]) R.box(q[0], q[1], 0, 0.3, 3.4, 0.3, RIB, 0xd8b020);
  R.B('forklift', 19, 9, 300); R.dec('traffic_barrel', 21.5, 7.5);
  /* THE FLOOR: the lanes, the clutter (nothing on a square's middle but the blockers) */
  R.B('forklift', 5, 1, 120); R.B('wrapped_pallet', 6, 5, 0); R.B('psx_supply_crate_1_3', 16, 1, 0); R.dec('traffic_cone', 7.5, 2.5); R.dec('traffic_cone', 14.5, 7.6); R.dec('floor_stain', 6.5, 7.5); R.dec('cable_drum', 16.5, 5.5, 40);
  R.dec('psx_metal_barrel_mp_1', 4.5, 9.5); R.dec('evac_button', 17.7, 5.5, 270, { y: 1.2 }); R.dec('security_camera', 4.3, 0.3, 135, { y: 3.0 });
  /* LOCKERS */
  for (const v of [10, 11, 12]) R.B('office_locker', 0, v, 90); R.B('locker_bench', 2, 11, 0); R.B('turnout_gear_rack', 2, 13, 180); R.dec('footlocker', 3.4, 13.4, 0);
  /* BRIEFING: the screen on the west wall, the chairs facing it */
  R.B('dream_screen', 4, 11, 90); for (const u of [6, 7]) for (const v of [11, 12, 13]) R.dec('folding_chair', u + 0.5 + (v % 2) * 0.12, v + 0.3, 270); R.B('conference_table', 8, 13, 0); R.dec('film_projector', 8.5, 13.5, 270, { y: 0.78 });
  /* OFFICE (the man-door from Room 51 is in its south wall) */
  R.B('tanker_desk', 10, 11, 180); R.dec('exec_chair', 10.5, 10.6, 180); R.B('filing_cabinet', 9, 13, 90); R.B('filing_cabinet', 12, 13, 270); R.dec('desk_lamp', 10.2, 11.4, 0, { y: 0.78 }); R.dec('papers_a', 10.7, 11.5, 30, { y: 0.78 }); R.dec('office_plant', 12.6, 10.5);
  /* LAB: the grey, the tables */
  R.B('autopsy_table', 15, 11, 90); R.B('autopsy_table', 15, 13, 90); R.B('specimen_shelf', 17, 13, 270); R.B('eeg_rack', 13, 10, 90); R.B('steel_table', 17, 10, 90); R.dec('crt_terminal', 17.5, 10.5, 270, { y: 0.76 }); R.dec('privacy_screen', 13.6, 13.4, 60);
  /* THE WHITE DOOR's room */
  R.B('wheelchair', 19, 13, 30); R.B('metro_bench', 21, 10, 270); R.dec('wet_floor_sign', 19.5, 11.5, 40); R.dec('now_serving_sign', 21.7, 12.5, 270, { y: 2.3 });
  for (const q of [[2, 2], [2, 5.5], [2, 8.5], [20, 5.5], [20, 8.5], [2, 12], [6.5, 12], [11, 12], [15.5, 12], [20, 12]]) R.lamp(q[0], q[1], 3.45);
  for (const q of [[2, 2.4], [2, 8.9], [2, 12.4], [11, 12.4], [15.5, 12.4], [20, 12.4]]) R.bulb(q[0], q[1], 3.3);
  /* who is here (their own lines, kept word for word from the old hangar) */
  R.who('men in black', 11.5, 10.6, 180, ['“Badge.” “I have a badge.” “I did not ask if you had one.”', '“Photography is prohibited.” “I have no camera.” “Memory is discouraged.”']);
  R.who('mad scientist', 8.5, 8.4, 20, ['“It is under a tarp.” “Why?” “The tarp is the classified part.”', '“It flew once.” “When?” “Tuesday. Do not write down which.”']);
  R.who('general', 14.5, 2.5, 250, ['“Hangar eighteen.” “There are seventeen hangars.” “Then this one is easy to find.”']);
  R.who('grey', 15.5, 12.5, 270, ['“…” “Is it yours?” “…” “Do you want it back?” “…” “That is a no, then.”']);
  R.doors.push(
      { id: 'white', wall: 'e', z: R.Z(12.5), leaf: 'leaf_hospital', label: 'THE WHITE ROOMS', sub: 'THE WING · PSYCHIATRIC · QUIET PLEASE', action: { room: 'site_prebuilt_area51_ward', at: 'hangar' },
        desc: 'A hospital door in a hangar wall, with a porthole painted over from the other side. The sign says PSYCHIATRIC. Under it, in pencil, FOR THE ONES WHO SAW IT.' },
      { id: 'flightline', wall: 'n', x: R.X(11), leaf: 'leaf_bulkhead', wide: true, label: 'THE FLIGHT LINE', sub: 'THE BIG DOOR · OUT TO RUNWAY 33', action: { room: 'site_prebuilt_area51_desert', at: 'hangar' },
        desc: 'The big door, or the man-sized part of it. Beyond it the apron, the runway, the tower, and the lights that go round the base all night for no reason anyone has filed.' },
      { id: 'vent', wall: 'w', z: R.Z(8.5), secret: true, leaf: null, label: 'A DRAUGHT', sub: 'THE VENT · THE DUCT INTO THE WHITE ROOMS', action: { room: 'site_prebuilt_area51_ward', at: 'vent' },
        desc: 'A vent grille behind the tanks with the screws in a cup beside it. The duct is a person wide and goes to the wing, which is where the air was going anyway.', draft: true });
  R.must.push('11,13', '10,0', '11,0', '21,12', '21,8', '0,8');
  R.spawn = { x: R.X(11.5), z: R.Z(12.9), face: 0 };
  R.lines = ['“Est. 1947.” “Established what?” “That there was nothing here.”', '“The floor lift goes down.” “To where?” “To the D.U.M.B. Everything that goes down goes there.”',
      '“The catwalk is for observation.” “Of what?” “Of the tarp.”', '“The crane hook has been up there since ’52.” “Holding what?” “Its position.”'];
  /* the walk check's stops: [u, v, y] */
  R.stops = [[2, 2, 0], [2, 5.5, 0], [2, 8.5, 0], [20, 2.6, 0], [20.5, 5.5, 0], [20, 8.5, 0], [2, 12.5, 0], [6.5, 12.5, 0], [11.5, 12.5, 0], [15.5, 12.5, 0], [20, 12.5, 0], [11, 0.5, 0], [11, 4, 3.5], [16, 9.5, 3.5], [13, 9, 3.5]];
}

/* ════ THE WHITE ROOMS (16 x 12) ════ */
const WD = mk(16, 12);
{ const R = WD, WH = 0xf2f2f4, wh = { key: PLAS, tint: WH, frame: 0xd0d2d6 }, gl = { glass: true, key: GLS, tint: 0xdfe8ee, frame: 0xd0d2d6 };
  /* THE CELL ROW: eight padded cells down the west wall (3.5 x 7 m each), one standing open; the row's own hall beside them */
  R.wall('v', 2, 0, 8, Object.assign({ doors: [0, 1, 2, 3, 4, 5, 6, 7].map(i => [i + 0.5, i === 5 ? 'none' : 'leaf_cell']) }, wh));
  for (let v = 1; v < 8; v++) R.wall('u', v, 0, 2, wh);
  R.wall('v', 5, 0, 8, Object.assign({ doors: [[0.5, 'leaf_hospital'], [6.5, 'leaf_hospital']] }, wh));
  R.wall('u', 8, 0, 5, Object.assign({ doors: [[3.5, 'leaf_hospital']] }, wh));                                        // QUIET ROOM
  R.wall('v', 5, 8, 12, Object.assign({ doors: [[10.5, 'leaf_hospital']] }, wh));
  /* INTAKE, the yard lane, RECORDS, TREATMENT */
  R.wall('v', 6, 0, 3, Object.assign({ doors: [[1.5, 'leaf_hospital']] }, wh)); R.wall('u', 3, 6, 10, Object.assign({ doors: [[8.5, 'leaf_hospital']] }, wh)); R.wall('v', 10, 0, 3, Object.assign({ doors: [[1.5, 'leaf_office']] }, wh));
  R.wall('v', 12, 0, 3, Object.assign({ doors: [[1.5, 'leaf_office']] }, wh)); R.wall('u', 3, 12, 16, wh);
  R.wall('v', 12, 3, 6, Object.assign({ doors: [[4.5, 'leaf_hospital']] }, wh)); R.wall('u', 6, 12, 16, wh);
  /* THE NURSES' STATION: glass on all four sides, it sees every hall */
  R.wall('u', 4, 6, 10, Object.assign({ doors: [[8.5, 'leaf_glass']] }, gl)); R.wall('u', 7, 6, 10, Object.assign({ doors: [[8.5, 'leaf_glass']] }, gl)); R.wall('v', 6, 4, 7, gl); R.wall('v', 10, 4, 7, gl);
  /* SHOWERS, SERVICE, DOCTOR, THE DAYROOM */
  R.wall('v', 12, 6, 9, Object.assign({ doors: [[6.5, 'leaf_bathroom']] }, wh)); R.wall('v', 14, 6, 9, Object.assign({ doors: [[7.5, 'leaf_security']] }, wh)); R.wall('u', 9, 12, 16, wh);
  R.wall('v', 12, 9, 12, Object.assign({ doors: [[10.5, 'leaf_office']] }, wh));
  R.wall('u', 8, 5, 12, Object.assign({ doors: [[8.5, 'leaf_hospital', 1]] }, wh));
  /* the low rooms' ceilings (3.5 m); the cell row's hall, hall D and the dayroom stand open to the roof (7 m) */
  [[0, 0, 2, 8], [0, 8, 5, 12], [6, 0, 10, 3], [10, 0, 12, 3], [12, 0, 16, 3], [12, 3, 16, 6], [6, 4, 10, 7], [6, 3, 10, 4], [12, 6, 16, 9], [12, 9, 16, 12]].forEach(q => R.ceil(q[0], q[1], q[2], q[3], 3.5, FIB, 0xf4f4f6));
  /* THE OBSERVATION FLOOR (3.5 m): over the long hall and the cross hall, one-way glass down into the cell row and the dayroom */
  R.deck(5, 0, 6, 8, 3.5, TILE); R.deck(5.8, 7, 12, 8, 3.5, TILE);
  R.stair(10.5, 4, 10.5, 7, 1, 0, 3.5, 'precast');                                                                       // up from hall D, beside the station
  const up = { y0: 3.5, h: 3.5 };
  R.wall('v', 5, 0, 8, Object.assign({}, gl, up)); R.wall('u', 8, 5, 12, Object.assign({}, gl, up));                       // the glass over the cell row, over the dayroom
  R.wall('v', 6, 0, 7, Object.assign({}, wh, up)); R.wall('u', 7, 6, 10, Object.assign({}, wh, up)); R.wall('v', 12, 7, 8, Object.assign({}, wh, up));
  R.guard('u', 7, 11, 12, 3.5, 0xd0d2d6); R.guard('v', 10, 4, 7, 3.5, 0xd0d2d6); R.guard('v', 11, 4, 7, 3.5, 0xd0d2d6);
  R.dec('molded_chair', 5.3, 2.5, 90, { y: 3.5 }); R.dec('molded_chair', 5.3, 5.5, 90, { y: 3.5 }); R.dec('clipboard_flat', 5.3, 4, 10, { y: 3.5 }); R.dec('molded_chair', 8.5, 7.7, 180, { y: 3.5 }); R.dec('security_camera', 5.9, 7.9, 225, { y: 6.2 });
  /* the cells: padded on three sides, a cot */
  for (let v = 0; v < 8; v++) { R.dec('wall_padding', 0.12, v + 0.5, 90, { y: 0.1 }); R.dec('wall_padding', 1, v + 0.12, 0, { y: 0.1 }); R.dec('wall_padding', 1, v + 0.88, 180, { y: 0.1 }); R.B('cot', 0, v, 90); }
  R.dec('floor_drain', 3.5, 4); R.dec('wet_floor_sign', 4.4, 2.4, 40); R.B('wheelchair', 4, 7, 300); R.dec('security_camera', 4.8, 0.2, 135, { y: 3.0 });
  /* QUIET ROOM: the telepath */
  R.B('egg_chair', 2, 10, 90); R.dec('rug_round', 2.5, 10.5); R.dec('potted_plant', 0.4, 11.6); R.dec('wall_padding', 0.12, 9.5, 90, { y: 0.1 }); R.dec('wall_padding', 0.12, 10.5, 90, { y: 0.1 }); R.dec('lava_lamp_floor', 4.5, 8.5);
  /* INTAKE: the desk, the scale, the lockers */
  R.B('tanker_desk', 7, 1, 180); R.dec('computer_chair_grey', 7.5, 0.6, 180); R.B('platform_scale', 9, 2, 0); R.B('office_locker', 6, 0, 90); R.B('office_locker', 9, 0, 270); R.dec('clipboard', 7.7, 1.5, 20, { y: 0.78 }); R.dec('now_serving_sign', 8, 0.2, 0, { y: 2.4 });
  /* the yard lane */
  R.B('metro_bench', 10, 2, 90); R.dec('trash_bin', 11.6, 0.5);
  /* RECORDS: files on everyone who saw it */
  for (const u of [12, 13, 14, 15]) R.B(u % 2 ? 'filing_cabinet' : 'meshy_filing_cabinet', u, 0, 0); R.B('library_shelf_full', 15, 2, 270); R.B('paper_shredder', 13, 2, 180); R.dec('newspaper_bundles', 14.4, 2.5, 30); R.dec('papers_b', 13.5, 1.4, 70, { y: 0.01 });
  /* TREATMENT: the chair, the EEG */
  R.B('barber_chair', 14, 4, 180); R.B('eeg_rack', 15, 4, 270); R.B('dream_screen', 14, 3, 0); R.dec('privacy_screen', 12.6, 5.5, 60); R.B('steel_table', 15, 5, 90); R.dec('item_potion_flask', 15.5, 5.5, 0, { y: 0.78 });
  /* THE NURSES' STATION */
  R.B('round_desk', 7, 5, 0); R.dec('computer_chair_blue', 7.5, 5.9, 0); R.B('monitor_stack', 9, 5, 270); R.dec('wall_clock', 8, 4.3, 0, { y: 2.6 }); R.dec('crt_terminal', 7.5, 5.4, 0, { y: 0.78 }); R.dec('clipboard_flat', 7.2, 5.5, 10, { y: 0.78 });
  /* SHOWERS, SERVICE (the storm drain's grate) */
  R.B('shower_stall', 12, 8, 90); R.B('shower_stall', 13, 8, 180); R.dec('floor_drain', 13, 7.3); R.B('sink_row', 13, 6, 0); R.B('ind_vent', 15, 6, 270); R.dec('drain_grate', 15.3, 7.5); R.B('psx_metal_barrel_mp_1', 14, 8, 0); R.dec('pallet_jack', 14.7, 6.5, 200);
  /* DOCTOR: the office, the vent */
  R.B('exec_desk', 14, 10, 180); R.dec('exec_chair', 14.5, 9.6, 180); R.B('chesterfield_sofa', 12, 11, 90); R.B('library_shelf', 15, 11, 270); R.dec('banker_lamp', 14.3, 10.5, 0, { y: 0.78 }); R.dec('vent_grille', 14.5, 11.85, 180, { y: 2.2 }); R.dec('globe_lamp', 13.5, 9.4);
  /* THE DAYROOM: the TV, the tables, the plant nobody waters */
  R.B('psx_tv_table_1', 11, 11, 270); R.dec('tube_tv', 11.5, 11.5, 270, { y: 0.55 }); R.B('curved_couch', 9, 11, 90); R.B('round_table', 6, 9, 0); R.B('round_table', 8, 9, 0);
  for (const q of [[6.5, 8.9, 0], [6.5, 10.1, 180], [5.9, 9.5, 90], [8.5, 10.1, 180], [9.1, 9.5, 270], [7.9, 9.5, 90]]) R.dec('molded_chair', q[0], q[1], q[2]);
  R.B('potted_plant', 5, 11, 0); R.dec('rug_round', 10, 10.4); R.B('air_hockey_table', 6, 11, 90);
  for (const q of [[1, 2], [1, 6], [2.5, 10], [8, 1.5], [11, 1.5], [14, 1.5], [14, 4.5], [8, 5.5], [14, 7.5], [14, 10.5]]) R.lamp(q[0], q[1], 3.45);
  for (const q of [[3.5, 2], [3.5, 6], [8.5, 10], [11.5, 5]]) R.lamp(q[0], q[1], 6.95);
  for (const q of [[3.5, 2.4], [3.5, 6.4], [8.5, 10.4], [2.5, 10.4], [8, 1.9], [14, 4.9], [8, 5.9], [14, 10.9]]) R.bulb(q[0], q[1], q[1] > 9 && q[0] > 5 && q[0] < 12 || q[0] === 3.5 ? 6.8 : 3.3);
  R.who('grey', 1.5, 5.5, 90, ['“…” “How long have you been here?” “…” “Since before it was here.”']);
  R.who('grey', 1.5, 2.5, 90, ['“…” “Room 5150.” “…” “That is the other building.” “…” “It is every building.”']);
  R.who('telepath', 3.5, 10.5, 90, ['“They saw it.” “Saw what?” “What you are about to. Sit down.”', '“The white is a choice.” “Whose?” “Not theirs.”']);
  R.who('men in black', 9.5, 6.5, 200, ['“Visiting hours.” “When are they?” “Over.”', '“Quiet please.” “I did not say anything.” “They heard you think it. Everyone in here does.”']);
  R.doors.push(
      { id: 'hangar', wall: 'e', z: R.Z(10.5), leaf: 'leaf_hospital', label: 'HANGAR 18', sub: 'BACK TO THE HANGAR', action: { room: 'site_prebuilt_area51_hangar', at: 'white' },
        desc: 'The hospital door from the quiet side. The porthole is painted over on this side too, in a different white.' },
      { id: 'yard', wall: 'n', x: R.X(11), leaf: 'leaf_cell', label: 'THE FLIGHT LINE', sub: 'THE YARD GATE · OUT TO THE APRON', action: { room: 'site_prebuilt_area51_desert', at: 'ward' },
        desc: 'A barred gate at the end of the yard lane. The exercise yard is the apron; the exercise is watching the lights go round.' },
      { id: 'stormdrain', wall: 'e', z: R.Z(7.5), secret: true, leaf: null, label: 'A DRAUGHT', sub: 'THE STORM DRAIN · UNDER THE FENCE TO THE FLIGHT LINE', action: { room: 'site_prebuilt_area51_desert', at: 'stormdrain' },
        desc: 'A grate in the service room that is not screwed down, and a culvert under it that goes under the fence. The base floods once a year and this is where the water went.', draft: true },
      { id: 'vent', wall: 's', x: R.X(14.5), secret: true, leaf: null, label: 'A DRAUGHT', sub: 'THE VENT · THE DUCT BACK INTO THE HANGAR', action: { room: 'site_prebuilt_area51_hangar', at: 'vent' },
        desc: 'A grille in the doctor’s wall, warm, and behind it the duct that brings the hangar in.', draft: true });
  R.must.push('15,10', '10,0', '11,0', '15,7', '14,11');
  R.spawn = { x: R.X(11), z: R.Z(1.5), face: 180 };
  R.lines = ['“The deck is for observation.” “Of what?” “Of whoever is on the deck.”', '“Everything is white.” “Why?” “So nothing shows.” “Something shows.” “Yes.”'];
  R.stops = [[1, 0.5, 0], [1, 7.5, 0], [3.5, 4, 0], [2.5, 10, 0], [8, 2.4, 0], [11, 1.5, 0], [14, 1.5, 0], [13, 5.2, 0], [8.5, 6.3, 0], [13.4, 7.4, 0], [15, 8.4, 0], [13.5, 9.5, 0], [8.5, 9.9, 0], [5.5, 4, 0], [5.5, 4, 3.5], [8.5, 7.5, 3.5]];
}

/* ════ INSIDE THE GREAT PYRAMID (14 x 14): the room is carved out of one mass. `#` = stone to the roof; the levels are
   p = the Pit (0 m), 1 = level 1 (3.5 m: the entrance, the passages, the Queen's Chamber), 2 = level 2 (10.5 m: the Antechamber, the King's
   Chamber), 3 = the Relieving Chambers (14 m, the hidden climb over the King); D = the Descent's slope, G = the Grand Gallery's ════ */
const PY = mk(14, 14);
{ const R = PY, L1 = 3.5, L2 = 10.5, L3 = 14, TOP = 18;
  const MAP = [
      '######11######',
      '######11######',
      '11111111##11##',
      '######111111##',
      '#1111#111111##',
      '#1111111##GG##',
      '#1111#DD##GG##',
      '##1###DD##GG##',
      '111###DD##GG##',
      '####ppppppGG##',
      '####ppppppGG##',
      '#####2222222##',
      '#33332222222##',
      '#33332222222##',
  ].map(s => s.split(''));
  if (MAP.some(r => r.length !== 14) || MAP.length !== 14) throw new Error('the pyramid map is not 14 x 14');
  /* the Descent leaves level 1 at v 6 and reaches the Pit's floor at v 9; the Gallery climbs from v 5 to v 11 */
  const lvl = ch => ch === 'p' ? 0 : ch === '1' ? L1 : ch === '2' ? L2 : ch === '3' ? L3 : null;
  const rects = (test, cb) => { const used = MAP.map(r => r.map(() => 0));
      for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) { if (!test(MAP[y][x]) || used[y][x]) continue; let w = 1; while (x + w < 14 && !used[y][x + w] && test(MAP[y][x + w])) w++;
          let h = 1; rows: while (y + h < 14) { for (let i = 0; i < w; i++) if (used[y + h][x + i] || !test(MAP[y + h][x + i])) break rows; h++; }
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[y + j][x + i] = 1; cb(x, y, w, h); } };
  const slab = (x, y, w, h, hh) => R.F.push({ k: 'plateau', x: R.X(x + w / 2), z: R.Z(y + h / 2), w: w * C, d: h * C, h: hh, edge: 0.05 });
  rects(ch => ch === '#', (x, y, w, h) => slab(x, y, w, h, TOP));
  for (const ch of ['1', '2', '3']) rects(c => c === ch, (x, y, w, h) => slab(x, y, w, h, lvl(ch)));
  /* THE DESCENT: level 1 down to the Pit, one slope two squares wide (the mass under it is the slope itself) */
  R.F.push({ k: 'ramp', x0: R.X(7), z0: R.Z(9), x1: R.X(7), z1: R.Z(6), w: 7.6, h0: 0, h1: L1, stairs: true, built: true, edge: 0.05, key: STONE });
  /* THE GRAND GALLERY: level 1 up to level 2, a ramp two squares wide and six long under a corbelled roof 8 m over it */
  R.F.push({ k: 'ramp', x0: R.X(11), z0: R.Z(5), x1: R.X(11), z1: R.Z(11), w: 7.6, h0: L1, h1: L2, stairs: true, built: true, edge: 0.05, key: STONE });
  /* the roofs: every passage and chamber under its own stone ceiling */
  const roof = (u0, v0, u1, v1, y, tint) => { R.ceil(u0, v0, u1, v1, y, STONE, tint != null ? tint : 0xb8a680); R.P[R.P.length - 1].glow = 0.25; };   // (a roof's underside gets no light from the room's lamps: lit a little by itself)
  roof(6, 0, 8, 6, L1 + 3.5); roof(0, 2, 6, 3, L1 + 3.2, 0x8a7a60); roof(8, 2, 12, 5, L1 + 3.5); roof(5, 5, 6, 6, L1 + 3.2); roof(0, 8, 3, 9, L1 + 3.5); roof(2, 7, 3, 8, L1 + 3.2);
  roof(6, 6, 8, 9, L1 + 3.5); roof(4, 9, 10, 11, 5.25, 0x8a7a60);
  /* the Queen's Chamber: a gabled roof */
  R.P.push({ s: 'roof', form: 'gable', p: [R.X(3), L1 + 4.2, R.Z(5.5)], size: [14.2, 2.4, 10.7], key: STONE, tint: 0xc8b890, ds: true });
  /* the Gallery's corbelled roof: three steps closing in, 8 m over the slope */
  for (let i = 0; i < 6; i++) { const y = L1 + (L2 - L1) * (i + 0.5) / 6 + 8; R.box(11, 5.5 + i, y, 7.2, 0.3, 3.6, STONE, 0xd8c080); for (const s of [-1, 1]) { R.box(11 + s * 0.8, 5.5 + i, y - 1.2, 1.4, 1.2, 3.6, STONE, 0xc8b070); R.box(11 + s * 0.92, 5.5 + i, y - 2.4, 0.56, 1.2, 3.6, STONE, 0xb8a060); } }
  roof(10, 11, 12, 14, L2 + 3.5, 0xd8c080); roof(5, 11, 10, 14, L2 + 5.6, 0xd8c080); roof(1, 12, 5, 14, L3 + 2.4, 0x8a7a60);
  /* THE ANTECHAMBER's three stone gates (each a wall across it with one doorway), and the way into the King's Chamber */
  const st = { key: STONE, tint: 0xc8b070, frame: 0x6a5a40, base: L2 };
  R.wall('u', 11, 10, 12, Object.assign({ doors: [[10.5, 'leaf_portcullis']] }, st)); R.wall('u', 12, 10, 12, Object.assign({ doors: [[11.5, 'leaf_portcullis']] }, st)); R.wall('u', 13, 10, 12, Object.assign({ doors: [[10.5, 'leaf_portcullis']] }, st));
  R.wall('v', 10, 11, 14, Object.assign({ doors: [[13.5, 'leaf_vault']] }, st, { h: 5.6 }));
  /* the Queen's niche: a low doorway in her south wall, the passage behind it runs to the back of the Tomb Door */
  R.wall('u', 7, 1, 5, { key: STONE, tint: 0xc8b890, frame: 0x6a5a40, base: L1, doors: [[2.5, 'none']] });
  /* the hidden climb: a ladder up the King's west wall into the Relieving Chambers */
  R.F.push({ k: 'climb', x: r2(R.X(5) + 0.35), z: R.Z(13.5), face: 270, look: 'ladder' });
  /* THE PIT: unfinished, a well in its floor */
  R.props.push({ key: 'ancient_well', x: R.X(8.5), z: R.Z(10.5) }); R.block['8,10'] = 'well';
  R.dec('cave_stone', 4.6, 9.5, 20); R.dec('cave_stone', 9.4, 10.4, 200); R.dec('skull_pile', 5.4, 10.5, 0); R.dec('meshy_rope', 8.9, 10.1, 30); R.dec('psx_cobweb_1', 4.2, 9.2, 0, { y: 2.2 });
  /* the entrance, the passages */
  R.B('brazier', 6, 1, 0); R.dec('cave_torch', 7.75, 3.3, 0); R.dec('cave_torch', 9.5, 4.75, 0); R.dec('skull', 3.4, 2.6, 40); R.dec('cave_stone', 1.5, 2.3, 0); R.dec('psx_cobweb_2', 4.5, 2.2, 0, { y: L1 + 2.2 });
  R.dec('cave_torch', 0.4, 8.25, 0); R.dec('trap_sarcophagus_lid', 2.4, 8.7, 70);
  /* the Queen's Chamber */
  R.B('stone_altar', 1, 5, 90); R.B('stone_urn', 1, 4, 0); R.B('stone_urn', 4, 4, 0); R.dec('brazier', 4.5, 6.5, 0); R.dec('item_heart_scales', 1.5, 5.5, 90, { y: L1 + 1.0 }); R.dec('psx_cobweb_4', 1.2, 4.2, 0, { y: L1 + 2.6 });
  /* the Gallery's foot and head */
  R.dec('cave_torch', 10.25, 4.8, 0); R.dec('cave_torch', 4.4, 10.6, 0);                                                      // (nine lights in all: the Pit has one of them)
  /* the King's Chamber: the sarcophagus, the gold */
  R.B('sarcophagus', 7, 12, 90); R.B('brazier', 5, 11, 0); R.B('brazier', 9, 11, 0); R.B('stone_urn', 5, 13, 0); R.dec('sea_chest', 9.4, 13.5, 200); R.dec('psx_gold_bar_pcs_1', 8.8, 13.6, 30); R.dec('skull', 6.4, 13.6, 100);
  /* the Relieving Chambers */
  R.dec('skull_pile', 2, 13.4, 0); R.dec('paper_sheet', 3.4, 12.6, 30, { y: L3 + 0.01 }); R.dec('psx_cobweb_5', 1.3, 12.3, 0, { y: L3 + 1.6 });
  R.who('mummy', 8.6, 12.4, 270); R.who('anubis', 6.4, 11.5, 135);
  R.doors.push(
      { id: 'north', wall: 'n', x: R.X(7), leaf: 'leaf_frame_only', label: 'GIZA', sub: 'THE NORTH FACE · OUT BY THE NORTH STAIR', action: { room: 'site_prebuilt_area51_desert', at: 'pyramid' },
        desc: 'The way out through the north face. The light at the end of it is the colour of the sand.' },
      { id: 'tomb', wall: 'w', z: R.Z(8.5), leaf: 'leaf_frame_only', label: 'GIZA', sub: 'THE WEST FACE · OUT BESIDE THE TOMB DOOR', action: { room: 'site_prebuilt_area51_desert', at: 'tombside' },
        desc: 'A slab that turns on its middle. It lets out on the west face, a few steps from the Tomb Door.' },
      { id: 'cut', wall: 'w', z: R.Z(2.5), secret: true, leaf: 'leaf_frame_only', label: 'A DRAUGHT', sub: 'THE ROBBERS’ CUT · OUT THROUGH THE WEST FACE', action: { room: 'site_prebuilt_area51_desert', at: 'cut' },
        desc: 'A rough hole hacked through the casing stones. Whoever cut it did not come for the view.', draft: true });
  /* THE TURNING TOMB (mondo 11-15: yes): the King's Chamber holds the door to the puzzle dungeon (data.js PD_DUNGEONS.tomb, level `tomb1`); leaving or solving it comes back here (map.js _pdDoor) */
  R.doors.push({ id: 'turning', wall: 's', x: R.X(7.5), leaf: 'leaf_portcullis', label: 'THE TURNING TOMB', sub: 'THE KING’S CHAMBER · THE DOOR BEHIND THE SARCOPHAGUS', action: { pd: 'tomb1', back: { room: 'site_prebuilt_giza_pyramid', at: 'turning' } },
      desc: 'A door in the south wall of the King’s Chamber, behind the sarcophagus.' });
  R.must.push('6,0', '7,0', '0,8', '0,2', '7,13');
  R.spawn = { x: R.X(7), z: R.Z(1.2), face: 180 };
  R.lines = [];
  R.stops = [[7, 1, L1], [3, 2.5, L1], [3, 5.5, L1], [1.5, 8.5, L1], [7, 10, 0], [11, 12.5, L2], [7.5, 13.4, L2]];
  R.hidden = [[3, 13, L3]];
}
{ const T_ = process.env.INS_TEST || ''; if (/noarch/.test(T_)) WD.P.length = 0; if (/nobridge/.test(T_)) WD.F = WD.F.filter(f => f.k !== 'bridge'); if (/noramp/.test(T_)) WD.F = WD.F.filter(f => f.k !== 'ramp'); if (/nowall/.test(T_)) WD.F = WD.F.filter(f => f.k !== 'wall'); if (/nohung/.test(T_)) WD.F = WD.F.filter(f => !(f.k === 'wall' && f.y0 != null)); if (/nonpc/.test(T_)) WD.npc.length = 0; if (/notele/.test(T_)) WD.npc = WD.npc.filter(n => n.race !== 'telepath'); }
if (process.env.INS_TEST === 'noprops') WD.props.length = 0; if (process.env.INS_TEST === 'nopad') WD.props = WD.props.filter(p => p.key !== 'wall_padding'); if (/noleaf/.test(process.env.INS_TEST || '')) WD.inner.length = 0;
check('the hangar', HG); check('the white rooms', WD); check('the pyramid', PY);

/* ── the rooms' text ── */
function emit(id, R, head, terrainHead) {
    const M = [], F = R.F.concat([{ k: 'arch', id: 'des:' + id + ':in', x: 0, z: 0, parts: R.P }]);
    if (R.inner.length) F.push({ k: 'texbuilding', id: 'des:' + id + ':doors', x: 0, z: 0, y: 0, w: 2, d: 2, rot: 0, storeys: 1, skin: false, doorsOnly: true, leaf: 'leaf_office', inner: R.inner });
    M.push('        ' + id + ': {'); head.forEach(l => M.push('            ' + l));
    M.push('            terrain: {'); terrainHead.forEach(l => M.push('                ' + l));
    M.push('                features: ['); F.forEach(f => M.push('                    ' + J(f) + ',')); M.push('                ],'); M.push('            },');
    M.push('            doors: ['); R.doors.forEach(d => M.push('                ' + J(d) + ',')); M.push('            ],');
    M.push('            counters: [],'); M.push('            props: [');
    for (let i = 0; i < R.props.length; i += 4) M.push('                ' + R.props.slice(i, i + 4).map(J).join(', ') + ',');
    M.push('            ],'); M.push('            agents: [],'); M.push('            npcSpots: ' + J(R.npc) + ','); M.push('            onlineSpots: [],');
    M.push('            lines: ' + J(R.lines) + ','); M.push('            spawn: ' + J(R.spawn) + ','); M.push('        },');
    return M;
}
const OUT = [];
OUT.push("        /* DESERT-INSIDES-BEGIN — THE DESERT'S INSIDES (2026-11-15): written by `node bake-desert-insides.js` from the approved plan (docs/plans/desert/insides_plan.png). Never hand-edit between the markers; edit the tool and rerun. */");
emit('site_prebuilt_area51_hangar', HG, [
    "label: 'AREA 51 · HANGAR 18',", "sub: 'THE FLOOR · THE SAUCER · THE CATWALK · THE CONTROL ROOM · THE FLOOR LIFT · EST. 1947',", "kind: 'box', site: 'prebuilt_area51', part: 'hangar',",
    "shell: hqBunkerShell({ w: " + HG.W + ", d: " + HG.D + ", h: 14, wallH: 14, plate: { x: " + HG.spawn.x + ", z: " + r2(HG.D / 2 - 1.2) + ", y: 3.0 },",
    "                       floor: 'urban:ConcreteStriped1b', wall: 'urban:MetalCorrugatedPainted1a', dado: 'urban:MetalCorrugatedPainted1c', ceiling: 'urban:MetalSubwayGrill1a',",
    "                       floorColor: 0xb0b4b8, wallColor: 0xa8b0b8, dadoColor: 0x7a848c, ceilColor: 0x6a7078,",
    "                       mood: { lamp: 0xeaf4ff, glow: 0xbfe0ff, strip: 0xffffff, light: 0xe8f0ff, ambient: 0.55 }, fog: { color: 0x0c1018, density: 0.008 }, look: HQ_ROOM_LOOKS.hangar }),",
    "parti: 'One hall fourteen metres high with the saucer on its rig under a catwalk; shops, bays and offices round it on whole squares, a glass control room up on the mezzanine.',",
], ["res: 0.4375, floor: 'urban:ConcreteStriped1b', cliff: 'urban:ConcreteStriped2a', path: 'urban:TileGeneric3a',", "noise: { amp: 0, scale: 5 }, crag: false,"]).forEach(l => OUT.push(l));
emit('site_prebuilt_area51_ward', WD, [
    "label: 'AREA 51 · THE WHITE ROOMS',", "sub: 'PSYCHIATRIC · THE CELL ROW · THE DAYROOM · THE OBSERVATION FLOOR · FOR THE ONES WHO SAW IT',", "kind: 'box', site: 'prebuilt_area51', part: 'ward',",
    "shell: hqBunkerShell({ w: " + WD.W + ", d: " + WD.D + ", h: 7, wallH: 7, plate: { x: " + WD.spawn.x + ", z: " + r2(-WD.D / 2 + 1.2) + ", y: 2.8 },",
    "                       floor: 'urban:TileGeneric1a', wall: 'urban:PlasterWallPainted1a', dado: 'urban:PlasterWallPainted1a', ceiling: 'urban:FibreCeilingTile1a',",
    "                       floorColor: 0xe8e8ea, wallColor: 0xf0f0f2, dadoColor: 0xe0e0e4, ceilColor: 0xf4f4f6,",
    "                       mood: { lamp: 0xffffff, glow: 0xffffff, strip: 0xffffff, light: 0xffffff, ambient: 0.62 }, fog: { color: 0xe8e8ec, density: 0.016 }, look: HQ_ROOM_LOOKS.white }),",
    "parti: 'A white wing on whole squares: eight padded cells on a hall, rooms off four corridors round a glass nurses station, and an observation floor over the halls that looks down through glass.',",
], ["res: 0.4375, floor: 'urban:TileGeneric1a', cliff: 'urban:PlasterWallPainted1a', path: 'urban:RubberNonSlip2a',", "noise: { amp: 0, scale: 5 }, crag: false,"]).forEach(l => OUT.push(l));
emit('site_prebuilt_giza_pyramid', PY, [
    "label: 'GIZA · INSIDE THE GREAT PYRAMID',", "sub: 'THE DESCENT · THE PIT · THE QUEEN’S CHAMBER · THE GRAND GALLERY · THE KING’S CHAMBER',", "kind: 'box', site: 'prebuilt_giza', part: 'pyramid',",
    "shell: hqBunkerShell({ w: " + PY.W + ", d: " + PY.D + ", h: 18, wallH: 18, plate: { x: " + PY.spawn.x + ", z: " + r2(-PY.D / 2 + 1.2) + ", y: 6.2 },",
    "                       floor: 'bricks_1', wall: 'bricks_1', dado: 'bricks_1', ceiling: 'bricks_1',",
    "                       floorColor: 0xc8b890, wallColor: 0xc8b890, dadoColor: 0xb8a880, ceilColor: 0x8a7a60,",
    "                       mood: { lamp: 0xffb060, glow: 0xff9a40, strip: 0xffd8a0, light: 0xffe0b0, ambient: 0.8 }, fog: { color: 0x2a2014, density: 0.008 }, look: HQ_ROOM_LOOKS.plateau }),",
    "parti: 'Passages two squares wide cut through one mass of stone on three levels: down to the Pit, level to the Queen, up the Grand Gallery to the King.',",
], ["res: 0.4375, floor: 'bricks_1', cliff: 'bricks_1', path: 'bricks_1',", "noise: { amp: 0, scale: 5 }, crag: false,"]).forEach(l => OUT.push(l));
OUT.push('        /* DESERT-INSIDES-END */');
const block = OUT.join('\n') + '\n';
console.log(JSON.stringify({ hangar: { rows: HG.F.length, parts: HG.P.length, props: HG.props.length, leaves: HG.inner.length }, ward: { rows: WD.F.length, parts: WD.P.length, props: WD.props.length, leaves: WD.inner.length },
    pyramid: { rows: PY.F.length, parts: PY.P.length, props: PY.props.length, leaves: PY.inner.length } }));

/* ── write, then walk it: compile each room from the written data.js and reach every stop from the spawn on the walker's own rule ── */
const file = path.join(REPO, 'data.js'); let src = fs.readFileSync(file, 'utf8');
const END = '        /* DESERT-INSIDES-END */\n', b0 = src.indexOf('        /* DESERT-INSIDES-BEGIN'), b1 = src.indexOf(END);
if (b0 >= 0 && b1 > b0) src = src.slice(0, b0) + block + src.slice(b1 + END.length);
else {   // the first run: the old hangar + ward literals go (from the hangar's own comment line to the Desert's block)
    const a = src.indexOf('        /* ── HANGAR 18 — the floor, the rig, the catwalk, the crane hook, the floor lift ── */'), z = src.indexOf('        /* ── THE FLIGHT LINE — the aprons and taxiways between the berms');
    if (a < 0 || z < a) throw new Error('the old hangar / ward literals were not found in data.js');
    src = src.slice(0, a) + block + src.slice(z);
}
/* the old rooms' rows in HQ_ROOM_HOLES (bake-holes.js: squares nobody could stand on in the OLD floor plans) would cut pits into the new floors: drop them (`node bake-holes.js <room>` writes fresh ones) */
if (!(b0 >= 0 && b1 > b0)) src = src.replace(/^    "site_prebuilt_area51_(hangar|ward)": \[\[.*\n/gm, '');
const tmp = path.join(require('os').tmpdir(), 'ew-insides-' + process.pid + '.js'); fs.writeFileSync(tmp, src);
let bad = 0;
try {
    const D2 = require('./load-data.js').loadGameData({ quiet: true, file: tmp });
    [['site_prebuilt_area51_hangar', HG], ['site_prebuilt_area51_ward', WD], ['site_prebuilt_giza_pyramid', PY]].forEach(([id, R]) => {
        const res = JSON.parse(vm.runInContext(`(function () { var info = hqTerrainInfo('${id}'), R = info.rules, S = ${JSON.stringify(R.spawn)}, st = 0.4375, seen = {}, q = [], out = { stops: [], hidden: [], n: 0 };
            var y0 = hqTerrainFeet(info, S.x, S.z, null); if (y0 == null) return JSON.stringify({ err: 'the spawn is not walked' });
            var key = function (x, z, y) { return Math.round(x / st) + ',' + Math.round(z / st) + ',' + Math.round(y / 1.75); };
            q.push([S.x, S.z, y0]); seen[key(S.x, S.z, y0)] = 1;
            while (q.length) { var c = q.pop(); out.n++; [[st, 0], [-st, 0], [0, st], [0, -st]].forEach(function (d) { var x = c[0] + d[0], z = c[1] + d[1], y = hqTerrainFeet(info, x, z, c[2]);
                if (y == null || y - c[2] > R.climb + 0.01) return; var k = key(x, z, y); if (seen[k]) return; seen[k] = 1; q.push([x, z, y]); }); }
            var near = function (p) { for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) if (seen[key(p[0] + i * st, p[1] + j * st, p[2])]) return true; return false; };
            out.stops = ${JSON.stringify(R.stops.map(s => [R.X(s[0]), R.Z(s[1]), s[2]]))}.map(near); out.hidden = ${JSON.stringify((R.hidden || []).map(s => [R.X(s[0]), R.Z(s[1]), s[2]]))}.map(near);
            out.pads = (info.pads || []).map(function (p) { return [p.door && p.door.id, near([p.x, p.z, p.h])]; });
            return JSON.stringify(out); })()`, D2));
        if (res.err) { console.log(id + ': ' + res.err); bad++; return; }
        const miss = R.stops.filter((s, i) => !res.stops[i]), padMiss = res.pads.filter(p => !p[1]).map(p => p[0]);
        console.log(id + ': walked ' + res.n + ' spots, ' + (R.stops.length - miss.length) + '/' + R.stops.length + ' stops' + (miss.length ? ' · NOT REACHED ' + JSON.stringify(miss) : '') + ' · doors ' + JSON.stringify(res.pads) + (R.hidden ? ' · by the ladder only ' + JSON.stringify(res.hidden) : ''));
        bad += miss.length + padMiss.length;
    });
} finally { fs.unlinkSync(tmp); }
if (bad && !process.env.INS_TEST) { console.error('the walk check failed (' + bad + ')'); process.exit(1); }
if (DRY) process.exit(0);
fs.writeFileSync(file, src);
console.log('data.js: the three insides written (' + block.length + ' bytes)');
